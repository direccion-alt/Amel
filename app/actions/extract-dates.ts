"use server"

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyCQ_Cu2E_NYlaidhfZUWLnoVWC1V8tO_oI");

export async function extraerFechaDesdePDF(pdfUrl: string, campoFecha: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    // 1. Descargamos el archivo desde Supabase para enviárselo directamente a la IA
    const responseFile = await fetch(pdfUrl);
    const buffer = await responseFile.arrayBuffer();
    const base64File = Buffer.from(buffer).toString('base64');

    let instrucciones = "";
    if (campoFecha === 'poliza_seguro_vigencia') {
      instrucciones = `
        TIPO: Póliza de Seguro.
        INSTRUCCIÓN: Busca la sección de VIGENCIA. Ignora la fecha "Desde".
        EXTRAE: La fecha que dice "HASTA las 12:00 P.M. del DD/MES/AAAA".
        CONVIERTE: Meses (ENE=01, FEB=02, MAR=03, ABR=04, MAY=05, JUN=06, JUL=07, AGO=08, SEP=09, OCT=10, NOV=11, DIC=12).
      `;
    
   } else if (campoFecha === 'verificacion_fisico_mecanica') {
      instrucciones = `
        DOCUMENTO: Dictamen de Verificación de Condiciones Físico-Mecánicas (SCT).
        REGLA: Busca la "FECHA" o "FECHA DE EMISION". 
        A veces aparece cerca del número de folio o en la tabla de datos del vehículo.
        IMPORTANTE: Solo necesito la fecha en que se realizó el examen.
      `;
    } else if (campoFecha === 'verificacion_contaminantes') {
      instrucciones = `
        DOCUMENTO: Certificado de Emisiones Contaminantes.
        REGLA: Busca la "FECHA" o "FECHA DE EMISION".
      `;
    }
    const prompt = `
      Analiza visualmente este documento PDF de AMEL Transportes.
      ${instrucciones}
      Responde SOLO la fecha de vencimiento en formato YYYY-MM-DD. 
      Ejemplo: 2026-08-19.
      Si no es clara, responde: null.
    `;

    // 2. Enviamos el prompt Y el archivo como datos binarios
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64File,
          mimeType: "application/pdf"
        }
      }
    ]);

    const text = result.response.text().trim();
    const match = text.match(/\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;

  } catch (error: any) {
    console.error("Error en extracción:", error.message);
    return null;
  }
}