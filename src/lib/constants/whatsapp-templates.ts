import type { PipelineStage, FollowUpStep } from "@/types";

/**
 * WhatsApp message templates per pipeline stage.
 * Variables: {nombre} = client first name, {destino} = destination, {asesor} = advisor name
 */

export interface WhatsAppTemplate {
  label: string;
  message: string;
}

/**
 * Templates for each pipeline stage.
 * Returns an array so the user can pick the appropriate template.
 */
export const STAGE_TEMPLATES: Partial<Record<PipelineStage, WhatsAppTemplate[]>> = {
  LEAD_NUEVO: [
    {
      label: "Saludo inicial",
      message:
        "Hola {nombre}, soy {asesor} de la agencia de viajes. Recibimos tu solicitud y me encantaría ayudarte a planear tu próximo viaje. ¿Tienes unos minutos para platicar sobre lo que tienes en mente?",
    },
  ],
  PERFILADO: [
    {
      label: "Solicitar información",
      message:
        "Hola {nombre}, gracias por tu interés. Para prepararte la mejor propuesta necesito conocer algunos detalles: ¿Cuántas personas viajan? ¿Tienen fechas tentativas? ¿Algún destino en mente? Quedo atento 😊",
    },
  ],
  PROPUESTA_EN_PREPARACION: [
    {
      label: "Aviso de propuesta",
      message:
        "Hola {nombre}, te comento que ya estoy trabajando en tu propuesta de viaje. En breve te la envío con todos los detalles y opciones. ¿Hay algo específico que quieras que incluya?",
    },
  ],
  COTIZACION_EN_SEGUIMIENTO: [
    {
      label: "Seguimiento general",
      message:
        "Hola {nombre}, ¿tuviste oportunidad de revisar la cotización que te envié? Si tienes alguna duda o quieres ajustar algo, con gusto te ayudo.",
    },
  ],
  APARTADO: [
    {
      label: "Confirmación de apartado",
      message:
        "Hola {nombre}, confirmado tu apartado. El siguiente paso es completar el pago restante. ¿Te gustaría que te envíe las opciones de pago y las fechas límite?",
    },
  ],
  VENTA_CERRADA: [
    {
      label: "Confirmación de venta",
      message:
        "Hola {nombre}, ¡excelente noticia! Tu viaje está confirmado. En los próximos días te enviaré toda la documentación y el itinerario detallado. ¡Prepárate para una gran experiencia! ✈️",
    },
  ],
  VIAJE_EN_CURSO: [
    {
      label: "Mensaje durante viaje",
      message:
        "Hola {nombre}, ¿cómo va tu viaje? Espero que estés disfrutando mucho. Si necesitas algo o tienes algún imprevisto, no dudes en escribirme. ¡Estoy para ayudarte!",
    },
  ],
  POST_VIAJE: [
    {
      label: "Seguimiento post-viaje",
      message:
        "Hola {nombre}, ¡bienvenido/a de vuelta! Espero que hayas disfrutado tu viaje. Me encantaría conocer tu experiencia. ¿Podrías compartirme tus comentarios? También si te interesa, ya puedo empezar a planear tu próxima aventura 😊",
    },
  ],
  DORMIDO: [
    {
      label: "Reactivación",
      message:
        "Hola {nombre}, hace tiempo platicamos sobre un viaje y quería saber si aún tienes interés. Tenemos nuevas opciones y promociones que podrían interesarte. ¿Te gustaría que te cuente?",
    },
  ],
};

/**
 * Templates specific to follow-up steps in COTIZACION_EN_SEGUIMIENTO.
 */
export const FOLLOW_UP_TEMPLATES: Record<FollowUpStep, WhatsAppTemplate> = {
  CONFIRMACION: {
    label: "Confirmación de recepción",
    message:
      "Hola {nombre}, te envié la cotización hace unas horas. ¿Pudiste recibirla correctamente? Si tienes alguna duda inicial, con gusto te la resuelvo.",
  },
  CORTO: {
    label: "Seguimiento corto",
    message:
      "Hola {nombre}, solo quería saber si ya revisaste la propuesta. ¿Alguna pregunta o ajuste que necesites?",
  },
  VALOR: {
    label: "Mensaje de valor",
    message:
      "Hola {nombre}, te comparto información adicional sobre el destino que te interesa. Muchos de nuestros clientes han tenido experiencias increíbles. ¿Te gustaría que te cuente más detalles?",
  },
  URGENCIA: {
    label: "Seguimiento de urgencia",
    message:
      "Hola {nombre}, te comento que las tarifas y disponibilidad del paquete que te cotizamos están por actualizarse. Si te interesa asegurar el precio actual, es buen momento para confirmar. ¿Qué opinas?",
  },
  CIERRE: {
    label: "Propuesta de cierre",
    message:
      "Hola {nombre}, ¿ya tomaste una decisión sobre el viaje? Me encantaría ayudarte a concretarlo. Puedo ofrecerte facilidades de pago o ajustar la propuesta a tus necesidades. ¿Platicamos?",
  },
  FINAL: {
    label: "Seguimiento final",
    message:
      "Hola {nombre}, este es mi último seguimiento sobre la cotización. Entiendo que los tiempos pueden cambiar. Si en algún momento retomas el interés, aquí estaré para ayudarte. La propuesta queda abierta por una semana más. ¡Saludos!",
  },
};

/**
 * Build the WhatsApp URL with the encoded message.
 * @param phone Phone number (can include country code or +502 prefix)
 * @param message Template with variables replaced
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  // Clean phone: remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, "");
  // If starts with +, remove it (WhatsApp API expects digits only)
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }
  // If it's 8 digits (Guatemala local), prepend 502
  if (cleaned.length === 8 && /^\d+$/.test(cleaned)) {
    cleaned = "502" + cleaned;
  }
  const encoded = encodeURIComponent(message);
  return `https://api.whatsapp.com/send/?phone=${cleaned}&text=${encoded}`;
}

/**
 * Replace template variables with actual values.
 */
export function fillTemplate(
  template: string,
  vars: { nombre?: string; destino?: string; asesor?: string }
): string {
  let result = template;
  if (vars.nombre) result = result.replace(/\{nombre\}/g, vars.nombre);
  if (vars.destino) result = result.replace(/\{destino\}/g, vars.destino);
  if (vars.asesor) result = result.replace(/\{asesor\}/g, vars.asesor);
  return result;
}
