# Manual de Uso - CRM Viajes

## 1. Objetivo del sistema
CRM Viajes es una plataforma para gestionar el ciclo comercial completo de una agencia: contactos, leads, oportunidades (pipeline), seguimiento post-cotización, casos de soporte, plantillas de mensajes y administración de usuarios.

## 2. Acceso al sistema
1. Abre la URL del CRM.
2. Inicia sesión en `/login` con correo y contraseña.
3. Si el usuario no tiene permiso para una sección, el sistema redirige automáticamente al Dashboard.

## 3. Roles y permisos
| Módulo | Vendedor | Coach | Admin | Contabilidad |
|---|---|---|---|---|
| Dashboard | Si | Si | Si | Si |
| Contactos | Si | Si | Si | No |
| Leads | Si | Si | Si | No |
| Oportunidades | Si | Si | Si | No |
| Casos | Si | Si | Si | No |
| Reportes | No | Si | Si | Si |
| Coaching | No | Si | Si | No |
| Plantillas | Si | Si | Si | No |
| Configuración | No | No | Si | No |

## 4. Navegación general
- **Barra lateral**: acceso a módulos según rol.
- **Barra superior**:
  - Breadcrumb de navegación.
  - Búsqueda global (`Cmd/Ctrl + K`) para Contactos, Leads y Oportunidades.
  - Menú de usuario para cerrar sesión.

## 5. Flujo recomendado de trabajo
1. Crear contacto.
2. Crear lead desde el contacto o desde el módulo Leads.
3. Convertir lead a oportunidad.
4. Mover oportunidad por etapas del pipeline.
5. Completar seguimientos y acciones.
6. Cerrar como **Cliente ganado** o **Cerrado perdido**.
7. Si hay incidencias, abrir y gestionar caso.

## 6. Módulo Contactos
### 6.1 Crear contacto
1. Ir a **Contactos**.
2. Clic en **Nuevo Contacto**.
3. Completar: Nombre, Apellido (obligatorios), correo, teléfono, tipo y fuente.
4. Clic en **Crear contacto**.

### 6.2 Buscar y filtrar
- Búsqueda por nombre, correo o teléfono.
- Filtros por tipo (Leisure/Corporativo) y fuente.

### 6.3 Detalle del contacto
- Pestañas: **Perfil**, **Oportunidades**, **Actividades**.
- Se puede editar la ficha.
- Botón **Crear Lead** para enviar el contacto al embudo comercial.

## 7. Módulo Leads
### 7.1 Crear lead
1. Ir a **Leads**.
2. Clic en **Nuevo Lead**.
3. Campos clave: nombre, teléfono, destino, pasajeros, fuente, fechas de viaje, notas y asignación.
4. Clic en **Crear lead**.

### 7.2 Operación diaria
- Filtros por estado, fuente, asignado, fecha y relación con oportunidad.
- Cambiar estado: Nuevo, Contactado, Calificado, Descalificado.
- Reasignar responsable.

### 7.3 Convertir a oportunidad
1. En listado o detalle del lead, clic en **Convertir a oportunidad**.
2. El sistema crea la oportunidad y redirige al detalle.
3. El lead queda vinculado y su estado se actualiza según etapa del pipeline.

## 8. Módulo Oportunidades (Pipeline)
### 8.1 Vista Kanban
- Arrastrar y soltar tarjetas entre etapas permitidas.
- Etapas:
  1. Lead nuevo
  2. Perfilado
  3. Propuesta en preparación
  4. Cotización en seguimiento
  5. Apartado
  6. Venta cerrada
  7. Viaje en curso
  8. Post-viaje
  9. Cliente ganado
  10. Cerrado perdido
  11. Dormido

### 8.2 Detalle de oportunidad
Pestañas principales:
- **Detalle**: datos comerciales, diagnóstico del lead, acciones e historial de etapas.
- **Seguimiento**: cronograma de follow-up (solo en Cotización en seguimiento y Apartado).
- **Info del viaje**: destino, motivo, fechas, pasajeros, segmento, presupuesto y solicitudes especiales.

### 8.3 Seguimientos automáticos
Al entrar a **Cotización en seguimiento**, se generan seguimientos automáticos:
1. Confirmación
2. Corto
3. Valor
4. Urgencia
5. Cierre
6. Final

Al entrar a **Apartado**, se generan seguimientos cortos de reservación.

Cada seguimiento permite:
- Abrir WhatsApp con plantilla sugerida.
- Marcar como **Completado** (con nota opcional).
- **Omitir**.

### 8.4 Acciones de oportunidad
En la tarjeta **Acciones** puedes crear tareas operativas (llamada, correo, reunión, WhatsApp, seguimiento, propuesta), con canal y fecha opcional, y marcarlas como completadas.

### 8.5 Cerrar o perder oportunidad
- **Cliente ganado**: cierre exitoso del ciclo.
- **Cerrado perdido**: pedir motivo opcional y registrar pérdida.
- Si se marcó por error como perdida, existe opción **Reactivar**.

## 9. Módulo Casos
### 9.1 Crear caso
1. Ir a **Casos**.
2. Clic en **Nuevo Caso**.
3. Completar asunto (obligatorio), descripción, tipo, prioridad y relación opcional (contacto/oportunidad).
4. Clic en **Crear caso**.

### 9.2 Gestión de casos
- Filtros por estado, prioridad y tipo.
- Visualización de SLA (en tiempo, atención, crítico, incumplido).
- En detalle de caso:
  - Registrar resolución.
  - Marcar como **Resuelto**.
  - Cerrar caso cuando aplique.

## 10. Módulo Plantillas
Permite administrar mensajes reutilizables por:
- Categoría (Bienvenida, Seguimiento, Cotización, etc.).
- Tipo de plantilla (general o notificaciones de asignación).
- Etapa del pipeline (opcional).
- Rol objetivo (opcional).

Operaciones disponibles:
- Crear, editar y eliminar plantillas.
- Copiar texto al portapapeles.
- Uso de variables como `{nombre}`, `{destino}`, `{asesor}`.

## 11. Dashboard y Reportes
### 11.1 Dashboard
Muestra:
- KPIs rápidos (contactos, leads, oportunidades activas, ventas ganadas, casos abiertos).
- Acciones pendientes priorizadas.
- Próximas acciones y actividad reciente.

### 11.2 Reportes
Muestra:
- Contactos totales, leads activos, oportunidades abiertas.
- Valor del pipeline.
- Tasa de conversión.
- Casos abiertos.
- Desglose de oportunidades por etapa.

## 12. Configuración (solo Admin)
### 12.1 Intervalos de seguimiento
Permite modificar tiempos del cronograma de seguimiento para la etapa **Cotización en seguimiento**.

### 12.2 Gestión de usuarios
- Crear usuario con rol y contraseña temporal.
- Cambiar teléfono.
- Cambiar rol.
- Activar/desactivar cuentas.

### 12.3 Respaldo y restauración
- Exportar base completa en `.json`.
- Importar respaldo `.json` (reemplaza toda la base de datos).

## 13. Buenas prácticas operativas
1. Contactar leads nuevos en las primeras horas.
2. Completar diagnóstico antes de cotizar.
3. Mantener actualizadas las acciones pendientes.
4. Documentar motivo al perder oportunidades.
5. Revisar diariamente seguimientos vencidos y casos con SLA crítico.
6. Ejecutar respaldos periódicos antes de importaciones masivas.

## 14. Solución de problemas
- **No puedo entrar a un módulo**: validar rol del usuario con Admin.
- **No aparecen resultados en búsqueda global**: ingresar al menos 2 caracteres.
- **No puedo convertir lead**: revisar que el lead no esté ya convertido/descalificado.
- **Importación fallida**: validar que el archivo sea `.json` válido y confirmar estructura de respaldo.

## 15. Checklist de onboarding (nuevo vendedor)
1. Iniciar sesión.
2. Crear 1 contacto de prueba.
3. Convertir contacto a lead.
4. Convertir lead a oportunidad.
5. Mover oportunidad de Lead nuevo a Perfilado.
6. Crear 1 acción y marcarla como completada.
7. Registrar 1 plantilla de seguimiento.

---

Documento generado para el proyecto **Leads-App / CRM Viajes**.
