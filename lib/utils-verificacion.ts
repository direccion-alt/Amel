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
  const mesActual = hoy.getMonth();
  const mesVerificacion = ultima.getMonth();

  // REGLA CRÍTICA: Verificación SEMESTRAL (cada 6 meses)
  // Periodos: 1er semestre (meses 0-5) y 2do semestre (meses 6-11)
  const mesesDesdeVerificacion = (hoy.getTime() - ultima.getTime()) / (1000 * 60 * 60 * 24 * 30.44);

  // Si han pasado más de 6 meses desde la última verificación, VENCIDA
  if (mesesDesdeVerificacion >= 6) {
    return { color: "bg-red-500 text-white", texto: "VENCIDA" };
  }

  // Si faltan menos de 30 días para cumplir 6 meses Y estamos en periodo de placa, TOCA RENOVAR
  const diasParaVencimiento = (6 - mesesDesdeVerificacion) * 30.44;
  const tocaPeriodoEmi = info.mesesEmi.includes(mesActual);

  if (diasParaVencimiento <= 30 && tocaPeriodoEmi) {
    return { color: "bg-orange-500 text-white animate-pulse", texto: "TOCA RENOVAR" };
  }

  // Si han pasado más de 5 meses pero aún no llega a 6, PRÓXIMA A VENCER
  if (mesesDesdeVerificacion >= 5) {
    return { color: "bg-yellow-500 text-black font-bold", texto: "PRÓXIMA A VENCER" };
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

  // REGLA CRÍTICA: Verificación ANUAL (1 vez al año)
  // Si ya se verificó este año, está vigente todo el año
  if (ultima.getFullYear() === añoActual) {
    return { color: "bg-green-600 text-white", texto: "AL DÍA" };
  }

  // Si es de años anteriores, verificar si ya pasó el periodo obligatorio
  const añosDesdeVerificacion = añoActual - ultima.getFullYear();
  
  // Si tiene más de 1 año de antigüedad, definitivamente VENCIDA
  if (añosDesdeVerificacion > 1) {
    return { color: "bg-red-500 text-white", texto: "VENCIDA" };
  }

  // Si es del año pasado, revisar si ya estamos en o pasamos su periodo de renovación
  const tocaPeriodoFM = info.mesesFM.includes(mesActual);
  const yaPasoPeriodo = mesActual > info.mesesFM[info.mesesFM.length - 1];

  // Si ya pasó su periodo de renovación del año actual, VENCIDA
  if (yaPasoPeriodo) {
    return { color: "bg-red-500 text-white", texto: "VENCIDA" };
  }

  // Si estamos en su periodo de renovación, TOCA RENOVAR (alerta urgente)
  if (tocaPeriodoFM) {
    return { color: "bg-orange-500 text-white animate-pulse", texto: "TOCA RENOVAR" };
  }

  // Si aún no llega su periodo pero está cerca (1 mes antes), PRÓXIMA A VENCER
  const unMesAntes = info.mesesFM[0] - 1;
  if (mesActual === unMesAntes) {
    return { color: "bg-yellow-500 text-black font-bold", texto: "PRÓXIMA A VENCER" };
  }

  // Si aún no llega su periodo, técnicamente sigue vigente (tolerancia de año pasado)
  return { color: "bg-green-600 text-white", texto: "VIGENTE" };
};