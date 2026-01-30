// --- REGLAS TÉCNICAS SCT ---
const REGLAS_SCT: { [key: string]: any } = {
  "5": { emi: "ENE-FEB / JUL-AGO", fm: "ENE-ABR", mesesEmi: [0, 1, 6, 7], mesesFM: [0, 1, 2, 3] },
  "6": { emi: "ENE-FEB / JUL-AGO", fm: "ENE-ABR", mesesEmi: [0, 1, 6, 7], mesesFM: [0, 1, 2, 3] },
  "7": { emi: "FEB-MAR / AGO-SEP", fm: "FEB-MAY", mesesEmi: [1, 2, 7, 8], mesesFM: [1, 2, 3, 4] },
  "8": { emi: "FEB-MAR / AGO-SEP", fm: "FEB-MAY", mesesEmi: [1, 2, 7, 8], mesesFM: [1, 2, 3, 4] },
  "3": { emi: "MAR-ABR / SEP-OCT", fm: "MAR-JUN", mesesEmi: [2, 3, 8, 9], mesesFM: [2, 3, 4, 5] },
  "4": { emi: "MAR-ABR / SEP-OCT", fm: "MAR-JUN", mesesEmi: [2, 3, 8, 9], mesesFM: [2, 3, 4, 5] },
  "1": { emi: "ABR-MAY / OCT-NOV", fm: "JUL-OCT", mesesEmi: [3, 4, 9, 10], mesesFM: [6, 7, 8, 9] },
  "2": { emi: "ABR-MAY / OCT-NOV", fm: "JUL-OCT", mesesEmi: [3, 4, 9, 10], mesesFM: [6, 7, 8, 9] },
  "9": { emi: "MAY-JUN / NOV-DIC", fm: "MAY-AGO", mesesEmi: [4, 5, 10, 11], mesesFM: [4, 5, 6, 7] },
  "0": { emi: "MAY-JUN / NOV-DIC", fm: "MAY-AGO", mesesEmi: [4, 5, 10, 11], mesesFM: [4, 5, 6, 7] },
};

export const obtenerInfoPlaca = (placa: string) => {
  const matches = placa?.match(/\d/g);
  const ultimoDigito = matches ? matches[matches.length - 1] : null;
  return ultimoDigito ? REGLAS_SCT[ultimoDigito] : null;
};

// --- LÓGICA PARA NO CONTAMINANTES (SEMESTRAL) ---
export const calcularEstadoAmbiental = (placa: string, fechaUltimaVerif: string) => {
  if (!placa || !fechaUltimaVerif) return { color: "bg-zinc-100 text-zinc-500", texto: "PENDIENTE" };

  const info = obtenerInfoPlaca(placa);
  if (!info) return { color: "bg-zinc-100 text-zinc-400", texto: "PLACA INVÁLIDA" };

  const hoy = new Date();
  const ultima = new Date(fechaUltimaVerif);
  const añoActual = hoy.getFullYear();
  const mesActual = hoy.getMonth();

  // Si la verificación es de un año anterior, está vencida
  if (ultima.getFullYear() < añoActual) {
    return { color: "bg-red-500 text-white", texto: "VENCIDA" };
  }

  // Si ya se hizo este año, revisamos si estamos en un periodo donde toca la siguiente
  // (Lógica simplificada: si ya tiene fecha del año actual, está bien a menos que estemos en el periodo de placa)
  const tocaPeriodoEmi = info.mesesEmi.includes(mesActual);
  
  // Si estamos en su mes de placa y la fecha del documento es vieja (más de 4 meses)
  const mesesDiferencia = (hoy.getTime() - ultima.getTime()) / (1000 * 60 * 60 * 24 * 30);
  
  if (tocaPeriodoEmi && mesesDiferencia > 4) {
    return { color: "bg-orange-500 text-white animate-pulse", texto: "TOCA RENOVAR" };
  }

  return { color: "bg-green-600 text-white", texto: "AL DÍA" };
};

// --- LÓGICA PARA FÍSICO-MECÁNICA (ANUAL) ---
export const calcularEstadoFisicoMecanica = (placa: string, fechaUltimaVerif: string) => {
  if (!placa || !fechaUltimaVerif) return { color: "bg-zinc-100 text-zinc-500", texto: "PENDIENTE" };

  const info = obtenerInfoPlaca(placa);
  if (!info) return { color: "bg-zinc-100 text-zinc-400", texto: "PLACA INVÁLIDA" };

  const hoy = new Date();
  const ultima = new Date(fechaUltimaVerif);
  const añoActual = hoy.getFullYear();
  const mesActual = hoy.getMonth();

  // REGLA DE ORO: Si se hizo en cualquier mes del año actual, está AL DÍA (Vigencia Anual)
  if (ultima.getFullYear() === añoActual) {
    return { color: "bg-green-600 text-white", texto: "AL DÍA" };
  }

  // Si es del año pasado, revisamos si ya estamos en su mes de cumplimiento obligatorio
  const tocaPeriodoFM = info.mesesFM.includes(mesActual);

  if (tocaPeriodoFM) {
    return { color: "bg-orange-500 text-white animate-pulse", texto: "TOCA RENOVAR" };
  }

  // Si ya pasó su mes de cumplimiento y no tiene nada del año actual
  if (mesActual > info.mesesFM[info.mesesFM.length - 1]) {
    return { color: "bg-red-500 text-white", texto: "VENCIDA" };
  }

  // Si aún no llega su periodo pero tiene la del año pasado
  if (ultima.getFullYear() === añoActual - 1) {
    return { color: "bg-green-600 text-white", texto: "VIGENCIA 2025" };
  }

  return { color: "bg-red-500 text-white", texto: "VENCIDA" };
};