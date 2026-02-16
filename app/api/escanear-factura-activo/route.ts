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
  "proveedor": "Nombre del proveedor",
  "telefono_proveedor": "Telefono del proveedor",
  "fecha_compra": "YYYY-MM-DD",
  "subtotal": numero,
  "iva": numero,
  "total": numero,
  "items": [
    {
      "categoria": "EPP | SEGURIDAD | DIAGNOSTICO | HERRAMIENTA | AUXILIAR | OTRO",
      "cantidad": numero,
      "descripcion": "Descripcion del articulo",
      "subtotal": numero,
      "iva": numero,
      "total": numero
    }
  ]
}

INSTRUCCIONES:
- Los montos deben ser solo numeros (ejemplo: 4500.50)
- La cantidad debe ser un numero (ejemplo: 5). Si no se ve, usa null
- Si no aparece algun campo, usa null
- La fecha debe estar en formato YYYY-MM-DD
- Responde UNICAMENTE con el JSON, sin texto extra

Clasifica categoria segun palabras clave:
- "casco", "chaleco", "guantes", "lentes", "botas" -> EPP
- "extintor", "conos", "triangulo", "botiquin" -> SEGURIDAD
- "scanner", "diagnostico", "multimetro" -> DIAGNOSTICO
- "llave", "matraca", "destornillador", "herramienta" -> HERRAMIENTA
- "lampara", "banda", "cinta", "cable" -> AUXILIAR
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
      proveedor: string | null
      telefono_proveedor: string | null
      fecha_compra: string | null
      subtotal: number | null
      iva: number | null
      total: number | null
      items: Array<{
        categoria: string | null
        cantidad: number | null
        descripcion: string | null
        subtotal: number | null
        iva: number | null
        total: number | null
      }> | null
    }

    try {
      data = JSON.parse(jsonText)
    } catch (error) {
      return NextResponse.json({ error: "JSON invalido de Gemini" }, { status: 500 })
    }

    return NextResponse.json({
      proveedor: data.proveedor ?? null,
      telefono_proveedor: data.telefono_proveedor ?? null,
      fecha_compra: data.fecha_compra ?? null,
      subtotal: data.subtotal ?? null,
      iva: data.iva ?? null,
      total: data.total ?? null,
      items: Array.isArray(data.items) ? data.items : [],
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 })
  }
}
