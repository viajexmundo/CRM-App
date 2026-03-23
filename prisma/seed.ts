import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashSync } from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Seeding database...");

  // Create users
  const admin = await prisma.user.upsert({
    where: { email: "admin@agencia.com" },
    update: {},
    create: {
      email: "admin@agencia.com",
      passwordHash: hashSync("admin123", 10),
      name: "Carlos Admin",
      phone: "+50255500001",
      role: "ADMIN",
    },
  });

  const vendedor1 = await prisma.user.upsert({
    where: { email: "ana@agencia.com" },
    update: {},
    create: {
      email: "ana@agencia.com",
      passwordHash: hashSync("vendedor123", 10),
      name: "Ana García",
      phone: "+50255500002",
      role: "VENDEDOR",
    },
  });

  const vendedor2 = await prisma.user.upsert({
    where: { email: "luis@agencia.com" },
    update: {},
    create: {
      email: "luis@agencia.com",
      passwordHash: hashSync("vendedor123", 10),
      name: "Luis Martínez",
      phone: "+50255500003",
      role: "VENDEDOR",
    },
  });

  const coach = await prisma.user.upsert({
    where: { email: "maria@agencia.com" },
    update: {},
    create: {
      email: "maria@agencia.com",
      passwordHash: hashSync("coach123", 10),
      name: "María López",
      phone: "+50255500004",
      role: "COACH",
    },
  });

  const contabilidad = await prisma.user.upsert({
    where: { email: "pedro@agencia.com" },
    update: {},
    create: {
      email: "pedro@agencia.com",
      passwordHash: hashSync("conta123", 10),
      name: "Pedro Ramírez",
      phone: "+50255500005",
      role: "CONTABILIDAD",
    },
  });

  // Seed follow-up configuration (admin-configurable intervals)
  const followUpSteps = [
    {
      stepKey: "CONFIRMACION",
      label: "Seguimiento de Confirmación",
      description: "Confirmar que el cliente recibió la cotización y resolver dudas iniciales",
      dayOffset: 0,
      hourOffset: 4,
      sortOrder: 1,
    },
    {
      stepKey: "CORTO",
      label: "Seguimiento corto",
      description: "Contacto breve para mantener el interés y consultar si tiene preguntas",
      dayOffset: 1,
      hourOffset: 0,
      sortOrder: 2,
    },
    {
      stepKey: "VALOR",
      label: "Seguimiento de valor",
      description: "Compartir información adicional de valor: testimonios, fotos del destino, tips",
      dayOffset: 3,
      hourOffset: 0,
      sortOrder: 3,
    },
    {
      stepKey: "URGENCIA",
      label: "Seguimiento de urgencia",
      description: "Generar sentido de urgencia: disponibilidad limitada, fechas próximas, precios",
      dayOffset: 5,
      hourOffset: 0,
      sortOrder: 4,
    },
    {
      stepKey: "CIERRE",
      label: "Seguimiento de cierre",
      description: "Intentar cerrar la venta, ofrecer condiciones especiales o facilidades de pago",
      dayOffset: 7,
      hourOffset: 0,
      sortOrder: 5,
    },
    {
      stepKey: "FINAL",
      label: "Seguimiento final",
      description: "Último intento de contacto, ofrecer mantener la propuesta abierta por tiempo limitado",
      dayOffset: 14,
      hourOffset: 0,
      sortOrder: 6,
    },
  ];

  for (const step of followUpSteps) {
    await prisma.followUpConfig.upsert({
      where: { stepKey: step.stepKey },
      update: {
        label: step.label,
        description: step.description,
        dayOffset: step.dayOffset,
        hourOffset: step.hourOffset,
        sortOrder: step.sortOrder,
      },
      create: step,
    });
  }

  // Create contacts
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        firstName: "Roberto",
        lastName: "Hernández",
        email: "roberto.h@gmail.com",
        phone: "+50255501234",
        type: "LEISURE",
        preferredChannel: "WHATSAPP",
        source: "WHATSAPP",
        consentStatus: "GRANTED",
        consentDate: new Date(),
        country: "GT",
        normalizedEmail: "roberto.h@gmail.com",
        normalizedPhone: "50255501234",
      },
    }),
    prisma.contact.create({
      data: {
        firstName: "Sandra",
        lastName: "Morales",
        email: "sandra.morales@empresa.com",
        phone: "+50255509876",
        type: "CORPORATE",
        company: "TechCorp Guatemala",
        position: "Directora de RRHH",
        preferredChannel: "EMAIL",
        source: "REFERRAL",
        consentStatus: "GRANTED",
        consentDate: new Date(),
        country: "GT",
        normalizedEmail: "sandra.morales@empresa.com",
        normalizedPhone: "50255509876",
      },
    }),
    prisma.contact.create({
      data: {
        firstName: "Jorge",
        lastName: "Castillo",
        email: "jcastillo@hotmail.com",
        phone: "+50255507777",
        type: "LEISURE",
        preferredChannel: "PHONE",
        source: "WEBSITE",
        consentStatus: "GRANTED",
        consentDate: new Date(),
        country: "GT",
        normalizedEmail: "jcastillo@hotmail.com",
        normalizedPhone: "50255507777",
      },
    }),
    prisma.contact.create({
      data: {
        firstName: "Patricia",
        lastName: "Flores",
        email: "pflores@outlook.com",
        phone: "+50255503333",
        type: "LEISURE",
        preferredChannel: "WHATSAPP",
        source: "SOCIAL_MEDIA",
        consentStatus: "PENDING",
        country: "GT",
        normalizedEmail: "pflores@outlook.com",
        normalizedPhone: "50255503333",
      },
    }),
    prisma.contact.create({
      data: {
        firstName: "Fernando",
        lastName: "Ruiz",
        email: "fruiz@corporativo.com",
        phone: "+50255504444",
        type: "CORPORATE",
        company: "Grupo Industrial SA",
        position: "Gerente de Compras",
        preferredChannel: "EMAIL",
        source: "EVENT",
        consentStatus: "GRANTED",
        consentDate: new Date(),
        country: "GT",
        normalizedEmail: "fruiz@corporativo.com",
        normalizedPhone: "50255504444",
      },
    }),
  ]);

  // Create leads
  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        contactId: contacts[0].id,
        assignedToId: vendedor1.id,
        status: "CALIFICADO",
        score: 75,
        source: "WHATSAPP",
        interest: "Viaje familiar a Cancún",
        budget: 3500,
        budgetCurrency: "GTQ",
        destination: "Cancún, México",
        travelMotif: "Vacaciones familiares",
        passengers: 4,
        qualifiedAt: new Date(),
      },
    }),
    prisma.lead.create({
      data: {
        contactId: contacts[1].id,
        assignedToId: vendedor2.id,
        status: "NUEVO",
        score: 60,
        source: "REFERRAL",
        interest: "Viajes corporativos para equipo",
        budget: 15000,
        budgetCurrency: "GTQ",
        destination: "Miami, USA",
        travelMotif: "Viaje corporativo",
        passengers: 10,
      },
    }),
    prisma.lead.create({
      data: {
        contactId: contacts[2].id,
        assignedToId: vendedor1.id,
        status: "CONTACTADO",
        score: 45,
        source: "WEBSITE",
        interest: "Luna de miel en Europa",
        budget: 8000,
        budgetCurrency: "GTQ",
        destination: "Italia/Francia",
        travelMotif: "Luna de miel",
        passengers: 2,
      },
    }),
  ]);

  // Create opportunities with NEW pipeline stages
  const opps = await Promise.all([
    prisma.opportunity.create({
      data: {
        title: "Vacaciones Cancún - Fam. Hernández",
        contactId: contacts[0].id,
        leadId: leads[0].id,
        assignedToId: vendedor1.id,
        stage: "PROPUESTA_EN_PREPARACION",
        probability: 30,
        estimatedValue: 3500,
        currency: "GTQ",
        segment: "LEISURE",
        travelMotif: "Vacaciones familiares",
        destination: "Cancún, México",
        departureDate: new Date("2026-07-10"),
        returnDate: new Date("2026-07-17"),
        passengers: 4,
        priorities: JSON.stringify(["Hotel cerca de playa", "Actividades para niños", "Todo incluido"]),
        restrictions: JSON.stringify(["Salida desde GUA", "Máximo 1 escala"]),
        budgetMin: 3000,
        budgetMax: 4000,
        budgetCurrency: "GTQ",
        decisionMaker: "Roberto y esposa",
        decisionCriteria: "Precio total y política de cancelación",
        nextStepType: "VIDEOLLAMADA",
        nextStepAction: "Presentar 3 opciones de paquete",
        nextStepDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        nextStepChannel: "GOOGLE_MEET",
      },
    }),
    prisma.opportunity.create({
      data: {
        title: "Viaje corporativo Miami - TechCorp",
        contactId: contacts[1].id,
        leadId: leads[1].id,
        assignedToId: vendedor2.id,
        stage: "PERFILADO",
        probability: 15,
        estimatedValue: 15000,
        currency: "GTQ",
        segment: "CORPORATE",
        travelMotif: "Viaje corporativo",
        destination: "Miami, USA",
        departureDate: new Date("2026-09-15"),
        returnDate: new Date("2026-09-20"),
        passengers: 10,
        nextStepType: "LLAMADA",
        nextStepAction: "Llamar para completar diagnóstico",
        nextStepDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.opportunity.create({
      data: {
        title: "Luna de miel Europa - Castillo",
        contactId: contacts[2].id,
        leadId: leads[2].id,
        assignedToId: vendedor1.id,
        stage: "COTIZACION_EN_SEGUIMIENTO",
        probability: 60,
        estimatedValue: 8000,
        currency: "GTQ",
        segment: "LEISURE",
        travelMotif: "Luna de miel",
        destination: "Italia y Francia",
        departureDate: new Date("2026-11-01"),
        returnDate: new Date("2026-11-15"),
        passengers: 2,
        priorities: JSON.stringify(["Hoteles boutique", "Experiencias gastronómicas"]),
        restrictions: JSON.stringify(["Vuelos directos preferidos", "No hostales"]),
        decisionMaker: "Jorge y novia",
        decisionCriteria: "Experiencia romántica y calidad",
        nextStepType: "SEGUIMIENTO",
        nextStepAction: "Confirmar recepción de cotización",
        nextStepDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.opportunity.create({
      data: {
        title: "Nuevo lead - Patricia Flores",
        contactId: contacts[3].id,
        assignedToId: vendedor2.id,
        stage: "LEAD_NUEVO",
        probability: 5,
        estimatedValue: 2000,
        currency: "GTQ",
        nextStepType: "MENSAJE",
        nextStepAction: "Enviar mensaje de bienvenida por WhatsApp",
        nextStepDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
      },
    }),
    prisma.opportunity.create({
      data: {
        title: "Viajes mensuales - Grupo Industrial",
        contactId: contacts[4].id,
        assignedToId: vendedor1.id,
        stage: "COTIZACION_EN_SEGUIMIENTO",
        probability: 60,
        estimatedValue: 25000,
        currency: "GTQ",
        segment: "CORPORATE",
        travelMotif: "Viajes ejecutivos mensuales",
        destination: "Varios destinos",
        passengers: 5,
        priorities: JSON.stringify(["Flexibilidad de cambios", "Tarifas corporativas", "Facturación mensual"]),
        restrictions: JSON.stringify(["Política de viajes corporativos", "Aprobación gerencia"]),
        decisionMaker: "Fernando Ruiz + Dirección",
        decisionCriteria: "Precio y nivel de servicio",
        nextStepType: "REUNION",
        nextStepAction: "Reunión para cerrar acuerdo corporativo",
        nextStepDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  // Create follow-ups for the opportunity in COTIZACION_EN_SEGUIMIENTO
  const now = new Date();
  const seguimientoOpp = opps[4]; // Viajes mensuales - Grupo Industrial
  const enteredAt = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // entered 2 days ago

  await Promise.all([
    prisma.followUp.create({
      data: {
        opportunityId: seguimientoOpp.id,
        stepKey: "CONFIRMACION",
        label: "Seguimiento de Confirmación",
        scheduledAt: new Date(enteredAt.getTime() + 4 * 60 * 60 * 1000),
        completedAt: new Date(enteredAt.getTime() + 5 * 60 * 60 * 1000),
        completedById: vendedor1.id,
        notes: "Cliente confirmó recepción. Dice que lo revisará con la dirección.",
        status: "COMPLETED",
      },
    }),
    prisma.followUp.create({
      data: {
        opportunityId: seguimientoOpp.id,
        stepKey: "CORTO",
        label: "Seguimiento corto",
        scheduledAt: new Date(enteredAt.getTime() + 1 * 24 * 60 * 60 * 1000),
        completedAt: new Date(enteredAt.getTime() + 1.2 * 24 * 60 * 60 * 1000),
        completedById: vendedor1.id,
        notes: "Se contactó brevemente. Aún no tiene respuesta de la dirección.",
        status: "COMPLETED",
      },
    }),
    prisma.followUp.create({
      data: {
        opportunityId: seguimientoOpp.id,
        stepKey: "VALOR",
        label: "Seguimiento de valor",
        scheduledAt: new Date(enteredAt.getTime() + 3 * 24 * 60 * 60 * 1000),
        status: "PENDING",
      },
    }),
    prisma.followUp.create({
      data: {
        opportunityId: seguimientoOpp.id,
        stepKey: "URGENCIA",
        label: "Seguimiento de urgencia",
        scheduledAt: new Date(enteredAt.getTime() + 5 * 24 * 60 * 60 * 1000),
        status: "PENDING",
      },
    }),
    prisma.followUp.create({
      data: {
        opportunityId: seguimientoOpp.id,
        stepKey: "CIERRE",
        label: "Seguimiento de cierre",
        scheduledAt: new Date(enteredAt.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: "PENDING",
      },
    }),
    prisma.followUp.create({
      data: {
        opportunityId: seguimientoOpp.id,
        stepKey: "FINAL",
        label: "Seguimiento final",
        scheduledAt: new Date(enteredAt.getTime() + 14 * 24 * 60 * 60 * 1000),
        status: "PENDING",
      },
    }),
  ]);

  // Create some activities
  await Promise.all([
    prisma.activity.create({
      data: {
        type: "NOTE",
        title: "Primer contacto",
        description: "Roberto contactó por WhatsApp preguntando por paquetes a Cancún para julio. 2 adultos, 2 niños.",
        userId: vendedor1.id,
        contactId: contacts[0].id,
        opportunityId: opps[0].id,
      },
    }),
    prisma.activity.create({
      data: {
        type: "CALL",
        title: "Llamada de calificación",
        description: "Se confirmó presupuesto, fechas y preferencias. Cliente muy interesado.",
        userId: vendedor1.id,
        contactId: contacts[0].id,
        opportunityId: opps[0].id,
      },
    }),
    prisma.activity.create({
      data: {
        type: "STAGE_CHANGE",
        title: "Cambio de etapa",
        description: "Oportunidad movida de Perfilado a Propuesta en preparación",
        userId: vendedor1.id,
        opportunityId: opps[0].id,
      },
    }),
    prisma.activity.create({
      data: {
        type: "EMAIL",
        title: "Cotización enviada",
        description: "Se envió cotización de viaje corporativo a Sandra Morales",
        userId: vendedor2.id,
        contactId: contacts[1].id,
        opportunityId: opps[1].id,
      },
    }),
  ]);

  // Create templates
  await Promise.all([
    prisma.template.create({
      data: {
        name: "Bienvenida WhatsApp",
        channel: "WHATSAPP",
        category: "FOLLOW_UP",
        body: "¡Hola {{nombre}}! 👋 Soy {{vendedor}} de la agencia. Recibimos tu consulta sobre {{destino}}. ¿Tienes unos minutos para platicar sobre tu viaje? Estoy para ayudarte.",
        variables: JSON.stringify(["nombre", "vendedor", "destino"]),
        createdBy: admin.id,
      },
    }),
    prisma.template.create({
      data: {
        name: "Seguimiento cotización",
        channel: "EMAIL",
        category: "FOLLOW_UP",
        subject: "Tu cotización de viaje a {{destino}} - {{agencia}}",
        body: "Estimado/a {{nombre}},\n\nEspero que estés bien. Te escribo para dar seguimiento a la cotización de viaje que te envié el {{fecha}}.\n\n¿Has tenido oportunidad de revisarla? Estoy disponible para resolver cualquier duda o ajustar las opciones según tus preferencias.\n\nQuedo atento/a.\n\nSaludos cordiales,\n{{vendedor}}",
        variables: JSON.stringify(["nombre", "destino", "agencia", "fecha", "vendedor"]),
        createdBy: admin.id,
      },
    }),
    prisma.template.create({
      data: {
        name: "Confirmación de reserva",
        channel: "EMAIL",
        category: "BOOKING",
        subject: "¡Reserva confirmada! Tu viaje a {{destino}}",
        body: "Estimado/a {{nombre}},\n\n¡Excelentes noticias! Tu reserva ha sido confirmada.\n\nDestino: {{destino}}\nFechas: {{fecha_salida}} - {{fecha_regreso}}\nPasajeros: {{pasajeros}}\nConfirmación: {{confirmacion}}\n\nTe enviaremos los documentos completos en breve.\n\nSaludos,\n{{vendedor}}",
        variables: JSON.stringify(["nombre", "destino", "fecha_salida", "fecha_regreso", "pasajeros", "confirmacion", "vendedor"]),
        createdBy: admin.id,
      },
    }),
  ]);

  // Create tasks
  await Promise.all([
    prisma.task.create({
      data: {
        title: "Preparar cotización Cancún - Hernández",
        description: "Armar opciones de paquete: hotel 3*, hotel 4* AI, resort 5* AI",
        type: "DOCUMENT",
        priority: "HIGH",
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        userId: vendedor1.id,
        opportunityId: opps[0].id,
      },
    }),
    prisma.task.create({
      data: {
        title: "Llamar a Sandra - TechCorp",
        description: "Completar diagnóstico: número exacto de viajeros, fechas flexibles, políticas corporativas",
        type: "CALL",
        priority: "MEDIUM",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        userId: vendedor2.id,
        opportunityId: opps[1].id,
      },
    }),
  ]);

  // Seed default WhatsApp templates
  await prisma.template.createMany({
    data: [
      {
        name: "Bienvenida inicial",
        channel: "WHATSAPP",
        category: "BIENVENIDA",
        body: "Hola {nombre}, soy {asesor} de CRM Viajes. Gracias por tu interés en viajar. Me encantaría ayudarte a planificar tu viaje ideal. ¿Tienes algún destino en mente?",
        variables: JSON.stringify(["nombre", "asesor"]),
        createdBy: admin.id,
      },
      {
        name: "Envío de cotización",
        channel: "WHATSAPP",
        category: "COTIZACION",
        body: "Hola {nombre}, te comparto la cotización para tu viaje a {destino}. Incluye vuelos, hospedaje y traslados. ¿Tienes alguna duda o deseas ajustar algo?",
        variables: JSON.stringify(["nombre", "destino"]),
        createdBy: admin.id,
      },
      {
        name: "Seguimiento de cotización",
        channel: "WHATSAPP",
        category: "SEGUIMIENTO",
        body: "Hola {nombre}, ¿pudiste revisar la cotización que te envié? Estoy disponible para resolver cualquier duda. Los espacios son limitados y me gustaría asegurar tu reservación.",
        variables: JSON.stringify(["nombre"]),
        createdBy: admin.id,
      },
      {
        name: "Confirmación de reserva",
        channel: "WHATSAPP",
        category: "CONFIRMACION",
        body: "¡Excelente {nombre}! Tu reservación a {destino} está confirmada. Te enviaré todos los detalles del itinerario en las próximas horas. ¡Prepárate para una experiencia increíble!",
        variables: JSON.stringify(["nombre", "destino"]),
        createdBy: admin.id,
      },
      {
        name: "Recordatorio de pago",
        channel: "WHATSAPP",
        category: "URGENCIA",
        body: "Hola {nombre}, te recuerdo que el pago de tu reservación vence pronto. Para no perder tu lugar, te recomiendo completar el pago a la brevedad. ¿Necesitas ayuda con el proceso?",
        variables: JSON.stringify(["nombre"]),
        createdBy: admin.id,
      },
      {
        name: "Post-viaje",
        channel: "WHATSAPP",
        category: "POST_VENTA",
        body: "Hola {nombre}, espero que hayas disfrutado tu viaje a {destino}. Tu opinión es muy importante para nosotros. ¿Podrías compartirme cómo fue tu experiencia?",
        variables: JSON.stringify(["nombre", "destino"]),
        createdBy: admin.id,
      },
    ],
  });

  console.log("Seed complete!");
  console.log(`  Users: ${5}`);
  console.log(`  Contacts: ${contacts.length}`);
  console.log(`  Leads: ${leads.length}`);
  console.log(`  Opportunities: ${opps.length}`);
  console.log(`  Follow-up configs: ${followUpSteps.length}`);
  console.log(`  Templates: 6`);
  console.log("\n  Login credentials:");
  console.log("  admin@agencia.com / admin123 (Admin)");
  console.log("  ana@agencia.com / vendedor123 (Vendedor)");
  console.log("  luis@agencia.com / vendedor123 (Vendedor)");
  console.log("  maria@agencia.com / coach123 (Coach)");
  console.log("  pedro@agencia.com / conta123 (Contabilidad)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
