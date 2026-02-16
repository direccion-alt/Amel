import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = process.env.GEMINI_API_KEY
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

export async function POST(request: NextRequest) {
  try {
    if (!genAI) {
      return NextResponse.json({ error: "GEMINI_API_KEY no configurada" }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No se proporciono archivo" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const mimeType = file.type || "application/pdf"

    const prompt = `
Eres un asistente experto en leer facturas de compra de articulos y equipos en Mexico.

Extrae SOLO estos campos y responde en JSON valido:
{
  "subtotal": numero,
  "iva": numero,
  "total": numero,
  "proveedor": "Nombre del proveedor",
  "fecha_compra": "YYYY-MM-DD",
  "descripcion_producto": "Descripcion corta del articulo o equipo"
}

INSTRUCCIONES:
- Los montos deben ser solo numeros (ejemplo: 4500.50)
- Si no aparece algun campo, usa null
- La fecha debe estar en formato YYYY-MM-DD
- Responde UNICAMENTE con el JSON, sin texto extra
`

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" })
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
      return NextResponse.json({ error: "Gemini no retorno respuesta valida" }, { status: 500 })
    }

    let jsonText = text
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "")
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "")
    }

    let data: {
      subtotal: number | null
      iva: number | null
      total: number | null
      proveedor: string | null
      fecha_compra: string | null
      descripcion_producto: string | null
    }

    try {
      data = JSON.parse(jsonText)
    } catch (error) {
      return NextResponse.json({ error: "JSON invalido de Gemini" }, { status: 500 })
    }

    return NextResponse.json({
      subtotal: data.subtotal ?? null,
      iva: data.iva ?? null,
      total: data.total ?? null,
      proveedor: data.proveedor ?? null,
      fecha_compra: data.fecha_compra ?? null,
      descripcion_producto: data.descripcion_producto ?? null,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 })
  }
}
