# Mi Balance

Aplicación de finanzas personales en español: movimientos, presupuesto 50/30/20 editable, deudas por acreedor y pagos con capital/interés, metas de ahorro, cuentas y compromisos pendientes.

## Desarrollo

Requiere Node.js 22.13 o posterior; no instala dependencias externas.

```sh
git clone https://github.com/FRANKEVIN25/Mi_Balance.git
cd Mi_Balance
node build.mjs
node preview.mjs
```

Abre **http://127.0.0.1:4173/**. Para detener el servidor, pulsa `Ctrl + C`. Después de modificar archivos, vuelve a compilar y reinicia el servidor. Si el puerto está ocupado, detén primero la instancia anterior.

Comandos disponibles:

- `node build.mjs`: empaqueta recursos en un Worker ESM.
- `node --test tests/finance.test.mjs`: pruebas financieras y de API con SQLite.
- `node preview.mjs`: abre un servidor local en http://127.0.0.1:4173.

La vista previa usa una identidad local fija y una base SQLite ignorada en `.sites-runtime/preview.sqlite`. Esa identidad solo existe en el servidor local y nunca se incluye en el Worker publicado.

## Datos y publicación

Sites mantiene el acceso privado. La API exige la identidad autenticada del visitante y filtra siempre por su identificador. Cloudflare D1 conserva un documento financiero por usuario con revisión optimista para evitar sobrescribir cambios concurrentes. La migración inicial está en `drizzle/0000_finances.sql`; no hay cambios de esquema durante las peticiones. Las migraciones futuras se agregan sin modificar las aplicadas.

El manifiesto `.openai/hosting.json` conserva la identidad del sitio y declara el enlace `DB`. El helper oficial de Sites sincroniza el código, empaqueta el Worker y la migración. El proyecto usa un Worker ESM sin dependencias externas; no requiere compilación de framework.

El despliegue está preparado para Sites, que proporciona la autenticación y las cabeceras de identidad confiables. Si se adapta a otro proveedor, es necesario implementar y verificar la autenticación en ese entorno. Subir el código a GitHub no publica ni actualiza automáticamente la web.

El repositorio incluye el esquema de la base de datos, no los movimientos financieros ni la base local. `.sites-runtime/`, credenciales, copias personales y archivos de compilación están excluidos por `.gitignore`.

## Estructura

- `web/`: interfaz, temas claro y oscuro, ilustración y recursos.
- `src/finance.mjs`: validación y cálculos financieros.
- `src/worker.mjs`: API autenticada y entrega de recursos.
- `drizzle/`: migración inicial de la base de datos.
- `tests/`: pruebas de cálculos y aislamiento de usuarios.
- `build.mjs` y `preview.mjs`: compilación y servidor local.
- `.github/workflows/checks.yml`: compilación y pruebas en GitHub Actions.

## Convenciones

Importes en unidades mínimas enteras (centavos). Moneda única configurable; cambiarla no convierte importes. Fechas interpretadas en America/Lima. Presupuesto sobre ingresos cobrados en el mes. Saldo inicial excluido de ingresos. Transferencias no cambian el saldo total. Ahorro reservado dentro del saldo total, separado del disponible. Préstamos recibidos excluidos de ganancias. En un pago de deuda, importe menos intereses reduce capital. Las cuotas se reservan según el vencimiento declarado: actualizar manualmente la próxima fecha. Los compromisos representan un vencimiento cada uno. No hay cálculo automático de intereses ni sincronización bancaria.

Los datos de ejemplo solo viven en memoria. Exportación y restauración JSON validada; CSV mensual protegido contra fórmulas. No se envían datos a servicios de análisis.

## Verificación

Pruebas automatizadas de contabilidad y API: ocho casos aprobados. El diseño inspirado en la referencia se revisó en Chrome local con un perfil aislado, en escritorio de 1672 px y viewport móvil de 390 px, sin desbordamiento horizontal. Se comprobaron los temas claro y oscuro, el modo de ejemplo, el acceso a ingresos filtrados y la apertura del formulario. Los datos de esta revisión son ficticios y no se escriben en la base de datos.

La ilustración de cabecera está en `web/assets/night-lake.png` y su prompt en `web/assets/night-lake.prompt.txt`. La compilación la incluye como recurso binario en el Worker. Los anillos representan el reparto del presupuesto; las barras, el uso real.
