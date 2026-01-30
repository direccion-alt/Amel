"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileSpreadsheet, ExternalLink, Info, CheckCircle } from "lucide-react"

export function GoogleSheetsConfig() {
  const [sheetUrl, setSheetUrl] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleConnect = async () => {
    setIsLoading(true)
    // Simular conexión - en producción se validaría la URL y se guardaría
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsConnected(true)
    setIsLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Integración con Google Sheets
        </CardTitle>
        <CardDescription>Conecta tu hoja de cálculo para sincronizar datos de monitoreo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Para integrar Google Sheets, tu hoja debe tener las siguientes columnas: Unidad, Fecha, Odómetro, Litros,
            Costo, Origen, Destino, Cliente. Asegúrate de que la hoja sea pública o compartida con el sistema.
          </AlertDescription>
        </Alert>

        <div className="grid gap-2">
          <Label htmlFor="sheet_url">URL de Google Sheets</Label>
          <div className="flex gap-2">
            <Input
              id="sheet_url"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleConnect} disabled={!sheetUrl || isLoading}>
              {isLoading ? "Conectando..." : "Conectar"}
            </Button>
          </div>
        </div>

        {isConnected && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Google Sheets conectado correctamente</span>
          </div>
        )}

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Formato esperado de la hoja:</h4>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left">Unidad</th>
                  <th className="p-2 text-left">Fecha</th>
                  <th className="p-2 text-left">Odómetro</th>
                  <th className="p-2 text-left">Litros</th>
                  <th className="p-2 text-left">Costo</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-2 text-muted-foreground">U-001</td>
                  <td className="p-2 text-muted-foreground">2024-01-15</td>
                  <td className="p-2 text-muted-foreground">150000</td>
                  <td className="p-2 text-muted-foreground">200</td>
                  <td className="p-2 text-muted-foreground">4500</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ExternalLink className="h-4 w-4" />
          <a
            href="https://docs.google.com/spreadsheets"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Crear nueva hoja de Google Sheets
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
