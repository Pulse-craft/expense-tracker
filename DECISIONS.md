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

## Pending Decisions

These will be documented as the project progresses:

- [ ] RDS PostgreSQL vs DynamoDB
- [ ] ORM choice: Prisma vs Drizzle vs plain pg
- [ ] Cognito Hosted UI vs custom auth UI
- [ ] React state management (Context vs Zustand vs Redux)
- [ ] Chart library (recharts vs chart.js)
- [ ] Deployment automation strategy
