# Mi Balance

Aplicación de finanzas personales en español: movimientos, presupuesto 50/30/20 editable, deudas por acreedor y pagos con capital/interés, metas de ahorro, cuentas y compromisos pendientes.

## Desarrollo

Requiere Node.js 22.13 o posterior; no instala dependencias externas.

- `node build.mjs`: empaqueta recursos en un Worker ESM.
- `node --test tests/finance.test.mjs`: pruebas financieras y de API con SQLite.
- `node preview.mjs`: abre un servidor local en http://127.0.0.1:4173.

La vista previa usa una identidad local fija y una base SQLite ignorada en `.sites-runtime/preview.sqlite`. Esa identidad solo existe en el servidor local y nunca se incluye en el Worker publicado.

## Datos y publicación

Sites mantiene el acceso privado. La API exige la identidad autenticada del visitante y filtra siempre por su identificador. Cloudflare D1 conserva un documento financiero por usuario con revisión optimista para evitar sobrescribir cambios concurrentes. La migración inicial está en `drizzle/0000_finances.sql`; no hay cambios de esquema durante las peticiones. Las migraciones futuras se agregan sin modificar las aplicadas.

El manifiesto `.openai/hosting.json` conserva la identidad del sitio y declara el enlace `DB`. El helper oficial de Sites sincroniza el código, empaqueta el Worker y la migración. Este proyecto se adaptó al Worker sin dependencias tras agotarse el espacio al instalar el starter; no requiere compilación de framework.

## Convenciones

Importes en unidades mínimas enteras (centavos). Moneda única configurable; cambiarla no convierte importes. Fechas interpretadas en America/Lima. Presupuesto sobre ingresos cobrados en el mes. Saldo inicial excluido de ingresos. Transferencias no cambian el saldo total. Ahorro reservado dentro del saldo total, separado del disponible. Préstamos recibidos excluidos de ganancias. En un pago de deuda, importe menos intereses reduce capital. Las cuotas se reservan según el vencimiento declarado: actualizar manualmente la próxima fecha. Los compromisos representan un vencimiento cada uno. No hay cálculo automático de intereses ni sincronización bancaria.

Los datos de ejemplo solo viven en memoria. Exportación y restauración JSON validada; CSV mensual protegido contra fórmulas. No se envían datos a servicios de análisis.

## Verificación

Pruebas automatizadas de contabilidad y API; ocho casos. La herramienta de navegador no pudo inicializarse en el entorno, por lo que la revisión visual con navegador no se completó.