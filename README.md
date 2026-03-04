# DOKit Super Admin Dashboard v2

Healthcare document processing and claims adjudication platform.

## Features

- **5 Workflows:**
  - Document Intake & Classification
  - Member Intake
  - Claims Adjudication
  - Provider Bill Processing
  - Workers Comp FROI/SROI

- **Multi-client support** with client switcher
- **Role-based access control** (Admin, Manager, Reviewer)
- **Audit logging**
- **AWS RDS PostgreSQL** backend

## Environment Variables

```
DATABASE_URL=postgresql://user:pass@host:5432/database
JWT_SECRET=your-secret-key
```

## Development

```bash
npm install
npm run dev
```

## Deployment

Deploy to Railway with DATABASE_URL environment variable configured.
