# DECISIONS.md — Registro de decisiones de arquitectura

Cada decisión incluye contexto, la decisión tomada, alternativas consideradas y consecuencias.

## 1. Arquitectura serverless (AWS SAM)
**Contexto:** App de seguimiento de gastos multiusuario, con tráfico bajo e irregular.
**Decisión:** Backend 100% serverless con AWS SAM: Lambda (Node.js 22, TypeScript), API Gateway (REST), DynamoDB y Cognito. Región `us-east-1`, stack `expense-tracker`.
**Alternativas:** Servidor tradicional (Express en EC2/contenedor) con base relacional.
**Consecuencias:** Sin servidores que administrar, costo casi cero en reposo (se paga por uso) y escalado automático. A cambio, *cold starts* ocasionales y un modelo de datos menos flexible que SQL.

## 2. Modelo de datos en DynamoDB (PK/SK)
**Contexto:** Hay que aislar los datos por usuario y consultarlos rápido.
**Decisión:** Tablas con clave compuesta `PK` (HASH) + `SK` (RANGE). Los gastos usan `PK = USER#{userId}`, `SK = EXPENSE#{id}`; las categorías personalizadas reutilizan el mismo patrón con `SK = CATEGORY#{id}` en su propia tabla. Capacidad **PAY_PER_REQUEST** (on-demand).
**Alternativas:** Single-table design puro o base relacional.
**Consecuencias:** Consultas por usuario eficientes (query por PK). On-demand evita aprovisionar capacidad. El patrón se reutiliza entre entidades, lo que simplificó agregar categorías.

## 3. Autenticación con Cognito
**Decisión:** Cognito User Pool; el frontend obtiene el `idToken` (JWT) vía Amplify y lo envía como `Authorization: Bearer <token>`. API Gateway valida con un authorizer Cognito **global** (todas las rutas protegidas por defecto). El `userId` se toma del claim `sub` del token, nunca del cliente.
**Consecuencias:** Identidad confiable en el backend; ningún usuario puede falsear su `userId`. Las pruebas requieren un usuario autenticado.

## 4. Categorías como entidad (no texto libre)
**Contexto:** Se necesitaban 7 categorías por defecto del enunciado + categorías propias del usuario.
**Decisión:** Las 7 por defecto viven como **constante en el frontend** (no en BD). Las personalizadas se guardan en una tabla DynamoDB dedicada. El backend acepta la categoría como string normalizado (minúsculas, máx. 30 caracteres).
**Alternativas:** (a) Texto libre sin entidad; (b) guardar también las 7 por defecto en BD.
**Consecuencias:** Las 7 base existen siempre sin sembrar datos por usuario; las propias son editables y borrables. Menos escrituras y datos duplicados.

## 5. Una sola Lambda para categorías (routing por método)
**Decisión:** `CategoriesFunction` maneja GET/POST/PUT/DELETE enrutando por `httpMethod`, a diferencia de los gastos, que usan **una Lambda por operación**.
**Razón:** El CRUD de categorías es simple y homogéneo; una sola función reduce repetición. Los gastos se mantuvieron como funciones separadas por estabilidad.
**Consecuencias:** Menos recursos que mantener para categorías; algo más de lógica de routing dentro de la función.

## 6. El monto vive en el gasto, no en la categoría
**Decisión:** La categoría es solo una **etiqueta** (nombre + color). El importe siempre pertenece al gasto.
**Consecuencias:** Un gasto puede recategorizarse sin tocar montos; los totales se calculan agregando gastos por categoría.

## 7. Multi-moneda (USD/EUR) con conversión en el frontend
**Contexto:** Los gastos pueden estar en distintas monedas, pero los totales deben verse en una sola.
**Decisión:** Cada gasto guarda su `currency`. La conversión de totales se hace **en el frontend** con el tipo de cambio en vivo de la **API Frankfurter** (gratis, sin API key, datos del BCE), con un **valor de respaldo** si la API falla. Un toggle permite ver los totales en USD o EUR.
**Alternativas:** Convertir y almacenar todo en una moneda base; usar una API de pago.
**Consecuencias:** Se conserva el dato original tal como lo ingresó el usuario; la tasa se obtiene en tiempo real sin costo. Si la API no responde, se usa el respaldo (tasa aproximada).

## 8. Recibos en S3 con URLs prefirmadas
**Contexto:** Adjuntar imágenes de recibos sin exponer el almacenamiento ni pasar archivos pesados por la Lambda.
**Decisión:** Bucket S3 **privado** (acceso público bloqueado). Flujo con **URLs prefirmadas**: (1) el frontend pide a `ReceiptsFunction` una URL de subida (PUT) firmada, (2) el navegador sube la imagen **directo a S3**, (3) en el gasto se guarda solo la llave (`receiptKey`), (4) para ver el recibo se pide una URL de lectura (GET) firmada que caduca a los ~5 min. La función valida que la llave empiece con `receipts/{userId}/`, así un usuario solo accede a sus propios recibos. El CORS del bucket está limitado al dominio de la app.
**Alternativas:** Subir el archivo en base64 a través de la Lambda (límite de payload, ineficiente); bucket público (inseguro).
**Consecuencias:** Las Lambdas no manejan bytes de archivos; el bucket nunca queda expuesto; los enlaces caducan. Requiere configurar bien el CORS de S3.

## 9. CORS restringido al dominio de Amplify
**Decisión:** API Gateway y el bucket S3 permiten solo el origen del sitio desplegado en Amplify.
**Consecuencias (conocidas):** El frontend en `localhost` **no** puede hablar con el backend; todas las pruebas se hacen contra el sitio desplegado. Es una decisión de seguridad consciente.

## 10. Despliegue
**Decisión:** Backend con `sam build` + `sam deploy` (changesets de CloudFormation). Frontend en AWS Amplify con **auto-deploy al hacer merge a `main`**. Flujo: rama por feature → PR → merge.
**Nota de proceso:** Se usa `sam build` como validación confiable; `sam validate` da falsos positivos por el manejo de Cognito en cfn-lint.

## Comportamientos conocidos / limitaciones
- Al **editar** un gasto, el campo `createdAt` se regenera (no se preserva el original). Aceptable para el alcance del proyecto.
- No hay paginación en el listado de gastos (se esperan volúmenes pequeños).
- La conversión de moneda usa una sola tasa USD↔EUR del día; no guarda histórico de tasas.
