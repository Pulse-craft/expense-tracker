# Expense Tracker

Full-stack serverless app to track and analyze personal expenses: authentication, customizable categories, multi-currency (USD/EUR), and receipt attachments in S3.

**Live app:** https://main.d1bfigmggittui.amplifyapp.com

## Features
- Expense CRUD: amount, currency, category, description, and date.
- User authentication with Amazon Cognito; each user sees only their own expenses.
- Categories: 7 defaults + custom (create / edit / delete).
- Multi-currency USD/EUR: each expense stores its currency, and totals are converted to a chosen display currency using a live exchange rate.
- Receipts: one image per expense, stored in a private S3 bucket via presigned URLs.
- Dashboard: month total, top categories, and a last-6-months chart.
- Filters by category and date range, plus CSV export.

## Architecture
```mermaid
flowchart LR
  U[User] --> FE["Frontend React + Vite<br/>(AWS Amplify)"]
  FE -->|login| COG[Cognito User Pool]
  FE -->|"JWT (Bearer)"| APIGW[API Gateway REST]
  APIGW --> LEXP[Expense Lambdas]
  APIGW --> LCAT[Categories Lambda]
  APIGW --> LREC[Receipts Lambda]
  LEXP --> DDB[(DynamoDB)]
  LCAT --> DDB
  LREC -->|generates presigned URLs| S3[(Private S3)]
  FE -.->|upload and read with signed URL| S3
```

See the design decisions in [DECISIONS.md](./DECISIONS.md).

## Stack
- **Backend:** AWS SAM, Lambda (Node.js 22, TypeScript), API Gateway (REST), DynamoDB (on-demand), Cognito, S3.
- **Frontend:** Vite, React, TypeScript, Tailwind CSS, AWS Amplify (hosting + auth).
- **Exchange rate:** Frankfurter API (ECB data), with a fallback value.

## Repository structure
```
expense-tracker/
├── backend/                  # AWS SAM
│   ├── template.yaml         # Lambdas, DynamoDB, Cognito, S3
│   ├── hello-world/          # POST   /expenses
│   ├── list-expenses/        # GET    /expenses
│   ├── get-expense/          # GET    /expenses/{id}
│   ├── update-expense/       # PUT    /expenses/{id}
│   ├── delete-expense/       # DELETE /expenses/{id}
│   ├── categories/           # CRUD   /categories
│   └── receipts/             # presigned URLs /receipts
├── frontend/                 # Vite + React + TS + Tailwind
│   └── src/
│       ├── components/       # ExpenseForm, ExpenseList, Dashboard, ...
│       ├── services/         # api, categories, receipts, rates
│       ├── utils/            # categories, currency, CSV
│       ├── types/            # shared types
│       └── amplify.ts        # Cognito configuration
└── DECISIONS.md
```

## API
All routes require `Authorization: Bearer <idToken>` from Cognito.

| Method | Path | Description |
| --- | --- | --- |
| POST | /expenses | Create expense |
| GET | /expenses | List the user's expenses |
| GET | /expenses/{id} | Get an expense |
| PUT | /expenses/{id} | Update expense |
| DELETE | /expenses/{id} | Delete expense |
| GET | /categories | List categories |
| POST | /categories | Create category |
| PUT | /categories/{categoryId} | Update category |
| DELETE | /categories/{categoryId} | Delete category |
| POST | /receipts/upload-url | Presigned upload URL |
| GET | /receipts/view-url?key=... | Presigned view URL |

## Requirements
- Node.js 22+
- AWS CLI configured
- AWS SAM CLI

## Backend — build and deploy
```
cd backend
sam build
sam deploy
```
After deploying, note the Outputs (UserPoolId, UserPoolClientId) to configure the frontend.

## Frontend — setup and run
```
cd frontend
cp .env.example .env        # then fill in the values
npm install
npm run dev                 # development
npm run build               # production
```

The API base URL is defined in the files under frontend/src/services/. Due to CORS, the frontend only receives data from the deployed Amplify domain (not from localhost).

## Environment variables (frontend)
See `.env.example`:
```
VITE_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxx
```

## Deployment
- Backend: `sam deploy` (CloudFormation).
- Frontend: AWS Amplify, auto-deploy on merge to `main`.

## Known limitations
See the final section of [DECISIONS.md](./DECISIONS.md).
