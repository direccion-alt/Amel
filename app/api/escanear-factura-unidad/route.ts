import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

export async function POST(request: NextRequest) {
  try {
    if (!genAI) {
      console.error('GEMINI_API_KEY no configurada')
      return NextResponse.json({ error: 'GEMINI_API_KEY no configurada' }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No se proporciono archivo' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const mimeType = file.type || 'application/pdf'

    const prompt = `
Eres un asistente experto en leer facturas de compra de unidades en Mexico.

Extrae SOLO estos campos y responde en JSON valido:
{
  "subtotal": numero,
  "iva": numero,
  "total": numero
}

INSTRUCCIONES:
- Los montos deben ser solo numeros (ejemplo: 4500.50)
- Si no aparece algun campo, usa null
- Si encuentras IVA como 16%, calcula el monto si esta claramente indicado el subtotal
- Responde UNICAMENTE con el JSON, sin texto extra
`

    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
    ])

    const text = result.response.text().trim()
    if (!text) {
      return NextResponse.json({ error: 'Gemini no retorno respuesta valida' }, { status: 500 })
    }

    let data: { subtotal: number | null; iva: number | null; total: number | null }
    try {
      data = JSON.parse(text)
    } catch (error) {
      console.error('JSON invalido de Gemini:', text)
      return NextResponse.json({ error: 'JSON invalido de Gemini' }, { status: 500 })
    }

    return NextResponse.json({
      subtotal: data.subtotal ?? null,
      iva: data.iva ?? null,
      total: data.total ?? null,
    })
  } catch (error: any) {
    console.error('Error en escaneo de factura unidad:', error)
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}
