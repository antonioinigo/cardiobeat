// src/utils/ecgGenerator.js
// - Sinusal NORMAL / TAQUICARDIA / BRADICARDIA: picos iguales (sin variación por latido)
// - Ajuste: en SINUSAL, la onda P se separa más del QRS (pCenterT adelantado)
// - VT monomórfica POSITIVA: complejos anchos, regulares, “arco” hacia arriba
// - Idioventricular: R pequeña + gran deflexión negativa ancha + cola larga (más “clínico”)

export const RHYTHM_TYPES = {
  NORMAL:                        'normal',
  TACHYCARDIA:                   'tachycardia',
  BRADICARDIA:                   'bradycardia',
  SINUS_EXIT_BLOCK:              'sinus_exit_block',
  SINUS_ARREST:                  'sinus_arrest',
  NSR_WITH_PAC:                  'nsr_with_pac',
  ATRIAL_FIBRILLATION:           'atrial_fibrillation',
  ATRIAL_FLUTTER:                'atrial_flutter',
  NSR_WITH_AVB1:                 'nsr_with_avb1',
  AVB2_TYPE1:                    'avb2_type1',
  AVB2_TYPE2:                    'avb2_type2',
  AVB3:                          'avb3',
  NSR_WITH_PJC:                  'nsr_with_pjc',
  JUNCTIONAL:                    'junctional',
  JUNCTIONAL_TACHY:              'junctional_tachy',
  NSR_WITH_PVC:                  'nsr_with_pvc',
  IDIOVENTRICULAR:               'idioventricular',
  ACCEL_IVR:                     'accel_ivr',
  VENTRICULAR_FIBRILLATION:      'ventricular_fibrillation',
  ASYSTOLE:                      'asystole',
  VTACH:                         'vtach',
  PACED_VENTRICULAR:             'paced_ventricular'
};

export const RHYTHM_INFO = {
  [RHYTHM_TYPES.NORMAL]:                   { name: 'Ritmo Sinusal Normal',                      bpm: 75,  description: 'Picos uniformes',                        irregularity: 0 },
  [RHYTHM_TYPES.TACHYCARDIA]:              { name: 'Taquicardia Sinusal',                       bpm: 130, description: 'Picos uniformes',                        irregularity: 0 },
  [RHYTHM_TYPES.BRADICARDIA]:              { name: 'Bradicardia Sinusal',                       bpm: 45,  description: 'Picos uniformes',                        irregularity: 0 },
  [RHYTHM_TYPES.SINUS_EXIT_BLOCK]:         { name: 'Bloqueo de Salida Sinusal',                 bpm: 70,  description: 'Pausas periódicas',                      irregularity: 0.30 },
  [RHYTHM_TYPES.SINUS_ARREST]:             { name: 'Paro Sinusal',                              bpm: 70,  description: 'Pausas irregulares',                     irregularity: 0.45 },
  [RHYTHM_TYPES.NSR_WITH_PAC]:             { name: 'RSN con Extrasístoles Auriculares (PAC)',   bpm: 75,  description: 'Latidos auriculares prematuros',         irregularity: 0.22 },
  [RHYTHM_TYPES.ATRIAL_FIBRILLATION]:      { name: 'Fibrilación Auricular',                     bpm: 110, description: 'RR irregular',                           irregularity: 0.60 },
  [RHYTHM_TYPES.ATRIAL_FLUTTER]:           { name: 'Flutter Auricular',                         bpm: 150, description: 'Ondas en sierra y conducción regular',   irregularity: 0.10 },
  [RHYTHM_TYPES.NSR_WITH_AVB1]:            { name: 'RSN con BAV de 1.º grado',                  bpm: 70,  description: 'PR prolongado',                          irregularity: 0.05 },
  [RHYTHM_TYPES.AVB2_TYPE1]:               { name: 'BAV de 2.º grado tipo I',                   bpm: 65,  description: 'PR creciente y caída de QRS',            irregularity: 0.35 },
  [RHYTHM_TYPES.AVB2_TYPE2]:               { name: 'BAV de 2.º grado tipo II',                  bpm: 65,  description: 'PR fijo con caída de QRS',               irregularity: 0.35 },
  [RHYTHM_TYPES.AVB3]:                     { name: 'BAV de 3.º grado',                          bpm: 35,  description: 'Disociación AV',                         irregularity: 0.50 },
  [RHYTHM_TYPES.NSR_WITH_PJC]:             { name: 'RSN con Extrasístoles de la Unión (PJC)',   bpm: 75,  description: 'Latidos de la unión prematuros',         irregularity: 0.22 },
  [RHYTHM_TYPES.JUNCTIONAL]:               { name: 'Ritmo de la Unión',                         bpm: 45,  description: 'QRS estrecho, P retrógrada',             irregularity: 0.08 },
  [RHYTHM_TYPES.JUNCTIONAL_TACHY]:         { name: 'Taquicardia Supraventricular',             bpm: 180, description: 'Ritmo regular rápido',                   irregularity: 0.10 },
  [RHYTHM_TYPES.NSR_WITH_PVC]:             { name: 'RSN con Extrasístoles Ventriculares (PVC)', bpm: 75,  description: 'Latidos ventriculares prematuros',         irregularity: 0.25 },
  [RHYTHM_TYPES.IDIOVENTRICULAR]:          { name: 'Ritmo Idioventricular',                     bpm: 35,  description: 'QRS ancho y lento',                      irregularity: 0.10 },
  [RHYTHM_TYPES.ACCEL_IVR]:                { name: 'Ritmo Idioventricular Acelerado',           bpm: 70,  description: 'QRS ancho y regular',                    irregularity: 0.12 },
  [RHYTHM_TYPES.VENTRICULAR_FIBRILLATION]: { name: 'Fibrilación Ventricular',                   bpm: 300, description: 'Caótica',                                irregularity: 1 },
  [RHYTHM_TYPES.ASYSTOLE]:                 { name: 'Asistolia',                                 bpm: 0,   description: 'Línea casi plana',                       irregularity: 0 },
  [RHYTHM_TYPES.VTACH]:                    { name: 'Taquicardia Ventricular',                   bpm: 180, description: 'Monomórfica positiva',                   irregularity: 0.00 },
  [RHYTHM_TYPES.PACED_VENTRICULAR]:        { name: 'Marcapasos Ventricular',                    bpm: 56,  description: 'Espiga + QRS ancho',                     irregularity: 0.00 }
};

export const RHYTHM_WAVE_GUIDE = {
  [RHYTHM_TYPES.NORMAL]: {
    waves: 'P positiva antes de cada QRS, PR constante, QRS estrecho y T concordante.',
    interpretation: 'Verifica ritmo regular, relacion P-QRS 1:1 y frecuencia entre 60-100 lpm.'
  },
  [RHYTHM_TYPES.TACHYCARDIA]: {
    waves: 'Misma morfologia sinusal que el ritmo normal, pero ciclos RR mas cortos.',
    interpretation: 'Primero confirma origen sinusal y luego frecuencia mayor de 100 lpm.'
  },
  [RHYTHM_TYPES.BRADICARDIA]: {
    waves: 'P-QRS-T conservadas, con intervalos RR mas largos y QRS estrecho.',
    interpretation: 'Identifica ritmo sinusal con frecuencia menor de 60 lpm.'
  },
  [RHYTHM_TYPES.SINUS_EXIT_BLOCK]: {
    waves: 'Secuencia sinusal normal con pausas donde faltan complejos completos.',
    interpretation: 'Las pausas suelen ser multiplos del ciclo basal (patron repetitivo).'
  },
  [RHYTHM_TYPES.SINUS_ARREST]: {
    waves: 'Latidos sinusales alternan con pausas sin actividad auricular ni ventricular.',
    interpretation: 'Las pausas no guardan un multiplo exacto del ciclo sinusal previo.'
  },
  [RHYTHM_TYPES.NSR_WITH_PAC]: {
    waves: 'Aparece una P prematura (morfologia distinta) seguida de QRS estrecho.',
    interpretation: 'Busca latido adelantado auricular y pausa no completamente compensadora.'
  },
  [RHYTHM_TYPES.ATRIAL_FIBRILLATION]: {
    waves: 'No hay ondas P definidas; linea de base fibrilatoria y RR irregular.',
    interpretation: 'Diagnostico practico: irregularidad absoluta de RR sin P organizada.'
  },
  [RHYTHM_TYPES.ATRIAL_FLUTTER]: {
    waves: 'Ondas auriculares en sierra (F) con conduccion AV fija o variable.',
    interpretation: 'Cuenta ondas F entre QRS para estimar relacion de conduccion (2:1, 3:1, etc.).'
  },
  [RHYTHM_TYPES.NSR_WITH_AVB1]: {
    waves: 'Cada P conduce, pero el intervalo PR esta prolongado y permanece constante.',
    interpretation: 'Clave: PR > 200 ms sin latidos bloqueados.'
  },
  [RHYTHM_TYPES.AVB2_TYPE1]: {
    waves: 'PR se alarga latido a latido hasta que una P no conduce (caida de QRS).',
    interpretation: 'Reconoce ciclos Wenckebach: alargamiento progresivo + bloqueo final.'
  },
  [RHYTHM_TYPES.AVB2_TYPE2]: {
    waves: 'PR fijo en latidos conducidos, con caidas bruscas de QRS.',
    interpretation: 'Si hay bloqueo intermitente sin alargamiento progresivo del PR, es Mobitz II.'
  },
  [RHYTHM_TYPES.AVB3]: {
    waves: 'Ondas P y QRS aparecen sin relacion fija entre si (disociacion AV).',
    interpretation: 'Mide PP y RR por separado: ambos ritmos son regulares pero independientes.'
  },
  [RHYTHM_TYPES.NSR_WITH_PJC]: {
    waves: 'Latido prematuro de la union con P retrograda/oculta y QRS estrecho.',
    interpretation: 'Identifica latido adelantado sin P sinusal previa clara.'
  },
  [RHYTHM_TYPES.JUNCTIONAL]: {
    waves: 'Ritmo regular de la union: QRS estrecho y P retrograda o ausente.',
    interpretation: 'Frecuencia suele ser 40-60 lpm con activacion originada en nodo AV/union.'
  },
  [RHYTHM_TYPES.JUNCTIONAL_TACHY]: {
    waves: 'Morfologia de ritmo de la union, pero con frecuencia elevada y regular.',
    interpretation: 'Piensa en foco supraventricular rapido con QRS estrecho.'
  },
  [RHYTHM_TYPES.NSR_WITH_PVC]: {
    waves: 'Latido ventricular prematuro: QRS ancho, sin P previa y T discordante.',
    interpretation: 'Suele verse acoplamiento corto y pausa compensadora posterior.'
  },
  [RHYTHM_TYPES.IDIOVENTRICULAR]: {
    waves: 'Complejos ventriculares anchos y lentos, con escasa actividad auricular efectiva.',
    interpretation: 'Prioriza ancho de QRS y frecuencia baja de escape ventricular.'
  },
  [RHYTHM_TYPES.ACCEL_IVR]: {
    waves: 'QRS ancho ventricular con ritmo mas rapido que el idioventricular clasico.',
    interpretation: 'Frecuencia intermedia (aprox 50-110 lpm) con morfologia ventricular.'
  },
  [RHYTHM_TYPES.VENTRICULAR_FIBRILLATION]: {
    waves: 'Actividad electrica caotica, sin P, QRS ni T identificables.',
    interpretation: 'No hay patron repetible: requiere reconocimiento inmediato de ritmo no perfusor.'
  },
  [RHYTHM_TYPES.ASYSTOLE]: {
    waves: 'Linea casi plana con ausencia de complejos organizados.',
    interpretation: 'Confirma en mas de una derivacion y descarta artefacto/electrodos.'
  },
  [RHYTHM_TYPES.VTACH]: {
    waves: 'Taquicardia regular de QRS ancho y morfologia ventricular monomorfica.',
    interpretation: 'Si es ritmo rapido y ancho, tratalo como ventricular hasta demostrar lo contrario.'
  },
  [RHYTHM_TYPES.PACED_VENTRICULAR]: {
    waves: 'Se observa espiga de marcapasos seguida de QRS ancho capturado.',
    interpretation: 'Evalua captura: cada espiga efectiva debe ir seguida de complejo ventricular.'
  }
};

const DEFAULT_GUIDE_STEPS = [
  'Comprueba regularidad del trazado observando varios intervalos RR consecutivos.',
  'Identifica si hay onda P visible y si mantiene una relacion 1:1 con el QRS.',
  'Valora PR y ancho del QRS para ubicar el origen (supraventricular vs ventricular).',
  'Confirma frecuencia final con el promedio de varios ciclos, no solo un latido.'
];

const RHYTHM_GUIDE_STEPS = {
  [RHYTHM_TYPES.ATRIAL_FIBRILLATION]: [
    'Busca ausencia de ondas P organizadas en todo el trazado.',
    'Confirma irregularidad absoluta de RR en una ventana amplia.',
    'Descarta que la irregularidad sea por extrasistoles aisladas.'
  ],
  [RHYTHM_TYPES.ATRIAL_FLUTTER]: [
    'Identifica ondas F repetitivas (patron en sierra) en la linea base.',
    'Cuenta cuantas ondas F aparecen por cada QRS para estimar conduccion.',
    'Valora si la conduccion es fija o variable.'
  ],
  [RHYTHM_TYPES.NSR_WITH_AVB1]: [
    'Mide el PR en varios latidos consecutivos.',
    'Comprueba que todos los PR sean prolongados y estables.',
    'Verifica que no existan latidos bloqueados.'
  ],
  [RHYTHM_TYPES.AVB2_TYPE1]: [
    'Mide PR latido a latido y confirma alargamiento progresivo.',
    'Detecta la onda P que no conduce y produce la caida de QRS.',
    'Reinicia el ciclo y verifica que el patron se repita (Wenckebach).'
  ],
  [RHYTHM_TYPES.AVB2_TYPE2]: [
    'Comprueba que el PR de los latidos conducidos sea fijo.',
    'Localiza ondas P no conducidas con caida brusca de QRS.',
    'Revisa si hay patrones 2:1 o 3:1 en segmentos largos.'
  ],
  [RHYTHM_TYPES.AVB3]: [
    'Mide PP y RR por separado para demostrar dos ritmos independientes.',
    'Verifica ausencia de relacion fija entre ondas P y QRS.',
    'Valora la frecuencia ventricular de escape.'
  ],
  [RHYTHM_TYPES.PACED_VENTRICULAR]: [
    'Busca espiga de marcapasos previa a cada QRS.',
    'Comprueba captura: espiga seguida de complejo ventricular.',
    'Revisa sensado/captura inadecuados si aparece espiga sin QRS.'
  ],
  [RHYTHM_TYPES.VENTRICULAR_FIBRILLATION]: [
    'Confirma trazado caotico sin complejos repetitivos.',
    'Verifica ausencia de P, QRS y T identificables.',
    'Descarta artefacto tecnico antes de etiquetar el ritmo.'
  ],
  [RHYTHM_TYPES.ASYSTOLE]: [
    'Confirma linea casi plana en una ventana suficiente.',
    'Descarta desconexion de electrodos o ganancia inadecuada.',
    'Corrobora ausencia de actividad organizada en mas de una derivacion.'
  ],
  [RHYTHM_TYPES.VTACH]: [
    'Reconoce ritmo rapido y regular de QRS ancho.',
    'Valora monomorfia y disociacion AV si es visible.',
    'Interpreta como ventricular mientras no se demuestre lo contrario.'
  ]
};

const RHYTHM_GUIDE_KEY_POINTS = {
  [RHYTHM_TYPES.NORMAL]: [
    'Relacion P-QRS 1:1 estable.',
    'PR constante y QRS estrecho.',
    'Frecuencia habitual entre 60 y 100 lpm.'
  ],
  [RHYTHM_TYPES.TACHYCARDIA]: [
    'Morfologia sinusal conservada.',
    'RR cortos y regulares.',
    'Frecuencia mayor de 100 lpm.'
  ],
  [RHYTHM_TYPES.BRADICARDIA]: [
    'Morfologia sinusal conservada.',
    'RR largos y regulares.',
    'Frecuencia menor de 60 lpm.'
  ],
  [RHYTHM_TYPES.SINUS_EXIT_BLOCK]: [
    'Pausas periodicas sin complejos.',
    'Patron repetitivo en el tiempo.',
    'Secuencias sinusales normales entre pausas.'
  ],
  [RHYTHM_TYPES.SINUS_ARREST]: [
    'Pausas de duracion variable.',
    'No sigue un multiplo fijo del ciclo basal.',
    'Reinicio espontaneo del ritmo sinusal.'
  ],
  [RHYTHM_TYPES.NSR_WITH_PAC]: [
    'Latido auricular adelantado.',
    'P prematura con morfologia distinta.',
    'QRS suele ser estrecho.'
  ],
  [RHYTHM_TYPES.ATRIAL_FIBRILLATION]: [
    'Irregularidad absoluta de RR.',
    'Ausencia de P definida.',
    'Actividad auricular desorganizada.'
  ],
  [RHYTHM_TYPES.ATRIAL_FLUTTER]: [
    'Ondas F en sierra.',
    'Conduccion AV fija o variable.',
    'Frecuencia auricular alta.'
  ],
  [RHYTHM_TYPES.NSR_WITH_AVB1]: [
    'PR prolongado en todos los latidos.',
    'No hay caidas de QRS.',
    'Conduccion AV 1:1 conservada.'
  ],
  [RHYTHM_TYPES.AVB2_TYPE1]: [
    'PR progresivamente mas largo.',
    'Caida de un QRS al final del ciclo.',
    'Patron Wenckebach repetitivo.'
  ],
  [RHYTHM_TYPES.AVB2_TYPE2]: [
    'PR fijo en latidos conducidos.',
    'Bloqueo intermitente de QRS.',
    'Riesgo mayor de progresion a bloqueo completo.'
  ],
  [RHYTHM_TYPES.AVB3]: [
    'Disociacion AV completa.',
    'Ondas P y QRS sin sincronizacion.',
    'Escape ventricular lento.'
  ],
  [RHYTHM_TYPES.NSR_WITH_PJC]: [
    'Latido de la union prematuro.',
    'P retrograda o no visible.',
    'QRS habitualmente estrecho.'
  ],
  [RHYTHM_TYPES.JUNCTIONAL]: [
    'Ritmo regular de la union.',
    'Frecuencia tipica 40-60 lpm.',
    'P retrograda o ausente.'
  ],
  [RHYTHM_TYPES.JUNCTIONAL_TACHY]: [
    'QRS estrecho y regular.',
    'Frecuencia elevada de origen supraventricular.',
    'P puede estar oculta o retrograda.'
  ],
  [RHYTHM_TYPES.NSR_WITH_PVC]: [
    'Latido ventricular adelantado.',
    'QRS ancho y aberrante.',
    'Pausa compensadora posterior.'
  ],
  [RHYTHM_TYPES.IDIOVENTRICULAR]: [
    'Escape ventricular lento.',
    'QRS ancho predominante.'
  ],
  [RHYTHM_TYPES.ACCEL_IVR]: [
    'Ritmo ventricular de frecuencia intermedia.',
    'QRS ancho relativamente regular.',
    'Mas rapido que el idioventricular clasico.'
  ],
  [RHYTHM_TYPES.VENTRICULAR_FIBRILLATION]: [
    'Actividad totalmente caotica.',
    'Sin complejos identificables.',
    'Ritmo no perfusor.'
  ],
  [RHYTHM_TYPES.ASYSTOLE]: [
    'Ausencia de actividad organizada.',
    'Linea casi plana.',
    'Siempre descartar fallo tecnico.'
  ],
  [RHYTHM_TYPES.VTACH]: [
    'Taquicardia regular de QRS ancho.',
    'Morfologia ventricular monomorfica.',
    'Alta prioridad clinica.'
  ],
  [RHYTHM_TYPES.PACED_VENTRICULAR]: [
    'Espiga previa al QRS.',
    'QRS ancho capturado.',
    'Ritmo regular por estimulo artificial.'
  ]
};

const RHYTHM_GUIDE_WARNINGS = {
  [RHYTHM_TYPES.AVB2_TYPE2]: 'En Mobitz II, una caida de QRS aislada ya tiene valor clinico; vigila progresion.',
  [RHYTHM_TYPES.AVB3]: 'La disociacion AV completa requiere correlacion clinica inmediata.',
  [RHYTHM_TYPES.VENTRICULAR_FIBRILLATION]: 'Ritmo de emergencia: no hay gasto cardiaco efectivo.',
  [RHYTHM_TYPES.ASYSTOLE]: 'Confirma conexiones/electrodos antes de asumir asistolia real.',
  [RHYTHM_TYPES.VTACH]: 'Toda taquicardia de QRS ancho debe tratarse como ventricular hasta demostrar lo contrario.'
};

export function getRhythmGuide(rhythmType) {
  const baseGuide = RHYTHM_WAVE_GUIDE[rhythmType] ?? {
    waves: 'Sin descripcion de ondas.',
    interpretation: 'Sin guia disponible para este ritmo.'
  };

  return {
    ...baseGuide,
    keyPoints: RHYTHM_GUIDE_KEY_POINTS[rhythmType] ?? [],
    readingSteps: RHYTHM_GUIDE_STEPS[rhythmType] ?? DEFAULT_GUIDE_STEPS,
    warning: RHYTHM_GUIDE_WARNINGS[rhythmType] ?? null
  };
}

const FIXED_SINUS_RHYTHMS = new Set([
  RHYTHM_TYPES.NORMAL,
  RHYTHM_TYPES.TACHYCARDIA,
  RHYTHM_TYPES.BRADICARDIA
]);

const TRIGEMINY_PATTERNS = {
  [RHYTHM_TYPES.NSR_WITH_PAC]: { coupling: 0.68, pause: 1.30 },
  [RHYTHM_TYPES.NSR_WITH_PJC]: { coupling: 0.70, pause: 1.28 },
  [RHYTHM_TYPES.NSR_WITH_PVC]: { coupling: 0.66, pause: 1.34 }
};

const AVB2_TYPE1_PR_SEQUENCE = [0.18, 0.21, 0.24, 0.27, 0.30];
const AVB2_TYPE1_RR_MULTIPLIERS = [1.02, 0.99, 0.96, 0.93, 1.10];

// ===== Utilidades =====
const clamp = (valor, minimo, maximo) => Math.max(minimo, Math.min(maximo, valor));
const fract = (valor) => valor - Math.floor(valor);
const fase = (t, latido) => clamp((t - latido.t0) / latido.rr, 0, 1);

const hash1 = (valor) => fract(Math.sin(valor * 127.1) * 43758.5453123);
const hash2 = (x, y) => fract(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453);

const smoothstep = (x) => x * x * (3 - 2 * x);

// QT aprox
const qtFromRR = (rrSec) => {
  const qtc = 0.41;
  return clamp(qtc * Math.sqrt(rrSec), 0.30, 0.48);
};

const smoothPlateau = (phase, a, b, edge = 0.02) => {
  const up = smoothstep(clamp((phase - a) / edge, 0, 1));
  const down = 1 - smoothstep(clamp((phase - b) / edge, 0, 1));
  return up * down;
};

const smoothNoise1D = (x) => {
  const iBase = Math.floor(x);
  const fr = x - iBase;
  const v0 = hash1(iBase);
  const v1 = hash1(iBase + 1);
  return (v0 + (v1 - v0) * smoothstep(fr)) * 2 - 1;
};

const fbm = (x, octaves = 4) => {
  let suma = 0;
  let amplitud = 0.55;
  let frecuencia = 1.0;
  let normalizador = 0;
  for (let i = 0; i < octaves; i++) {
    suma += amplitud * smoothNoise1D(x * frecuencia);
    normalizador += amplitud;
    amplitud *= 0.5;
    frecuencia *= 2.0;
  }
  return suma / normalizador;
};

const normalFromHashes = (u1, u2) => {
  const uSegura = Math.max(u1, 1e-6);
  const radio = Math.sqrt(-2 * Math.log(uSegura));
  const angulo = 2 * Math.PI * u2;
  return radio * Math.cos(angulo);
};

const gaussian = (x, centro, ancho, altura) => {
  const z = (x - centro) / ancho;
  if (Math.abs(z) > 3.4) return 0;
  return altura * Math.exp(-0.5 * z * z);
};

const skewedGaussian = (x, centro, wIzq, wDer, altura) => (
  x < centro ? gaussian(x, centro, wIzq, altura) : gaussian(x, centro, wDer, altura)
);

const triangle = (x, centro, ancho, altura) => {
  const dist = Math.abs((x - centro) / ancho);
  if (dist >= 1) return 0;
  return altura * (1 - dist);
};

const softClip = (x, ganancia = 1.8) => Math.tanh(ganancia * x);
const saw = (x) => 2 * (x - Math.floor(x + 0.5));

// ===== Ruido =====
const NOISE = {
  wanderAmp: 0.004,
  emgAmp: 0.002,
  humAmp: 0.001
};

const baselineWander = (t, amp) => (
  Math.sin(2 * Math.PI * 0.18 * t) * amp * 0.65 +
  Math.sin(2 * Math.PI * 0.05 * t + 1.7) * amp * 0.35 +
  0.18 * amp * fbm(t * 0.6, 3)
);

const emgNoise = (t, amp) => amp * (0.65 * fbm(t * 18.0, 3) + 0.35 * fbm(t * 34.0 + 10, 2));
const hum50 = (t, amp) => amp * Math.sin(2 * Math.PI * 50 * t + 0.4);

const ruido = (t, amp, ampDeriva, ampEmg, ampHum) => (
  baselineWander(t, amp * ampDeriva) +
  emgNoise(t, amp * ampEmg) +
  hum50(t, amp * ampHum)
);

const sinRuido = (t, amp) => ruido(t, amp, 0.00, 0.00, 0.00);
const sumarRuido = (senal, t, amp, wAmp, eAmp, hAmp) => senal + ruido(t, amp, wAmp, eAmp, hAmp);

// ===== Formas base =====
function sinusWaveUniform(phase, amp, rrSec, pCenterTOverride = null) {
  const PR = 0.16;
  const QRS = 0.09;
  const QT = qtFromRR(rrSec);

  const durP = 0.07;
  const durT = 0.07;

  const centroPseg = (pCenterTOverride != null) ? pCenterTOverride : 0.10;

  const centroQrsSeg = PR;
  const centroTSeg = clamp(QT - 0.08, 0.30, rrSec * 0.84);

  const centroP = centroPseg / rrSec;
  const centroQrs = centroQrsSeg / rrSec;
  const centroT = centroTSeg / rrSec;

  const anchoP = (durP / rrSec) * 0.45;
  const anchoQrs = (QRS / rrSec) * 0.35;

  const ampP = amp * 0.14;
  const ampR = amp * 1.05;
  const ampQ = -amp * 0.20;
  const ampS = -amp * 0.28;

  const ondaP = gaussian(phase, centroP, anchoP, ampP);
  const ondaQ = triangle(phase, centroQrs - anchoQrs * 0.55, anchoQrs * 0.45, ampQ);
  const ondaR = gaussian(phase, centroQrs, anchoQrs * 0.16, ampR);
  const ondaS = triangle(phase, centroQrs + anchoQrs * 0.60, anchoQrs * 0.50, ampS);

  const ondaT = skewedGaussian(
    phase,
    centroT,
    (durT / rrSec) * 0.30,
    (durT / rrSec) * 0.55,
    amp * 0.30
  );

  return ondaP + ondaQ + ondaR + ondaS + ondaT;
}

function sinusWave(phase, amp, rrSec, opts = {}) {
  const PR = opts.prSec ?? 0.16;
  const QRS = opts.qrsSec ?? 0.09;
  const QT = opts.qtSec ?? qtFromRR(rrSec);

  const durP = opts.pDur ?? 0.08;
  const durT = opts.tDur ?? 0.16;

  const centroPseg = opts.pCenterT ?? 0.10;
  const centroQrsSeg = PR;
  const centroTSegBase = QT - 0.12;
  const centroTSegMinAfterQRS = centroQrsSeg + Math.max(0.14, QRS * 0.9);
  const centroTSeg = clamp(
    Math.max(centroTSegBase, centroTSegMinAfterQRS),
    0.28,
    rrSec * 0.90
  );

  const centroP = centroPseg / rrSec;
  const centroQrs = centroQrsSeg / rrSec;
  const centroT = centroTSeg / rrSec;

  const anchoP = (durP / rrSec) * 0.45;
  const anchoQrs = (QRS / rrSec) * 0.35;

  const ampP = amp * (opts.pAmp ?? 0.14);
  const ampR = amp * (opts.rAmp ?? 1.05);
  const ampQ = amp * (opts.qAmp ?? -0.20);
  const ampS = amp * (opts.sAmp ?? -0.28);
  const ampT = amp * (opts.tAmp ?? 0.30);

  const ondaP = (opts.hideP ? 0 : gaussian(phase, centroP, anchoP, ampP));
  const ondaQ = (opts.hideQRS ? 0 : triangle(phase, centroQrs - anchoQrs * 0.55, anchoQrs * 0.45, ampQ));
  const ondaR = (opts.hideQRS ? 0 : gaussian(phase, centroQrs, anchoQrs * 0.16, ampR));
  const ondaS = (opts.hideQRS ? 0 : triangle(phase, centroQrs + anchoQrs * 0.60, anchoQrs * 0.50, ampS));

  const ondaT = (opts.hideT ? 0 : skewedGaussian(
    phase,
    centroT,
    (durT / rrSec) * 0.30,
    (durT / rrSec) * 0.55,
    ampT
  ));

  return ondaP + ondaQ + ondaR + ondaS + ondaT;
}

const pacingSpike = (faseLatido, centro, altura = 2.0) => gaussian(faseLatido, centro, 0.004, altura);

const flutterBaseline = (t, amp, hzFlutter = 5.0) => {
  const diente = saw(t * hzFlutter);
  const armonico = Math.sin(2 * Math.PI * hzFlutter * 2 * t + 0.3) * 0.20;
  return amp * (0.85 * diente + 0.15 * armonico);
};

const narrowQRS = (faseLatido, centro, amp, ancho = 0.060) => {
  const q = triangle(faseLatido, centro - ancho * 0.36, ancho * 0.20, -amp * 0.20);
  const r = gaussian(faseLatido, centro, ancho * 0.15, amp * 1.15);
  const s = triangle(faseLatido, centro + ancho * 0.34, ancho * 0.20, -amp * 0.18);
  return q + r + s;
};

const TIMING_NARROW_QRS_CENTER = 0.46;
const TIMING_NARROW_T_CENTER = 0.74;
const TIMING_JUNCTIONAL_P_RETRO = 0.60;
const TIMING_JUNCTIONAL_T_CENTER = 0.72;

const junctionalWave = (faseLatido, amp, rrSec, opts = {}) => {
  const centroQrs = TIMING_NARROW_QRS_CENTER;
  const anchoQrs = (opts.qrsSec ?? 0.075) / rrSec;
  const qrs = narrowQRS(faseLatido, centroQrs, amp * 1.15, anchoQrs);
  const pRetro = gaussian(faseLatido, TIMING_JUNCTIONAL_P_RETRO, 0.024, -amp * 0.05);
  const ondaT = skewedGaussian(faseLatido, TIMING_JUNCTIONAL_T_CENTER, 0.050, 0.080, amp * 0.12);
  return qrs + pRetro + ondaT;
};

// ===== Beat scheduler =====
class BeatScheduler {
  constructor() { this.reset(); }
  reset() {
    this.clave = '';
    this.latidos = [];
    this.generadoHasta = 0;
  }
  _clave(r, bpm) { return `${r}|${bpm}`; }
  _isPVCBeat(idx, rhythmType) {
    return rhythmType === RHYTHM_TYPES.NSR_WITH_PVC && idx % 3 === 2;
  }
  _pvcMorph() {
    return {
      polarity: 1,
      qrsSec: 0.13,
      ampScale: 1.03,
      notchScale: 0.95,
      centerShift: 0.0,
      tScale: 0.17,
      stScale: 1.0
    };
  }

  ensure(timeSec, rhythmType, bpm) {
    const clave = this._clave(rhythmType, bpm);
    if (clave !== this.clave) {
      this.reset();
      this.clave = clave;
    }
    if (rhythmType === RHYTHM_TYPES.VENTRICULAR_FIBRILLATION) return;
    if (rhythmType === RHYTHM_TYPES.ASYSTOLE) return;

    const objetivo = timeSec + 8;

    if (this.latidos.length === 0) {
      const rr0 = this._nextRR(0, rhythmType, bpm);
      this.latidos.push(this._makeBeat(0, 0, rr0, rhythmType));
      this.generadoHasta = rr0;
    }

    while (this.generadoHasta < objetivo) {
      const ultimo = this.latidos[this.latidos.length - 1];
      const idx = ultimo.idx + 1;
      const rr = this._nextRR(idx, rhythmType, bpm);
      const t0 = ultimo.t0 + ultimo.rr;
      this.latidos.push(this._makeBeat(idx, t0, rr, rhythmType));
      this.generadoHasta = t0 + rr;
      if (this.latidos.length > 900) this.latidos.shift();
    }
  }

  _makeBeat(idx, t0, rr, rhythmType) {
    const trigeminyPattern = TRIGEMINY_PATTERNS[rhythmType];
    const isTrigeminyPrematureBeat = trigeminyPattern ? idx % 3 === 2 : false;

    const isPAC = rhythmType === RHYTHM_TYPES.NSR_WITH_PAC && isTrigeminyPrematureBeat;
    const isPJC = rhythmType === RHYTHM_TYPES.NSR_WITH_PJC && isTrigeminyPrematureBeat;
    const isPVC = this._isPVCBeat(idx, rhythmType);
    const pvcMorph = isPVC ? this._pvcMorph() : null;

    const avbType1Index = idx % AVB2_TYPE1_PR_SEQUENCE.length;
    // Wenckebach (5:4): PR progresivo hasta latido no conducido.
    const avbType1PR = AVB2_TYPE1_PR_SEQUENCE[avbType1Index];

    // Mobitz II (4:3): PR fijo y caída súbita de QRS
    const avbType2Index = idx % 4;

    const avb2Drop =
      (rhythmType === RHYTHM_TYPES.AVB2_TYPE1 && avbType1Index === AVB2_TYPE1_PR_SEQUENCE.length - 1) ||
      (rhythmType === RHYTHM_TYPES.AVB2_TYPE2 && avbType2Index === 3);

    const avbType2PR = 0.20;

    const prForBeat =
      rhythmType === RHYTHM_TYPES.AVB2_TYPE1 ? avbType1PR :
      rhythmType === RHYTHM_TYPES.AVB2_TYPE2 ? avbType2PR :
      0.16;

    const morph = {
      fAmpJ: rhythmType === RHYTHM_TYPES.ATRIAL_FIBRILLATION
        ? clamp(0.65 + 1.10 * hash2(idx, 21), 0.45, 1.85)
        : 1.0,
      isPAC,
      isPJC,
      isPVC,
      dropQRS: avb2Drop,
      prSec: prForBeat,
      pvc: pvcMorph
    };

    return { idx, t0, rr, morph };
  }

  _nextRR(idx, rhythmType, bpm) {
    const base = 60 / Math.max(bpm, 1);

    if (FIXED_SINUS_RHYTHMS.has(rhythmType)) return base;

    if (rhythmType === RHYTHM_TYPES.SINUS_EXIT_BLOCK) {
      if (idx % 4 === 3) return base * 2.0;
      return base;
    }

    if (rhythmType === RHYTHM_TYPES.SINUS_ARREST) {
      const e = hash2(idx, 401);
      if (e < 0.35) return base * (3.0 + 1.6 * hash2(idx, 402));
      return base;
    }

    const trigeminyPattern = TRIGEMINY_PATTERNS[rhythmType];
    if (trigeminyPattern) {
      if (idx % 3 === 1) return base * trigeminyPattern.coupling;
      if (idx % 3 === 2) return base * trigeminyPattern.pause;
      return base;
    }

    if (rhythmType === RHYTHM_TYPES.AVB2_TYPE1) {
      // RR en grupos: se acorta levemente antes de la P no conducida.
      return base * AVB2_TYPE1_RR_MULTIPLIERS[idx % AVB2_TYPE1_RR_MULTIPLIERS.length];
    }
    if (rhythmType === RHYTHM_TYPES.AVB2_TYPE2) return base;
    if (rhythmType === RHYTHM_TYPES.PACED_VENTRICULAR) return base;

    if (rhythmType === RHYTHM_TYPES.VTACH) {
      const tiny = (hash2(idx, 200) - 0.5) * 0.006;
      return base * (1 + tiny);
    }

    if (rhythmType === RHYTHM_TYPES.ATRIAL_FIBRILLATION) {
      const z = clamp(normalFromHashes(hash2(idx, 300), hash2(idx, 301)), -3.0, 3.0);
      const slow = fbm(idx * 0.055, 4);
      const rrFactor = Math.exp(0.25 * z + 0.22 * slow);

      let burst = 1.0;
      const e = hash2(idx, 302);
      if (e < 0.07) burst = 0.70;
      else if (e > 0.93) burst = 1.55;

      const rr = base * rrFactor * burst;
      return clamp(rr, base * 0.38, base * 2.60);
    }

    return base;
  }

  getBeatAt(timeSec) {
    if (this.latidos.length === 0) return null;
    for (let i = this.latidos.length - 1; i >= 0; i--) {
      if (timeSec >= this.latidos[i].t0) return this.latidos[i];
    }
    return this.latidos[0];
  }
}

const scheduler = new BeatScheduler();

// ===== Ritmos =====
// Sinusales
function valueSinusBase(t, amplitude, beat, opts = {}) {
  const faseLatido = fase(t, beat);
  const rrLatido = opts.rrMorph ?? beat.rr;

  const prSeg = opts.prSec ?? 0.16;
  const ampP = (opts.pAmp ?? 0.14) * (opts.pAmpScale ?? 1.0);
  const ampR = (opts.rAmp ?? 1.05) * (opts.rAmpScale ?? 1.0);
  const ampQ = opts.qAmp ?? -0.20;
  const ampS = opts.sAmp ?? -0.28;
  const ampT = opts.tAmp ?? 0.30;

  const onda = sinusWave(faseLatido, amplitude, rrLatido, {
    prSec: prSeg,
    qrsSec: opts.qrsSec,
    pAmp: ampP,
    rAmp: ampR,
    qAmp: ampQ,
    sAmp: ampS,
    tAmp: ampT,
    pCenterT: opts.pCenterT,
    pDur: opts.pDur,
    tDur: opts.tDur,
    qtSec: opts.qtSec,
    hideQRS: opts.hideQRS,
    hideT: opts.hideT,
    hideP: opts.hideP
  });

  const espiga = opts.pacedSpike
    ? pacingSpike(faseLatido, clamp((prSeg - 0.018) / rrLatido, 0.02, 0.25), amplitude * 0.55)
    : 0;

  return onda + espiga;
}

function valueSinusUniform(t, amplitude, beat, rhythmType) {
  const faseLatido = fase(t, beat);

  const ampBase =
    rhythmType === RHYTHM_TYPES.TACHYCARDIA ? 0.95 :
    rhythmType === RHYTHM_TYPES.BRADICARDIA ? 1.05 : 1.00;

  const centroPseg = 0.06;
  const onda = sinusWaveUniform(faseLatido, amplitude * ampBase, beat.rr, centroPseg);

  return onda;
}

// Auriculares
function fibrillatoryBaseline(t, amp, beat) {
  const lento = 0.65 + 0.45 * fbm(t * 0.09 + 13.0, 3);
  const ampBase = amp * lento * (beat.morph?.fAmpJ ?? 1.0);

  const f1 = 5.5 + 2.5 * fbm(t * 0.05 + 1.0, 3);
  const f2 = 8.0 + 3.5 * fbm(t * 0.04 + 2.0, 3);
  const f3 = 12.0 + 4.0 * fbm(t * 0.03 + 3.0, 3);

  return ampBase * (
    0.50 * Math.sin(2 * Math.PI * f1 * t + 0.6) +
    0.30 * Math.sin(2 * Math.PI * f2 * t + 1.9) +
    0.18 * Math.sin(2 * Math.PI * f3 * t + 2.8) +
    0.18 * fbm(t * 30.0 + (beat.idx ?? 0) * 0.7, 3)
  );
}

function valueAF(t, amplitude, beat) {
  const faseLatido = fase(t, beat);
  const lineaF = fibrillatoryBaseline(t, amplitude * 0.07, beat);

  const qrs = narrowQRS(faseLatido, TIMING_NARROW_QRS_CENTER, amplitude * 1.25, 0.055);
  const ondaT = skewedGaussian(faseLatido, TIMING_NARROW_T_CENTER, 0.055, 0.095, amplitude * 0.18);

  return sumarRuido(lineaF + qrs + ondaT, t, amplitude, NOISE.wanderAmp * 0.7, NOISE.emgAmp * 0.6, NOISE.humAmp);
}

function valueAFlutter(t, amplitude, beat) {
  const faseLatido = fase(t, beat);

  const baseFlutter = flutterBaseline(t, amplitude * 0.20, 7.6);
  const gateQrs = smoothPlateau(faseLatido, 0.40, 0.55, 0.03);
  const flutterSinQrs = baseFlutter * (1 - gateQrs);
  const qrs = narrowQRS(faseLatido, TIMING_NARROW_QRS_CENTER, amplitude * 1.22, 0.050);
  const ondaT = skewedGaussian(faseLatido, TIMING_NARROW_T_CENTER, 0.050, 0.085, amplitude * 0.10);

  return sumarRuido(flutterSinQrs + qrs + ondaT, t, amplitude, NOISE.wanderAmp * 0.45, NOISE.emgAmp * 0.30, NOISE.humAmp);
}

// Junctionales
function valueJunctional(t, amplitude, beat) {
  const faseLatido = fase(t, beat);
  const onda = junctionalWave(faseLatido, amplitude, beat.rr);
  return sumarRuido(onda, t, amplitude, NOISE.wanderAmp * 0.35, NOISE.emgAmp * 0.35, NOISE.humAmp);
}

// Ventriculares
function valuePVCInSinus(t, amplitude, beat, opts = {}) {
  const phase = fase(t, beat);
  const pvc = opts?.pvc ?? {};

  const polarity = pvc.polarity ?? 1;
  const qrsSec = pvc.qrsSec ?? 0.14;
  const qrsW = qrsSec / beat.rr;
  const c = clamp(0.22 + (pvc.centerShift ?? 0), 0.17, 0.29);
  const amp = amplitude * (pvc.ampScale ?? 1.0);
  const notchScale = pvc.notchScale ?? 1.0;

  // PVC temprano, ancho y aberrante; sin onda P visible.
  const preNotch = gaussian(phase, c - qrsW * 0.34, qrsW * 0.11, -amp * 0.22 * polarity * notchScale);
  const main = gaussian(phase, c, qrsW * 0.24, amp * 1.20 * polarity);
  const tail = triangle(phase, c + qrsW * 0.40, qrsW * 0.30, -amp * 0.50 * polarity);

  // ST/T discordante moderada, sin cola exagerada.
  const stWin = smoothPlateau(phase, c + qrsW * 0.16, c + qrsW * 0.70, qrsW * 0.10);
  const st = stWin * amp * 0.04 * (-polarity) * (pvc.stScale ?? 1.0);
  const tWave = gaussian(phase, c + qrsW * 1.05, qrsW * 0.34, amp * (pvc.tScale ?? 0.18) * (-polarity));

  const signal = preNotch + main + tail + st + tWave;
  return sumarRuido(signal, t, amplitude, NOISE.wanderAmp * 0.12, NOISE.emgAmp * 0.10, NOISE.humAmp * 0.7);
}
function valueIdioventricular(t, amplitude, beat, opts = {}) {
  const phase = fase(t, beat);

  const c = opts.c ?? 0.50;
  const w = opts.w ?? 0.62;
  const amp = amplitude * (opts.ampScale ?? 1.00);

  const r = triangle(phase, c - w * 0.15, w * 0.20, amp * (opts.rScale ?? 2.60));
  const sW = w * (opts.sWidthMul ?? 0.12);
  const sMain = -triangle(phase, c + w * 0.01, sW, amp * (opts.sScale ?? 2.90));

  const start = c - w * 0.30;
  const gateWidth = opts.gateWidth ?? 0.30;
  const gate = smoothstep(clamp((phase - start) / (w * gateWidth), 0, 1));

  const qrsRaw = gate * (r + sMain);
  const clipK = opts.clipK ?? 1.00;
  const qrs = softClip(qrsRaw, clipK);

  const stLevel = amp * (opts.stLevel ?? -0.15) * (opts.stScale ?? 1.0);
  const stStartMul = (opts.stStart != null) ? opts.stStart : (w < 0.40 ? 0.34 : 0.22);
  const stEndMul   = (opts.stEnd   != null) ? opts.stEnd   : (w < 0.40 ? 0.95 : 0.78);

  const stA = c + w * stStartMul;
  const stB = c + w * stEndMul;

  const stEdge = w * (opts.stEdge ?? 0.02);
  const stWin = smoothPlateau(phase, stA, stB, stEdge);

  const blendMul = opts.stBlendMul ?? (w < 0.40 ? 0.10 : 0.08);
  const blendW = w * blendMul;

  const blendT = clamp((phase - stA) / Math.max(blendW, 1e-6), 0, 1);
  const blend = smoothstep(blendT);

  const stValue = (1 - blend) * qrs + blend * stLevel;
  const stPlateau = stWin * stValue;

  const termScale = opts.termScale ?? 0.00;
  const recovery = termScale > 0
    ? gaussian(phase, c + w * 0.86, w * 0.32, amp * termScale)
    : 0;

  const qrsPolarity = opts.qrsPolarity ?? ((opts.rScale ?? 2.60) - (opts.sScale ?? 2.90));
  const tSign = qrsPolarity >= 0 ? -1 : 1;

  const tScale = opts.tScale ?? 0.06;
  const tCenterMul = (opts.tCenter != null) ? opts.tCenter : (w < 0.40 ? 1.20 : 1.18);
  const tWidthMul  = (opts.tWidth  != null) ? opts.tWidth  : (w < 0.40 ? 0.16 : 0.18);

  const tWave = gaussian(phase, c + w * tCenterMul, w * tWidthMul, amp * tScale * tSign);

  const complex = qrs * (1 - stWin) + stPlateau + recovery;

  return complex + tWave + sinRuido(t, amp);
}

function valueVT(t, amplitude, beat) {
  const faseLatido = fase(t, beat);

  const c = 0.44;
  const w = 0.22;

  const hombro = gaussian(faseLatido, c - w * 0.30, w * 0.11, amplitude * 0.22);
  const domo = gaussian(faseLatido, c, w * 0.20, amplitude * 2.05);
  const cola = gaussian(faseLatido, c + w * 0.40, w * 0.24, amplitude * 0.70);
  const muesca = gaussian(faseLatido, c + w * 0.08, w * 0.06, -amplitude * 0.14);
  const repol = -gaussian(faseLatido, 0.82, 0.11, amplitude * 0.10);

  const senal = hombro + domo + cola + muesca + repol;
  return softClip(sumarRuido(senal, t, amplitude, NOISE.wanderAmp * 0.28, NOISE.emgAmp * 0.28, NOISE.humAmp), 1.50);
}

function valuePacedVentricular(t, amplitude, beat, opts = {}) {
  const phase = fase(t, beat);
  const rrSec = Math.max(beat.rr, 0.35);
  const amp = amplitude * (opts.ampScale ?? 1.0);
  const spikeCenterSec = opts.spikeCenterSec ?? 0.18;
  const spikeWidthSec = opts.spikeWidthSec ?? 0.0024;
  const spikeToQrsSec = opts.spikeToQrsSec ?? 0.028;
  const qrsSec = opts.qrsSec ?? 0.16;

  const spikeCenter = clamp(spikeCenterSec / rrSec, 0.06, 0.42);
  const qrsCenter = clamp(
    (spikeCenterSec + spikeToQrsSec + qrsSec * 0.35) / rrSec,
    spikeCenter + 0.01,
    0.78
  );
  const qrsW = clamp(qrsSec / rrSec, 0.08, 0.38);

  const negWidthMul = opts.negWidthMul ?? 0.16;
  const posWidthMul = opts.posWidthMul ?? 0.08;
  const posScale = opts.posScale ?? 0.20;

  const neg = -triangle(
    phase,
    qrsCenter - qrsW * 0.14,
    qrsW * negWidthMul,
    amp * (opts.negScale ?? 4.00)
  );
  const pos = posScale > 0
    ? triangle(
      phase,
      qrsCenter + qrsW * 0.18,
      qrsW * posWidthMul,
      amp * posScale
    )
    : 0;

  const stLevel = amp * (opts.stLevel ?? 0.00);
  const stStartMul = opts.stStart ?? 0.30;
  const stEndMul = opts.stEnd ?? 1.00;
  const stEdge = qrsW * (opts.stEdge ?? 0.06);
  const stWin = smoothPlateau(
    phase,
    qrsCenter + qrsW * stStartMul,
    qrsCenter + qrsW * stEndMul,
    stEdge
  );
  const stPlateau = stWin * stLevel;

  const clipK = opts.clipK ?? 0.90;
  const qrsComplex = softClip(neg + pos + stPlateau, clipK);

  // T positiva y ancha posterior al QRS paced (discordancia secundaria).
  const tScale = opts.tScale ?? 0.36;
  const tCenterMul = opts.tCenterMul ?? 1.18;
  const tWidthMul = opts.tWidthMul ?? 0.42;
  const tWave = gaussian(
    phase,
    qrsCenter + qrsW * tCenterMul,
    qrsW * tWidthMul,
    amp * tScale
  );

  const spikeWidthPhase = clamp(spikeWidthSec / rrSec, 0.0002, 0.0040);
  const spikeShape = gaussian(phase, spikeCenter, spikeWidthPhase, 1.0);
  const vSpike = spikeShape * (opts.vSpikeAmp ?? 1.05);
  const base = qrsComplex + tWave + sinRuido(t, amp);
  const mezcla = clamp(spikeShape, 0, 1);

  return base * (1 - mezcla) + vSpike;
}

// Bloqueos y especiales
function valueAVB3(t, amplitude, ventricularBpm) {
  const bpmV = Math.max(36, ventricularBpm);
  const rrV = 60 / bpmV;
  const faseV = fract((t + 0.23) / rrV);
  const qrsSec = 0.09;
  const qrsW = qrsSec / rrV;
  const cV = TIMING_NARROW_QRS_CENTER;

  const ondaQ = triangle(faseV, cV - qrsW * 0.46, qrsW * 0.26, -amplitude * 0.14);
  const ondaR = gaussian(faseV, cV, qrsW * 0.16, amplitude * 1.02);
  const ondaS = triangle(faseV, cV + qrsW * 0.52, qrsW * 0.30, -amplitude * 0.32);
  const ondaVT = skewedGaussian(
    faseV,
    cV + qrsW * 2.00,
    qrsW * 0.65,
    qrsW * 1.15,
    amplitude * 0.12
  );

  const bpmA = 76;
  const rrA = 60 / bpmA;
  const faseA = fract((t + 0.07) / rrA);
  const ondaP = gaussian(faseA, 0.12, 0.030, amplitude * 0.12);

  return ondaQ + ondaR + ondaS + ondaVT + ondaP;
}

function valueVF(t, amplitude) {
  const envolvente = clamp(0.95 + 0.22 * fbm(t * 0.30, 3), 0.55, 1.25);
  const bandaA = Math.sin(2 * Math.PI * 6.2 * t + 0.4);
  const bandaB = Math.sin(2 * Math.PI * 8.4 * t + 1.2);
  const fv = softClip(0.60 * bandaA + 0.40 * bandaB, 0.80);
  return amplitude * 0.75 * envolvente * fv + sinRuido(t, amplitude);
}

function valueAsystole(t, amplitude) {
  return ruido(t, amplitude, 0.012, 0.0020, 0.0008);
}

// ===== Manejadores por ritmo =====
const crearSinus = (opts) => (t, amplitude, beat) => valueSinusBase(t, amplitude, beat, opts);
const crearSinusUniforme = (rhythmType) => (t, amplitude, beat) =>
  valueSinusUniform(t, amplitude, beat, rhythmType);
const crearManejadorConOpts = (fn, opts) => (t, amplitude, beat) => fn(t, amplitude, beat, opts);

// Opciones sinusales
const OPTS_SINUS_EXIT_ARREST = {
  prSec: 0.20,
  pCenterT: 0.06,
  pDur: 0.05,
  pAmp: 0.08,
  rAmp: 1.05,
  qAmp: -0.20,
  sAmp: -0.28,
  tDur: 0.10,
  tAmp: 0.24
};

const OPTS_SINUS_BASE = { prSec: 0.16, pCenterT: 0.06, pAmp: 0.10, tAmp: 0.22, rAmp: 1.05 };
const OPTS_PAC_ECTOPIC = { prSec: 0.12, pCenterT: 0.06, pAmpScale: 0.55, pDur: 0.05, rAmpScale: 1.00, tAmp: 0.22 };

// Bloqueos AV
const OPTS_AVB1 = {
  prSec: 0.30,
  pCenterT: 0.04,
  pDur: 0.060,
  pAmp: 0.10,
  qrsSec: 0.09,
  qAmp: -0.20,
  sAmp: -0.28,
  tAmp: 0.24,
  tDur: 0.14
};

const crearManejadorAVB2 = ({ dropPR, dropOpts, conductedPR, conductedOpts }) => (
  t,
  amplitude,
  beat
) => {
  if (beat.morph.dropQRS) {
    return valueSinusBase(t, amplitude, beat, {
      prSec: beat.morph.prSec ?? dropPR,
      ...dropOpts
    });
  }
  return valueSinusBase(t, amplitude, beat, {
    prSec: beat.morph.prSec ?? conductedPR,
    ...conductedOpts
  });
};

const OPTS_AVB2_TYPE1_DROP = {
  pCenterT: 0.06,
  pDur: 0.055,
  pAmp: 0.12,
  tAmp: 0.00,
  tDur: 0.10,
  hideQRS: true,
  hideT: true
};

const OPTS_AVB2_TYPE1_CONDUCTED = {
  pCenterT: 0.06,
  pDur: 0.055,
  pAmp: 0.10,
  qrsSec: 0.085,
  qAmp: -0.20,
  sAmp: -0.26,
  tAmp: 0.20,
  tDur: 0.11
};

const OPTS_AVB2_TYPE2_DROP = {
  pCenterT: 0.07,
  pDur: 0.065,
  pAmp: 0.14,
  tAmp: 0.00,
  tDur: 0.10,
  hideQRS: true,
  hideT: true
};

const OPTS_AVB2_TYPE2_CONDUCTED = {
  pCenterT: 0.065,
  pDur: 0.055,
  pAmp: 0.10,
  qrsSec: 0.11,
  rAmp: 0.94,
  qAmp: -0.22,
  sAmp: -0.52,
  tAmp: 0.16,
  tDur: 0.11
};

const manejarBAV2Tipo1 = crearManejadorAVB2({
  dropPR: 0.18,
  dropOpts: OPTS_AVB2_TYPE1_DROP,
  conductedPR: 0.18,
  conductedOpts: OPTS_AVB2_TYPE1_CONDUCTED
});

const manejarBAV2Tipo2 = crearManejadorAVB2({
  dropPR: 0.20,
  dropOpts: OPTS_AVB2_TYPE2_DROP,
  conductedPR: 0.20,
  conductedOpts: OPTS_AVB2_TYPE2_CONDUCTED
});

const manejarNSRConPAC = (t, amplitude, beat) => (
  beat.morph.isPAC
    ? valueSinusBase(t, amplitude, beat, OPTS_PAC_ECTOPIC)
    : valueSinusBase(t, amplitude, beat, OPTS_SINUS_BASE)
);

const manejarNSRConPJC = (t, amplitude, beat) => (
  beat.morph.isPJC
    ? valueJunctional(t, amplitude, beat)
    : valueSinusBase(t, amplitude, beat, OPTS_SINUS_BASE)
);

const pvcMorphOptsFromBeat = (beat) => {
  const pvc = beat?.morph?.pvc ?? {};
  return {
    pvc: {
      polarity: pvc.polarity ?? 1,
      qrsSec: pvc.qrsSec ?? 0.14,
      ampScale: pvc.ampScale ?? 1.15,
      notchScale: pvc.notchScale ?? 1.0,
      centerShift: pvc.centerShift ?? 0,
      tScale: pvc.tScale ?? 0.18,
      stScale: pvc.stScale ?? 1.0
    }
  };
};

const manejarNSRConPVC = (t, amplitude, beat) => (
  beat.morph.isPVC
    ? valuePVCInSinus(t, amplitude, beat, pvcMorphOptsFromBeat(beat))
    : valueSinusBase(t, amplitude, beat, OPTS_SINUS_BASE)
);

// Ventriculares
const OPTS_IDIOVENTRICULAR = {
  c: 0.50, w: 0.32, gateWidth: 0.30, ampScale: 1.08, rScale: 2.30,
  sScale: 0.90, sWidthMul: 0.18, stScale: 1.00, stLevel: 0.00,
  stStart: 0.26, stEnd: 1.10, termScale: 0.00, tScale: 0.00, clipK: 0.90
};

const OPTS_ACCEL_IVR = {
  c: 0.50, w: 0.48, gateWidth: 0.28, ampScale: 1.02, rScale: 1.80,
  sScale: 2.10, sWidthMul: 0.14, stScale: 0.85, stLevel: 0.00,
  stStart: 0.28, stEnd: 1.05, stEdge: 0.01, termScale: 0.00, tScale: 0.00, clipK: 0.95
};

const OPTS_PACED_VENTRICULAR = {
  ampScale: 1.02,
  spikeCenterSec: 0.18,
  spikeWidthSec: 0.0002,
  spikeToQrsSec: 0.024,
  qrsSec: 0.22,
  negScale: 4.00,
  negWidthMul: 0.16,
  posScale: 0.00,
  posWidthMul: 0.07,
  stLevel: 0.00,
  stStart: 0.26,
  stEnd: 0.96,
  stEdge: 0.05,
  tScale: 0.36,
  tCenterMul: 1.18,
  tWidthMul: 0.42,
  vSpikeAmp: 1.18,
  clipK: 0.90
};

const manejarSinusExitArrest = (t, amplitude, beat) =>
  valueSinusBase(t, amplitude, beat, { ...OPTS_SINUS_EXIT_ARREST, qtSec: qtFromRR(beat.rr) + 0.04 });

const MANEJADORES_RITMO = {
  [RHYTHM_TYPES.NORMAL]: crearSinusUniforme(RHYTHM_TYPES.NORMAL),
  [RHYTHM_TYPES.TACHYCARDIA]: crearSinusUniforme(RHYTHM_TYPES.TACHYCARDIA),
  [RHYTHM_TYPES.BRADICARDIA]: crearSinusUniforme(RHYTHM_TYPES.BRADICARDIA),

  [RHYTHM_TYPES.SINUS_EXIT_BLOCK]: manejarSinusExitArrest,
  [RHYTHM_TYPES.SINUS_ARREST]: manejarSinusExitArrest,

  [RHYTHM_TYPES.NSR_WITH_AVB1]: crearSinus(OPTS_AVB1),

  [RHYTHM_TYPES.AVB2_TYPE1]: manejarBAV2Tipo1,
  [RHYTHM_TYPES.AVB2_TYPE2]: manejarBAV2Tipo2,

  [RHYTHM_TYPES.NSR_WITH_PAC]: manejarNSRConPAC,
  [RHYTHM_TYPES.NSR_WITH_PJC]: manejarNSRConPJC,
  [RHYTHM_TYPES.NSR_WITH_PVC]: manejarNSRConPVC,

  [RHYTHM_TYPES.ATRIAL_FIBRILLATION]: valueAF,
  [RHYTHM_TYPES.ATRIAL_FLUTTER]: valueAFlutter,

  [RHYTHM_TYPES.JUNCTIONAL]: valueJunctional,
  [RHYTHM_TYPES.JUNCTIONAL_TACHY]: valueJunctional,

  [RHYTHM_TYPES.IDIOVENTRICULAR]: crearManejadorConOpts(valueIdioventricular, OPTS_IDIOVENTRICULAR),
  [RHYTHM_TYPES.ACCEL_IVR]: crearManejadorConOpts(valueIdioventricular, OPTS_ACCEL_IVR),

  [RHYTHM_TYPES.VTACH]: valueVT,

  [RHYTHM_TYPES.PACED_VENTRICULAR]: crearManejadorConOpts(valuePacedVentricular, OPTS_PACED_VENTRICULAR)
};

// ===== API pública =====
export function generateECGData(time, rhythmType, heartRate, amplitude, speed, leadType = 'II') {
  const infoRitmo = RHYTHM_INFO[rhythmType];
  const bpm = heartRate ?? infoRitmo?.bpm ?? 0;
  const t = time;

  if (rhythmType === RHYTHM_TYPES.VENTRICULAR_FIBRILLATION) return valueVF(t, amplitude);
  if (rhythmType === RHYTHM_TYPES.ASYSTOLE || bpm <= 0) return valueAsystole(t, amplitude);
  if (rhythmType === RHYTHM_TYPES.AVB3) return valueAVB3(t, amplitude, bpm);

  scheduler.ensure(t, rhythmType, bpm);
  const beat = scheduler.getBeatAt(t);
  if (!beat) return 0;

  const manejador = MANEJADORES_RITMO[rhythmType];
  return manejador
    ? manejador(t, amplitude, beat, rhythmType)
    : valueSinusUniform(t, amplitude, beat, RHYTHM_TYPES.NORMAL);
}

export function generateLeadData(time, rhythmType, heartRate, amplitude, speed, leadType) {
  return generateECGData(time, rhythmType, heartRate, amplitude, speed, leadType);
}
