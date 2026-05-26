# Expense Tracker

Personal expense tracker built with AWS serverless architecture.

## Status

🚧 Work in progress

**Backend MVP deployed**: `POST /expenses` is live and persisting to DynamoDB.

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + TypeScript on AWS Lambda
- **Database**: AWS DynamoDB (single-table design)
- **Authentication**: AWS Cognito (planned)
- **File Storage**: AWS S3 (planned)
- **Infrastructure**: AWS SAM
- **Hosting**: AWS Amplify (planned)

## Project Structure

expense-tracker/
├── frontend/       # React + TypeScript + Vite
├── backend/        # AWS Lambda + SAM
├── DECISIONS.md    # Architecture decisions log
└── README.md

## API Endpoints

- POST /expenses → Create an expense ✅ Live
- GET /expenses → List expenses 🚧 Planned

## Deploy

cd backend
sam deploy

## License

Private project.
