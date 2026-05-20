# Plan de Trabajo Realizado — Sistema MX

> Última actualización: 2026-05-18

---

## 1. CRM WhatsApp

### Leads y Pipeline
- Lista de leads con métricas dinámicas por estado
- Columna "Resp." con cronómetro en tiempo real (3 modos: conversando / detenido / legacy)
- Toggle "Conversando" con persistencia en `conversando_stopped_at`
- Auto-cambio de estado Nuevo → Contactado al primer mensaje del asesor
- Pipeline Kanban con 11 estados, asignación round-robin de asesores
- KPIs: pipeline total, probable cierre, leads activos, sin asignar
- Alertas de leads sin responder: badge pulsante en header + panel pipeline, persisten hasta activar toggle Conversando

### Conversación (Chat)
- Layout estilo WhatsApp: 2 columnas (datos del lead + chat)
- Burbujas: entrantes blancas, salientes verdes (#dcf8c6), fondo #e5ddd5 con patrón SVG
- Ficha cliente: mini-card "Cliente en MX" + drawer lateral con 5 tabs (Resumen, Vehículos, Órdenes, Cotizaciones, Facturación)
- Detección automática de URLs, timestamps formateados d/m/Y H:i

### Plantillas
- Panel admin en `/crm/plantillas` con 16 plantillas predefinidas para talleres
- Variables dinámicas: `{nombre}`, `{asesor}`, `{taller}`, etc.
- Tracking de uso, favoritos, búsqueda y filtro por categoría
- Grid layout responsive CSS `auto-fill minmax(320px,1fr)`

### Botón Asesor (Support Agent)
- Modal con lista de plantillas → genera link `wa.me` con mensaje pre-cargado al cliente
- Fix encoding emojis con `encodeURIComponent()` simple
- Ruta `/crm/plantillas-chat` (fix de captura dinámica de rutas)

### Servicios Rápidos
- Tabla `whatsapp_servicios_rapidos`, CRUD en `/crm/servicios-rapidos`
- Botones rápidos en pipeline y conversación con ranking de uso (top 15)
- Descompone strings combinados para conteo individual por término

### Diagnóstico Comercial
- 14 preguntas con scoring automático (4 niveles: Crítico / En riesgo / Superficie / Sin diagnosticar)
- Umbrales: ≥74% Crítico, ≥48% En riesgo, ≥24% Superficie, <24% Sin diagnosticar
- Dashboard con paneles: estado, financiero, HOY vs CON MX, recomendación por categoría
- Slider de mejora 15–30% + cálculos de pérdida/ganancia proyectada
- Select2 AJAX para búsqueda de contactos (2+ caracteres, max 50 resultados)
- Campo `$scoreRealTotal` calculado en PHP (no columna BD)

### Embudos (Funnels)
- Tablas BD: `crm_embudos`, `crm_embudo_pasos`, `crm_embudo_inscripciones`
- 4 tipos de pasos: Espera (gris ⏱), Mensaje (verde 💬), Condición (naranja 🔀), Acción (rojo ⚡)
- Modal full-screen para configurar pasos con preview WhatsApp y variables clicables
- Stats: conversión real entre pasos, funnel graph con porcentajes
- Upload media (imagen/documento/video) para pasos → guarda en S3 `embudos/media/`

### Planes y Combos
- Tablas: `crm_planes`, `crm_combos`, `crm_combo_planes`
- Precio oficial, precio venta, precio oferta
- Propuesta comercial desde diagnóstico con vista previa de ahorro
- Precio_oficial del combo = suma automática de planes; precio_asignado por plan en pivote

### UI/UX General CRM
- Banderas de país en teléfonos (flagcdn.com 16×12, no emojis — fallan en Windows)
- Números formateados en bloques de 3 dígitos
- Header moderno con ícono gradiente verde, título + subtítulo
- Fix emojis corruptos: utf8mb4 en BD + `SET NAMES utf8mb4` en endpoints
- Fix DataTables Responsive: destruir instancia previa, reinicializar con `responsive:false`

### Bug Fixes CRM
- Alert undefined en envío API: fallback a `xhr.responseJSON || {}` con mensaje por defecto
- Editar valor lead: botones con `data-*` attrs + `{{ e(...) }}` en lugar de `@json()` en onclick
- Emojis en `whatsapp_plantilla_actividad`: try/catch + tabla con charset utf8mb4
- `first_response_at` contaba mensajes del bot: solo `message_type='text'` actualiza el campo
- Auto-cambio estado Contactado: JS actualiza select via `r.nuevo_status_id` numérico

---

## 2. Infraestructura Backend

### Evolution API (VPS)
- VPS Contabo (5.189.170.58, Ubuntu 24.04), Evolution API v1.8.7 en Docker con nginx + SSL
- Dominio: evolution.mxonesolution.com, puerto 8080
- `AUTHENTICATION_API_KEY=MxOne2026One`, MongoDB
- Instancia activa: `mx_one_solution` (número de David)
- Webhook PHP puro en `/var/www/webhook/webhook_evolution.php` (no Laravel)
- Fixes: anti-duplicado (UNIQUE en `wa_message_id`), timezone dinámico por tenant, lógica @lid busca lead existente sin crear falsos

### Cron CRM
- Script PHP PDO en `/home/pwopwzzn/temporal/cron_crm.php` (sin Laravel, sin framework)
- Crontab: `* * * * * /usr/local/bin/php /home/pwopwzzn/temporal/cron_crm.php`
- Tareas: mover leads sin respuesta a "Sin responder", generar alertas, ejecutar pasos de embudos
- Soporte media: lee `paso_media_url` + `paso_media_tipo`, envía imagen/doc/video vía Meta API
- Multi-step loop: hasta 10 pasos seguidos cuando `espera_horas=0`
- Fix DB host: `$host='50.31.167.155'` (cPanel IP, no localhost)

### WhatsApp Business API
- Meta Graph API v19.0
- System User "MxOne Bot" con token permanente (nunca expira)
- Phone Number ID: 1120341324488340
- Webhook: https://mxonesolution.com/taller/api/webhook/whatsapp

### Middleware Timezone
- `app/Http/Middleware/SetTimezone.php`: timezone dinámico por tenant desde BD
- Aplica `date_default_timezone_set()` + `SET time_zone` en cada request
- Registrado en `Kernel.php` stack global, fallback en `config/database.php`

---

## 3. Inventario y Almacén

- **Fix stock almacén secundario:** controlador bloqueaba stock sin sesión `pass-stock` → cambiado a `(int) $req->stock` directo
- **Compras con destino:** selector `<select name="idAlmacen">` en crearCompra.blade.php → `store()` usa almacén específico
- **Producto creado desde menú general:** auto-insert en `almacen_producto` con primer almacén activo después de `articulo.store()`
- **Kardex duplicado de Baja:** `NOT IN (1,2)` → `NOT IN (1,2,4)` para excluir tipo 4 (bajas)
- **Botón doble-submit en bajaProductos:** `type="submit"` + `onclick="enviar()"` → cambiado a `type="button"`

---

## 4. Reportes y Finanzas

### Flujo de Caja
- Controller: `FlujoCajaController.php`
- Tablas: `banco_detalles` + `ingresoegreso` (UNION)
- Filtros: sede (individual o todas), moneda (S/ o $)
- Detalle Productos: búsqueda en tiempo real (código interno, OEM, producto, proveedor)
- Exports: Excel + PDF con estilos
- Bug resueltos: sede=null filter, IN() vacío guard, sesión en exports con `$request->session()->get()`

### Egresos Financieros
- UNION `banco_detalles` (egresos bancarios) + `ingresoegreso` (efectivo)
- 13 columnas: MES, TIPO EGRESO, SEDE, MONTO, FECHA, DESTINO, CUENTA DE SALIDA, DESCRIPCION, N° FACTURA, NOMBRE EMPRESA, COMPRADO, EGP, RUBRO
- Filtro sede solo aplica a efectivo (bancarios siempre aparecen)
- SideNav: Reportes > Financieros (IdPermiso 12)

### Semanal Asesores
- 3 tablas: CITAS, REPUESTOS, TOTAL — agrupadas por sede y semana del mes
- Bug fixes: menú duplicado removido, asesor OTROS agregado, subtotales por sede (tr-sede)
- ZAGA: LEFT JOIN articulo + CASE Puntos para corregir citas sin puntos

### Dashboard Taller
- Secciones: avance del mes, financiero por sede, desglose servicios, flota, origen ventas por canal
- Campo `ventas.tipo_ingreso`: 'Ingreso a taller' (default) o 'Ingreso flota'
- Selector en convertirCotizacion.blade.php, guardado en `CotizacionController.saveVenta()`

### Metas
- Estados válidos: Aceptado, Sin Valor Tributario, Pendiente
- Lógica por rol:
  - Asesor citas: `ventas_articulo` código SER% con Puntos>0
  - Asesor repuestos: código no SER% sin Puntos (Importe + sin_stock_venta)
  - Técnico: sin Puntos (floor(total/50) puntos)
  - Jefe: suma técnicos + control calidad (Engine Flush, Oil Additive, Filtro aire acondicionado)
- Unificación sedes: toggle `unificacion_sedes_activo` + `unificacion_codigo_grupo` vincula ZAGA CORP (362) + ZAGA AUTO CENTER (372)

---

## 5. Configuración y Personalización

### Modal Contraseña Personalizaciones
- Solo IdOperador 1 y 2 pueden acceder
- Verifica con `password_verify()` contra contraseña de login
- Modal fuera del form principal (~línea 822 de administrarLogo.blade.php)
- Funciones JS: `abrirModalClavePersonalizaciones()`, `verificarClavePersonalizaciones()`
- Ruta POST: `/configurar-empresa/verificar-clave-personalizaciones`

### Suscripciones
- Campos agregados: Abono Inicial, Emitió Factura, IGV (calculado si emitió factura)
- Flujo cuotas: Abono = enganche, cuotas = resto (Precio - Abono)
- Resumen: Abono inicial / Total cuotas / Precio lista / Diferencia

### Toggle ODS Formato Personalizado
- Columnas Marca/Modelo en listarOrdenes solo si toggle `ods_formato_personalizado` activo
- **Pendiente:** completar en todas las pestañas con `@if($datosEmpresa->ods_formato_personalizado ?? 0)`

---

## 6. Internacionalización Multi-País

- Tablas: `countries`, `country_document_types`, `country_invoice_types`, `company_fiscal_configs`
- Perú como país por defecto (id=1)
- Fases 1–4 implementadas:
  - Selector país en Administrar Empresa
  - Tipos de documento dinámicos por país
  - Impuestos dinámicos (`window.MX_TAX = { symbol, taxName, taxRate }` global en JS)
  - Validaciones de longitud: DNI=8, RUC=11, PASAPORTE=6–20, otros=sin restricción
- Controllers: `DatosController::getTipoDocumentoPorEmpresa()` + `getTaxInfoEmpresa()`
- 12 vistas Blade actualizadas: cotización, orden, compras, ventas, pedidos, notas

---

## 7. Pendientes

| Item | Estado |
|---|---|
| Modernizar vistas de `administracion/` con diseño unificado (header card, icono 44px, thead navy, opciones amber) | Pendiente |
| Marca/Modelo en listarOrdenes — todas las pestañas | Pendiente |
| Evolution API en producción — aprobación de David | Pendiente |
| Factiliza (facturación electrónica) | **Pausado** — bug facturas fantasma |

---

## 8. Archivos Clave por Módulo

| Módulo | Archivo principal |
|---|---|
| CRM Controller | `app/Http/Controllers/WhatsApp/CrmController.php` |
| WhatsApp Service | `app/Services/WhatsApp/WhatsAppService.php` |
| Leads view | `resources/views/crm/leads.blade.php` |
| Conversación view | `resources/views/crm/conversacion.blade.php` |
| Pipeline view | `resources/views/crm/pipeline.blade.php` |
| Plantillas view | `resources/views/crm/plantillas.blade.php` |
| Embudos views | `resources/views/crm/embudos/` |
| Diagnóstico views | `resources/views/crm/diagnostico_*.blade.php` |
| Administrar Empresa | `resources/views/perfil/administrarLogo.blade.php` |
| Flujo de Caja | `app/Http/Controllers/Reportes_Avanzados/FlujoCajaController.php` |
| Egresos | `app/Http/Controllers/Financieros/ReporteEgresosController.php` |
| Semanal Asesores | `app/Http/Controllers/Reportes/Financieros/ReporteSemanalAsesoresController.php` |
| Metas | `app/Http/Controllers/Administracion/Finanzas/MetasController.php` |
| Artículos/Almacén | `app/Http/Controllers/Administracion/Almacen/ArticulosController.php` |
| Compras | `app/Http/Controllers/Operaciones/ComprasController.php` |
| Cron CRM (VPS) | `/home/pwopwzzn/temporal/cron_crm.php` |
| Webhook Evolution (VPS) | `/var/www/webhook/webhook_evolution.php` |
