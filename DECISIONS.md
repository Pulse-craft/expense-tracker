# Technical Decisions

This document tracks significant technical choices made during the project, the alternatives considered, why the final choice was made, what was harder than expected, and what was learned.

---

## 1. AWS Region: us-east-1 (N. Virginia)

**Chosen:** us-east-1

**Alternatives considered:** eu-west-1 (Ireland), us-east-2 (Ohio)

**Reasoning:**
- us-east-1 is AWS's oldest and most complete region. New services launch here first, and documentation/tutorials default to it.
- CloudWatch Billing Alarms only live in us-east-1 regardless of where the project runs, so being in this region simplifies cost monitoring.
- Being in the same region as most AWS examples avoids "service not available in your region" issues.

**Tradeoffs:** Slightly higher latency for users in Europe/LATAM compared to eu-west-1, but acceptable for a learning project.

---

## 2. Repository Structure: Monorepo

**Chosen:** Single repository containing both `frontend/` and `backend/` folders.

**Alternatives considered:** Two separate repositories (one for frontend, one for backend).

**Reasoning:**
- Single source of truth for the project.
- Easier to coordinate changes that span both sides (e.g., adding a new API endpoint and its frontend call).
- Simpler CI/CD setup for a solo developer.
- Easier to demo and review the whole project in one place.

**Tradeoffs:** Slightly larger clone size; mixed dependency trees.

---

## 3. Local Development OS: macOS (MacBook Pro 2019, Intel)

**Context:** Mac is Intel-based with 8 GB RAM.

**Implications:**
- Use Docker Intel chip version, not Apple Silicon.
- Docker consumes significant RAM; need to close unused apps during development.
- Slightly slower builds vs Apple Silicon, but acceptable.

---
## 4. Backend Stack: AWS SAM + Lambda (nodejs22.x) + TypeScript

**Chosen:** AWS SAM with Lambda functions running nodejs22.x on x86_64, TypeScript via the hello-world-typescript starter, Zip packaging, structured JSON logging enabled, X-Ray and CloudWatch Application Insights disabled.

**Alternatives considered:** Serverless Framework, AWS CDK, plain CloudFormation, ECS/Fargate, Express on EC2.

**Reasoning:**
- SAM is AWS-native, free, and the standard tool for Lambda development.
- nodejs22.x is the latest LTS runtime and matches the frontend language (less context switching).
- TypeScript gives type safety end-to-end and matches the frontend stack.
- x86_64 architecture matches local Intel Mac (Docker emulation of arm64 would be slow during local development).
- Zip packaging is simpler than container images for a small project.
- Structured JSON logs make CloudWatch Logs Insights queries much easier later.
- X-Ray disabled for now to avoid extra costs; can be enabled if distributed tracing becomes needed.
- CloudWatch Application Insights disabled (overkill and adds cost for a personal project).

**Tradeoffs:** Cold starts on Lambda (mitigated by small bundle size with esbuild); vendor lock-in to AWS (acceptable given the learning goal); slightly higher CloudWatch costs from structured logging vs plain text.

---

## 5. Database: DynamoDB

**Chosen:** Amazon DynamoDB (NoSQL, serverless, on-demand billing).

**Alternatives considered:** RDS PostgreSQL, Aurora Serverless v2, SQLite on EFS.

**Reasoning:**
- DynamoDB is serverless and scales to zero: no idle cost when the app isn't used.
- Free tier is generous and indefinite (25 GB storage, 25 WCU/RCU), unlike RDS which has only 12 months free tier.
- Latency is consistent single-digit millisecond, ideal for Lambda.
- Native integration with Lambda via the AWS SDK; no connection pooling concerns.
- The expense-tracker access patterns are simple: list expenses by user, get/create/delete by id. No complex joins needed.
- One table design with PK = `USER#<userId>` and SK = `EXPENSE#<expenseId>` covers all current queries.

**Tradeoffs:**
- Limited ad-hoc querying compared to SQL (no arbitrary WHERE/JOIN).
- Schema design must follow access patterns upfront; redesign is harder later.
- Reports/aggregations across users would need Streams + a derived store (acceptable; not needed yet).
- Vendor lock-in to AWS (already accepted in Decision 4).

---

## 6. Authentication: Amazon Cognito

**Chosen:** Cognito User Pool with the Amplify Authenticator UI on the frontend. The frontend sends the Cognito `idToken` as `Authorization: Bearer <token>`; API Gateway validates it with a global Cognito authorizer, and each Lambda reads the user id from the token's `sub` claim.

**Alternatives considered:** Custom JWT auth issued by our own Lambda, Auth0, social login only.

**Reasoning:**
- Cognito is AWS-native and plugs directly into API Gateway as an authorizer, so there is no custom auth code to maintain.
- Reading `userId` from the verified `sub` claim means a client can never forge another user's identity.
- The Amplify Authenticator provides a working sign-up / sign-in UI with little code.

**Tradeoffs:** Cognito's API and error messages are not the friendliest; all testing needs a real authenticated user (no anonymous calls).

---

## 7. Categories as a Managed Entity

**Chosen:** The 7 default categories live as a constant in the frontend; user-created categories are stored in their own DynamoDB table reusing the same `PK`/`SK` pattern as expenses. A single `CategoriesFunction` Lambda handles the full CRUD by routing on the HTTP method.

**Alternatives considered:** (a) Free-text category on each expense; (b) storing the 7 defaults in the database per user; (c) one Lambda per operation (as the expenses use).

**Reasoning:**
- Treating categories as an entity allows custom colors and editing/deleting, while the 7 defaults are always available without seeding data.
- Reusing the expenses `PK`/`SK` schema keeps the data model consistent.
- A single routing Lambda fits the simple, homogeneous CRUD and avoids near-identical functions; expenses were left as separate functions for stability.
- The amount always belongs to the expense; a category is only a label (name + color).

**Tradeoffs:** A little routing logic inside the categories Lambda.

---

## 8. Multi-Currency (USD/EUR): Conversion in the Frontend

**Chosen:** Each expense stores its own `currency`. Totals are converted to a user-selected display currency in the frontend, using the live USD-EUR rate from the Frankfurter API (free, no key, ECB data), with a hardcoded fallback rate if the request fails.

**Alternatives considered:** Convert and store everything in a single base currency in the backend; use a paid FX API; store a rate snapshot per expense.

**Reasoning:**
- Keeping the original amount and currency preserves exactly what the user entered.
- Frontend conversion keeps the backend simple and avoids storing rates.
- Frankfurter is free and key-less; the fallback guarantees the app still works if it is down.

**Tradeoffs:** Uses a single current rate (no historical accuracy per expense date); depends on a third-party API (mitigated by the fallback).

---

## 9. Receipt Storage: Private S3 + Presigned URLs

**Chosen:** A private S3 bucket (all public access blocked). Uploads use presigned PUT URLs so the browser uploads the image directly to S3; the expense stores only the object key (`receiptKey`); viewing uses a presigned GET URL that expires in ~5 minutes. The receipts Lambda enforces that a key belongs to the requesting user (`receipts/<userId>/...`).

**Alternatives considered:** Uploading files as base64 through the Lambda; a public bucket; CloudFront with signed cookies.

**Reasoning:**
- Presigned URLs keep file bytes out of the Lambda (no payload limits, cheaper, faster).
- A private bucket with expiring links means receipts are never publicly exposed.
- The per-user key check prevents one user from reading another user's receipts.

**Tradeoffs:** Requires correct S3 CORS configuration for browser uploads; links must be regenerated when they expire.

---

## 10. CORS Restricted to the Amplify Domain

**Chosen:** Both API Gateway and the S3 bucket allow only the deployed Amplify origin.

**Reasoning:** Limits which origin can call the API or upload to the bucket from a browser, a deliberate security choice.

**Tradeoffs (known):** The frontend running on `localhost` cannot talk to the backend; all testing is done against the deployed site.

---

## 11. Frontend Stack and Hosting

**Chosen:** Vite + React + TypeScript + Tailwind CSS, hosted on AWS Amplify with auto-deploy on merge to `main`. Charts use Recharts. App state uses React local state / Context (no Redux).

**Alternatives considered:** Create React App (deprecated), Next.js, chart.js, Redux/Zustand.

**Reasoning:**
- Vite is fast and the current standard for React SPAs; CRA is deprecated.
- Tailwind speeds up styling without separate CSS files.
- Amplify gives Git-based CI/CD and hosting with minimal setup.
- Recharts is React-friendly and enough for the dashboard's needs.
- The app's state is simple enough that local state / Context avoids the overhead of Redux.

**Tradeoffs:** Larger JS bundle from the Amplify libraries (acceptable for this project).

---

## 12. Input Validation with Zod

**Chosen:** Validate all expense input on the backend with Zod. A shared `expenseSchema` is parsed with `safeParse` inside the create and update Lambda functions; invalid requests get a 400 with a clear message before anything is written to DynamoDB.

**Alternatives considered:** Joi, manual `if` checks, or validating only on the frontend.

**Reasoning:**
- The spec requires input validation with "Zod, Joi, or similar".
- Zod is TypeScript-first: the schema infers the types, so validation and the `Expense` type stay in sync without using `any`.
- `safeParse` lets the Lambda return a controlled 400 instead of throwing.
- Backend validation is the real security boundary; frontend checks alone can be bypassed.
- The schema enforces the spec's rules: positive amount, currency limited to USD/EUR, category length, a `YYYY-MM-DD` date, optional description, and an optional receipt key.

**Tradeoffs:** Adds a small dependency to each function's bundle. Custom categories are still validated with a manual name check rather than Zod (acceptable for now; noted here for honesty).

---

## Resolved / Pending Decisions

- [x] RDS PostgreSQL vs DynamoDB -> DynamoDB (Decision 5)
- [x] ORM choice -> none; AWS SDK v3 used directly against DynamoDB (no ORM needed)
- [x] Cognito Hosted UI vs custom auth UI -> Amplify Authenticator component (Decision 6)
- [x] React state management -> React local state / Context (Decision 11)
- [x] Chart library -> Recharts (Decision 11)
- [x] Deployment automation -> SAM for backend; Amplify auto-deploy on merge to main (Decision 11)
- [x] Input validation library -> Zod (Decision 12)
