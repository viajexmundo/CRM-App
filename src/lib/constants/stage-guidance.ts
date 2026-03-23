import type { PipelineStage } from "@/types";

export interface StageGuidance {
  title: string;
  description: string;
  tips: string[];
}

/**
 * Stage-specific guidance text shown in the "Siguiente Paso" card.
 * Provides actionable advice for the current pipeline stage.
 */
export const STAGE_GUIDANCE: Record<PipelineStage, StageGuidance> = {
  LEAD_NUEVO: {
    title: "Contactar al lead",
    description:
      "Este lead acaba de ingresar al sistema. Tu objetivo es hacer el primer contacto lo antes posible para generar confianza.",
    tips: [
      "Realiza el primer contacto dentro de las primeras 4 horas",
      "Preséntate y pregunta por sus intereses de viaje",
      "Si no contesta, envía un WhatsApp amigable",
      "Avanza a Perfilado cuando tengas conversación activa",
    ],
  },
  PERFILADO: {
    title: "Completar el diagnóstico",
    description:
      "Debes recopilar la información clave del cliente. Idealmente haz esto por llamada para generar confianza y obtener más detalles.",
    tips: [
      "Completa el cuestionario de diagnóstico con el cliente",
      "Pregunta por presupuesto, fechas, destino y pasajeros",
      "Identifica quién toma la decisión de compra",
      "Avanza a Propuesta cuando tengas toda la info necesaria",
    ],
  },
  PROPUESTA_EN_PREPARACION: {
    title: "Preparar y enviar la cotización",
    description:
      "Ya tienes la información del cliente. Ahora prepara una propuesta personalizada que se ajuste a sus necesidades.",
    tips: [
      "Arma la cotización con base en el diagnóstico",
      "Incluye al menos 2 opciones para que el cliente compare",
      "Agrega fotos y descripciones atractivas del destino",
      "Envía la cotización y marca 'Cotización enviada' cuando esté lista",
    ],
  },
  COTIZACION_EN_SEGUIMIENTO: {
    title: "Dar seguimiento a la cotización",
    description:
      "El cliente ya tiene tu propuesta. Sigue el cronograma de seguimiento para mantener el interés y resolver dudas.",
    tips: [
      "Sigue el cronograma de seguimiento automático",
      "Responde dudas rápidamente para no perder impulso",
      "Si el cliente pide cambios, actualiza la propuesta",
      "Avanza a Apartado cuando el cliente confirme",
    ],
  },
  APARTADO: {
    title: "Asegurar la reservación",
    description:
      "El cliente ha confirmado. Ahora debes asegurar que no pierda su reservación y completar los pagos.",
    tips: [
      "Confirma que el anticipo o apartado esté registrado",
      "Envía recordatorio de fechas límite de pago",
      "Verifica que los datos de pasajeros estén correctos",
      "Avanza a Venta cerrada cuando esté todo pagado",
    ],
  },
  VENTA_CERRADA: {
    title: "Preparar el viaje",
    description:
      "La venta está cerrada. Prepara toda la documentación y logística para que el cliente tenga la mejor experiencia.",
    tips: [
      "Envía confirmaciones y vouchers al cliente",
      "Verifica vuelos, hoteles y transfers",
      "Prepara un itinerario detallado",
      "Avanza a Viaje en curso cuando el cliente viaje",
    ],
  },
  VIAJE_EN_CURSO: {
    title: "Acompañar durante el viaje",
    description:
      "El cliente está viajando. Mantén comunicación para resolver cualquier imprevisto y asegurar su satisfacción.",
    tips: [
      "Envía un mensaje de bienvenida al destino",
      "Mantente disponible para emergencias",
      "Verifica que todo esté según lo planificado",
      "Avanza a Post-viaje cuando el cliente regrese",
    ],
  },
  POST_VIAJE: {
    title: "Seguimiento post-viaje",
    description:
      "El cliente ya regresó. Es momento de pedir retroalimentación y fortalecer la relación para futuras ventas.",
    tips: [
      "Pregunta cómo le fue en su viaje",
      "Pide un testimonio o reseña si quedó satisfecho",
      "Ofrece descuentos para su próximo viaje",
      "Avanza a Cliente ganado cuando se cierre el ciclo",
    ],
  },
  CLIENTE_GANADO: {
    title: "Cliente fidelizado",
    description:
      "Este cliente completó todo el ciclo exitosamente. Mantenlo en tu radar para futuras oportunidades.",
    tips: [
      "Agrega a tu lista de clientes VIP",
      "Envía ofertas especiales en fechas importantes",
      "Pide referidos a nuevos clientes potenciales",
    ],
  },
  CERRADO_PERDIDO: {
    title: "Oportunidad perdida",
    description:
      "Esta oportunidad no se concretó. Analiza las razones y aprende para mejorar en futuras ventas.",
    tips: [
      "Revisa el motivo de pérdida para aprender",
      "Considera reactivar en el futuro si aplica",
      "Puedes mover a Dormido si hay posibilidad de retomar",
    ],
  },
  DORMIDO: {
    title: "Lead en pausa",
    description:
      "Este lead está en pausa temporal. Revisa periódicamente si hay oportunidad de reactivarlo.",
    tips: [
      "Programa un recordatorio para revisar en 1-2 semanas",
      "Envía contenido de valor ocasionalmente",
      "Reactiva cuando el cliente muestre interés nuevamente",
    ],
  },
};
