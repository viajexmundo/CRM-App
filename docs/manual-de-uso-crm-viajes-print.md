<div class="cover">
  <div class="cover-top">
    <h1>Manual de Uso</h1>
    <h1 style="margin-top:0">CRM Viajes</h1>
    <p class="cover-subtitle">Versión lista para impresión (A4)</p>
  </div>

  <div class="cover-meta">
    <p><strong>Proyecto:</strong> Leads-App / CRM Viajes</p>
    <p><strong>Documento:</strong> Manual funcional para usuarios y administradores</p>
    <p><strong>Versión:</strong> 1.0</p>
    <p><strong>Fecha:</strong> 17 de marzo de 2026</p>
    <p><strong>Estado:</strong> Aprobado para capacitación interna</p>
  </div>
</div>

<div class="toc">

# Tabla de Contenido

1. Objetivo del sistema  
2. Acceso al sistema  
3. Roles y permisos  
4. Navegación general  
5. Flujo recomendado de trabajo  
6. Módulo Contactos  
7. Módulo Leads  
8. Módulo Oportunidades (Pipeline)  
9. Módulo Casos  
10. Módulo Plantillas  
11. Dashboard y Reportes  
12. Configuración (solo Admin)  
13. Buenas prácticas operativas  
14. Solución de problemas  
15. Checklist de onboarding  
16. Control de versiones

</div>

# 1. Objetivo del sistema
CRM Viajes centraliza la gestión comercial de la agencia: contactos, leads, oportunidades, seguimiento de ventas, casos de servicio, plantillas de comunicación y administración de usuarios.

# 2. Acceso al sistema
1. Abre la URL del CRM en tu navegador.
2. Inicia sesión con tu correo y contraseña.
3. El sistema valida permisos por rol y muestra únicamente los módulos autorizados.

# 3. Roles y permisos
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

# 4. Navegación general
- **Barra lateral:** acceso a módulos según rol.
- **Barra superior:** breadcrumb, buscador global y menú de usuario.
- **Búsqueda global:** atajo `Cmd/Ctrl + K` para buscar contactos, leads y oportunidades.

# 5. Flujo recomendado de trabajo
1. Crear contacto.
2. Crear lead.
3. Convertir lead a oportunidad.
4. Gestionar oportunidad en el pipeline.
5. Ejecutar seguimientos y acciones.
6. Cerrar como cliente ganado o perdido.
7. Abrir caso de soporte si hay incidencia.

<div class="page-break"></div>

# 6. Módulo Contactos
## 6.1 Crear contacto
1. Ir a **Contactos**.
2. Clic en **Nuevo Contacto**.
3. Completar nombre y apellido (obligatorios), y datos adicionales.
4. Guardar.

## 6.2 Filtros y búsqueda
- Buscar por nombre, correo o teléfono.
- Filtrar por tipo y fuente.

## 6.3 Detalle de contacto
- Pestañas: **Perfil**, **Oportunidades** y **Actividades**.
- Se puede editar la ficha.
- Se puede crear lead directamente desde el contacto.

# 7. Módulo Leads
## 7.1 Crear lead
1. Ir a **Leads**.
2. Clic en **Nuevo Lead**.
3. Completar datos mínimos: nombre y teléfono.
4. Agregar destino, pasajeros, fechas, notas y responsable.

## 7.2 Operación
- Cambiar estado del lead.
- Reasignar responsable.
- Usar filtros por estado, fuente, fecha y relación con oportunidad.

## 7.3 Convertir lead a oportunidad
1. Abrir lead.
2. Clic en **Convertir a oportunidad**.
3. El sistema crea y abre la nueva oportunidad.

# 8. Módulo Oportunidades (Pipeline)
## 8.1 Vista Kanban
Etapas:
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

## 8.2 Detalle de oportunidad
Pestañas:
- **Detalle:** diagnóstico, historial y acciones.
- **Seguimiento:** cronograma de follow-ups (cuando aplica).
- **Info del viaje:** destino, fechas, pasajeros, segmento y presupuesto.

## 8.3 Seguimiento automático
- En **Cotización en seguimiento**: se generan 6 pasos.
- En **Apartado**: se generan seguimientos cortos.
- Cada paso permite completar, omitir o abrir WhatsApp.

## 8.4 Acciones
Se pueden crear acciones como llamada, correo, reunión, WhatsApp, propuesta y seguimiento; luego marcarlas como completadas.

## 8.5 Cierre
- **Cliente ganado** para cierre exitoso.
- **Cerrado perdido** con motivo opcional.
- Se puede **reactivar** una oportunidad perdida.

<div class="page-break"></div>

# 9. Módulo Casos
## 9.1 Crear caso
1. Ir a **Casos**.
2. Clic en **Nuevo Caso**.
3. Completar asunto, prioridad y tipo.
4. Relacionar con contacto/oportunidad si aplica.

## 9.2 Gestión de caso
- Visualizar SLA y estado.
- Registrar resolución.
- Marcar como resuelto y luego cerrar.

# 10. Módulo Plantillas
Permite:
- Crear, editar y eliminar plantillas.
- Definir categoría, etapa y rol objetivo.
- Copiar mensajes al portapapeles.
- Usar variables como `{nombre}`, `{destino}`, `{asesor}`.

# 11. Dashboard y Reportes
## 11.1 Dashboard
- KPIs de operación.
- Acciones pendientes.
- Actividad reciente.

## 11.2 Reportes
- Totales de contactos, leads, oportunidades y casos.
- Valor del pipeline.
- Conversión y distribución por etapa.

# 12. Configuración (solo Admin)
## 12.1 Intervalos de seguimiento
Define tiempos automáticos para la etapa de cotización.

## 12.2 Gestión de usuarios
Crear usuarios, cambiar roles, actualizar teléfono y activar/desactivar cuentas.

## 12.3 Respaldo y restauración
- Exportar base completa `.json`.
- Importar respaldo `.json` (reemplaza datos actuales).

# 13. Buenas prácticas operativas
1. Contactar leads nuevos el mismo día.
2. Completar diagnóstico antes de cotizar.
3. Mantener acciones y seguimientos al día.
4. Documentar motivos de pérdida.
5. Priorizar casos con SLA crítico.
6. Respaldar antes de importaciones.

# 14. Solución de problemas
- Sin acceso a módulo: revisar rol.
- Sin resultados en búsqueda: escribir mínimo 2 caracteres.
- Error al importar respaldo: validar JSON.
- Error en conversión de lead: revisar estado actual del lead.

# 15. Checklist de onboarding
1. Iniciar sesión.
2. Crear contacto de prueba.
3. Crear lead desde contacto.
4. Convertir lead en oportunidad.
5. Mover oportunidad a Perfilado.
6. Crear una acción y completarla.
7. Registrar una plantilla.

<div class="page-break"></div>

# 16. Control de versiones
| Versión | Fecha | Cambio | Responsable |
|---|---|---|---|
| 1.0 | 17/03/2026 | Primera edición lista para impresión | Codex |

---

<p class="muted"><strong>Documento interno.</strong> Uso exclusivo del equipo comercial y administrativo de CRM Viajes.</p>
