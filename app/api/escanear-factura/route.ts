// API Route: Escanear Factura con Gemini AI
// Ruta: /app/api/escanear-factura/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Inicializar Gemini con la misma API key que en extract-dates.ts
const genAI = new GoogleGenerativeAI("AIzaSyCQ_Cu2E_NYlaidhfZUWLnoVWC1V8tO_oI")

export async function POST(request: NextRequest) {
  try {
    console.log('📸 Iniciando escaneo de factura...')
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      console.error('❌ No se proporcionó archivo')
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    console.log(`📄 Archivo recibido: ${file.name} (${file.size} bytes, tipo: ${file.type})`)

    // Convertir archivo a base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    
    console.log(`✅ Base64 generado: ${base64.length} caracteres`)
    
    // Determinar mime type
    const mimeType = file.type || 'image/jpeg'
    console.log(`📋 MIME type: ${mimeType}`)

    // Prompt especializado para facturas de mantenimiento automotriz
    const prompt = `
Eres un asistente experto en leer facturas y tickets de servicios automotrices en México.

Analiza esta factura/ticket de mantenimiento y extrae la siguiente información en formato JSON:

{
  "proveedor": "Nombre del taller o proveedor",
  "folio_ticket": "Número de factura o ticket",
  "fecha_servicio": "Fecha en formato YYYY-MM-DD",
  "telefono_proveedor": "Teléfono del proveedor si aparece",
  "direccion_proveedor": "Dirección del proveedor si aparece",
  "descripcion": "Descripción detallada del servicio realizado",
  "sintomas": "Síntomas o fallas reportadas (si aparecen)",
  "monto_refacciones": "Monto de refacciones/partes (solo número, sin símbolos)",
  "monto_mano_obra": "Monto de mano de obra (solo número, sin símbolos)",
  "monto_otros": "Otros gastos como estacionamiento, lavado, etc (solo número)",
  "subtotal": "Subtotal antes de IVA (solo número)",
  "iva": "Monto del IVA (solo número)",
  "monto_total": "Monto total a pagar (solo número)",
  "categoria_sugerida": "Categoría del servicio: ACEITE Y FILTROS, REFACCIONES, MANO DE OBRA, VULCANIZADORA, SUSPENSION, FRENOS, ELECTRICO, u OTRO",
  "tipo_mantenimiento": "PREVENTIVO, CORRECTIVO, EMERGENCIA o REVISION",
  "conceptos": ["Lista de conceptos/servicios realizados"],
  "partidas": [
    {
      "descripcion": "Nombre de la pieza o servicio",
      "cantidad": 1,
      "precio_unitario": 0,
      "total": 0,
      "tipo_mantenimiento": "PREVENTIVO | CORRECTIVO | EMERGENCIA | REVISION",
      "categoria": "ACEITE Y FILTROS | REFACCIONES | MANO DE OBRA | VULCANIZADORA | SUSPENSION | FRENOS | ELECTRICO | OTRO"
    }
  ],
  "notas": "Observaciones adicionales o garantías mencionadas"
}

INSTRUCCIONES IMPORTANTES:
- Si un campo no está en el documento, usa null
- Los montos deben ser solo números (ejemplo: 4500.50, no "$4,500.50")
- La fecha debe estar en formato YYYY-MM-DD
- La descripción debe ser clara y detallada
- Identifica correctamente si es preventivo (cambio de aceite, filtros) o correctivo (reparaciones)
- Si ves "BALATAS", "FRENOS" → categoría FRENOS
- Si ves "ACEITE", "FILTROS" → categoría ACEITE Y FILTROS
- Si ves "LLANTAS", "NEUMÁTICOS" → categoría VULCANIZADORA
- Si ves "SUSPENSIÓN", "AMORTIGUADORES" → categoría SUSPENSION
- Si ves "BATERÍA", "ALTERNADOR", "LUCES" → categoría ELECTRICO

Responde ÚNICAMENTE con el JSON, sin explicaciones adicionales.
`

    // Llamar a Gemini Vision
    console.log('🤖 Llamando a Gemini Vision (gemini-3-flash-preview)...')
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType,
          data: base64
        }
      }
    ])

    console.log('✅ Respuesta recibida de Gemini')
    const response = await result.response
    const text = response.text()
    
    console.log(`📝 Respuesta de Gemini: ${text.substring(0, 200)}...`)
    
    if (!text) {
      throw new Error('Gemini no retornó respuesta válida')
    }
    
    // Limpiar respuesta (remover markdown si existe)
    let jsonText = text.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '')
    }

    // Parsear JSON
    let datos
    try {
      datos = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('Error parseando JSON de Gemini:', jsonText)
      throw new Error(`JSON inválido de Gemini: ${parseError}`)
    }

    // Validar y limpiar datos
    const datosLimpios = {
      proveedor: datos.proveedor || null,
      folio_ticket: datos.folio_ticket || null,
      fecha_servicio: datos.fecha_servicio || new Date().toISOString().split('T')[0],
      telefono_proveedor: datos.telefono_proveedor || null,
      direccion_proveedor: datos.direccion_proveedor || null,
      descripcion: datos.descripcion || 'Servicio de mantenimiento',
      sintomas: datos.sintomas || null,
      monto_refacciones: parseFloat(datos.monto_refacciones) || 0,
      monto_mano_obra: parseFloat(datos.monto_mano_obra) || 0,
      monto_otros: parseFloat(datos.monto_otros) || 0,
      categoria: datos.categoria_sugerida || 'OTRO',
      tipo_mantenimiento: datos.tipo_mantenimiento || 'CORRECTIVO',
      conceptos: datos.conceptos || [],
      partidas: Array.isArray(datos.partidas)
        ? datos.partidas.map((p: any) => ({
            descripcion: p.descripcion || null,
            cantidad: parseFloat(p.cantidad) || 1,
            precio_unitario: parseFloat(p.precio_unitario) || 0,
            total: parseFloat(p.total) || 0,
            tipo_mantenimiento: p.tipo_mantenimiento || null,
            categoria: p.categoria || null,
          }))
        : [],
      notas: datos.notas || null,
      confianza: 'alta' // Indicador de que fue procesado por IA
    }

    return NextResponse.json({ 
      success: true, 
      datos: datosLimpios,
      raw_response: datos // Para debugging
    })

  } catch (error: any) {
    console.error('❌ Error en escaneo de factura:', error)
    console.error('Detalles del error:', {
      message: error.message,
      status: error.status,
      code: error.code,
      name: error.name
    })
    return NextResponse.json({ 
      error: 'Error al procesar la factura con IA',
      details: error.message,
      errorType: error.name || 'Unknown'
    }, { status: 500 })
  }
}
