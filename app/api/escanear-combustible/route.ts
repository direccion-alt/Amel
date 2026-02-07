import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI("AIzaSyCQ_Cu2E_NYlaidhfZUWLnoVWC1V8tO_oI")

export async function POST(request: NextRequest) {
  try {
    console.log('📸 Iniciando escaneo de ticket de combustible...')
    
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

    // Prompt especializado para tickets de combustible
    const prompt = `
Eres un asistente experto en leer tickets de combustible/gasolina en México.

Analiza esta imagen de ticket de combustible y extrae la siguiente información en formato JSON:

{
  "litros": número de litros cargados (solo número),
  "monto_pagado": monto total pagado (solo número, sin símbolo de pesos),
  "precio_por_litro": precio por litro si aparece (solo número),
  "estacion_proveedor": nombre de la estación o proveedor (ej: PEMEX, Chevron, Etc),
  "folio_ticket": número de folio o ticket,
  "fecha": fecha del ticket en formato YYYY-MM-DD si aparece,
  "notas": observaciones adicionales o datos relevantes
}

INSTRUCCIONES IMPORTANTES:
- Si un campo no está en el documento, usa null
- Los montos deben ser solo números (ejemplo: 1500.50, no "$1,500.50")
- Los litros deben ser números decimales (ejemplo: 45.5)
- Identifica PEMEX, Chevron, Primax, Arco, etc.
- Si el ticket es de PEMEX y dice "Gasolina" o "Diésel", úsalo
- Extrae SIEMPRE el monto total y litros, son los datos más importantes

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
    
    // Limpiar respuesta
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
      litros: parseFloat(datos.litros) || null,
      monto_pagado: parseFloat(datos.monto_pagado) || null,
      precio_por_litro: parseFloat(datos.precio_por_litro) || null,
      estacion_proveedor: datos.estacion_proveedor || null,
      folio_ticket: datos.folio_ticket || null,
      fecha: datos.fecha || new Date().toISOString().split('T')[0],
      notas: datos.notas || null
    }

    return NextResponse.json({ 
      success: true, 
      datos: datosLimpios,
      raw_response: datos
    })

  } catch (error: any) {
    console.error('❌ Error escaneando ticket:', error)
    console.error('Detalles del error:', {
      message: error.message,
      status: error.status,
      code: error.code,
      name: error.name
    })
    return NextResponse.json({ 
      error: 'Error al procesar el ticket con IA',
      details: error.message,
      errorType: error.name || 'Unknown'
    }, { status: 500 })
  }
}
