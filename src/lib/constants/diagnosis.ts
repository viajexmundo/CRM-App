/**
 * Diagnosis questionnaire for qualifying leads / opportunities.
 * Each question has weighted options — total score indicates closing probability.
 * Max total = 100
 */

export interface DiagnosisOption {
  label: string;
  value: string;
  score: number;
}

export interface DiagnosisQuestion {
  key: string;
  question: string;
  description: string;
  options: DiagnosisOption[];
  weight: number; // multiplier applied to the option score
}

export const DIAGNOSIS_QUESTIONS: DiagnosisQuestion[] = [
  {
    key: "travel_timeframe",
    question: "¿Cuándo planea viajar?",
    description: "Urgencia del viaje",
    weight: 1,
    options: [
      { label: "En los próximos 30 días", value: "30_DAYS", score: 25 },
      { label: "En 1-3 meses", value: "1_3_MONTHS", score: 20 },
      { label: "En 3-6 meses", value: "3_6_MONTHS", score: 12 },
      { label: "Más de 6 meses o sin fecha", value: "NO_DATE", score: 5 },
    ],
  },
  {
    key: "budget_clarity",
    question: "¿Tiene presupuesto definido?",
    description: "Claridad y disponibilidad de fondos",
    weight: 1,
    options: [
      { label: "Sí, presupuesto aprobado y listo", value: "APPROVED", score: 25 },
      { label: "Tiene un rango estimado", value: "ESTIMATED", score: 18 },
      { label: "Está cotizando opciones", value: "COMPARING", score: 10 },
      { label: "No tiene idea / no ha pensado en presupuesto", value: "NONE", score: 3 },
    ],
  },
  {
    key: "decision_maker",
    question: "¿Es el tomador de decisión?",
    description: "Capacidad de decidir la compra",
    weight: 1,
    options: [
      { label: "Sí, decide solo/a", value: "SOLE", score: 20 },
      { label: "Decide en pareja/grupo pero está presente", value: "GROUP_PRESENT", score: 15 },
      { label: "Necesita consultar con otros", value: "CONSULT", score: 8 },
      { label: "No es quien decide", value: "NOT_DECIDER", score: 2 },
    ],
  },
  {
    key: "previous_experience",
    question: "¿Ha viajado con agencia antes?",
    description: "Experiencia previa con servicios similares",
    weight: 1,
    options: [
      { label: "Sí, es cliente recurrente nuestro", value: "RETURNING", score: 20 },
      { label: "Sí, con otra agencia", value: "OTHER_AGENCY", score: 15 },
      { label: "Primera vez con agencia pero ha viajado", value: "FIRST_AGENCY", score: 10 },
      { label: "Nunca ha viajado / primera experiencia", value: "NEVER", score: 5 },
    ],
  },
  {
    key: "engagement_level",
    question: "¿Qué tan comprometido está el cliente?",
    description: "Nivel de interacción y respuesta",
    weight: 1,
    options: [
      { label: "Responde rápido, hace preguntas, muy interesado", value: "HIGH", score: 10 },
      { label: "Responde pero tarda, moderadamente interesado", value: "MEDIUM", score: 7 },
      { label: "Respuestas esporádicas, parece dudoso", value: "LOW", score: 3 },
      { label: "No responde o muy difícil de contactar", value: "NONE", score: 1 },
    ],
  },
];

/**
 * Calculate total diagnosis score from answers.
 * @param answers Record<questionKey, selectedValue>
 * @returns score 0-100
 */
export function calculateDiagnosisScore(answers: Record<string, string>): number {
  let total = 0;
  for (const q of DIAGNOSIS_QUESTIONS) {
    const selected = answers[q.key];
    if (selected) {
      const option = q.options.find((o) => o.value === selected);
      if (option) {
        total += option.score * q.weight;
      }
    }
  }
  return Math.min(total, 100);
}

/**
 * Get label for a score range.
 */
export function getDiagnosisLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Excelente", color: "text-green-600" };
  if (score >= 60) return { label: "Bueno", color: "text-blue-600" };
  if (score >= 40) return { label: "Moderado", color: "text-amber-600" };
  if (score >= 20) return { label: "Bajo", color: "text-orange-600" };
  return { label: "Muy bajo", color: "text-red-600" };
}
