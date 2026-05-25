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


## Pending Decisions

These will be documented as the project progresses:

- [ ] RDS PostgreSQL vs DynamoDB
- [ ] ORM choice: Prisma vs Drizzle vs plain pg
- [ ] Cognito Hosted UI vs custom auth UI
- [ ] React state management (Context vs Zustand vs Redux)
- [ ] Chart library (recharts vs chart.js)
- [ ] Deployment automation strategy
