# Medical Decision Support System

A comprehensive AI-powered medical decision support platform for toxicology assessment and dosage adjustment. This system helps doctors and toxicologists analyze patient cases, detect drug interactions, and receive evidence-based clinical recommendations.

## Features

### Core Functionality
- **Authentication & User Management**: Secure login/registration with role-based access
- **Patient Management**: Create and manage patient records with medical history, allergies, and comorbidities
- **Case Management**: Create clinical and emergency cases with vital signs tracking
- **Decision Engine**: Rule-based risk assessment with:
  - Drug-drug interaction detection
  - Allergy cross-checking
  - Medication warning alerts
  - Comorbidity-drug interaction analysis
  - Vital signs abnormality detection
- **Risk Scoring**: Automated risk calculation (0-100 scale) with severity levels
- **Clinical Recommendations**: Evidence-based recommendations based on case analysis

### Dashboard
- Overview of patients and cases
- Quick case creation and patient management
- Risk assessment display with color-coded severity indicators

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Neon PostgreSQL
- **Authentication**: NextAuth.js (Auth.js v4) with Credentials Provider
- **Password Security**: bcryptjs for secure password hashing

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- Neon PostgreSQL database account
- Environment variables configured

### Installation

1. **Clone and install dependencies**
```bash
pnpm install
```

2. **Set up environment variables**
Create a `.env.local` file:
```env
DATABASE_URL=postgresql://user:password@host/dbname
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

3. **Start development server**
```bash
pnpm dev
```

4. **Seed test data** (Optional)
```bash
curl -X POST http://localhost:3000/api/admin/seed
```

5. **Seed default local users** (Optional)
```bash
pnpm run seed:users
```

Default local credentials after seeding:
- Admin: `admin@hexa.local` / `Admin@123456`
- Medecin: `medecin@hexa.local` / `Medecin@123456`

Visit `http://localhost:3000` and sign up or login.

## Project Structure

```
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── patients/          # Patient management
│   │   ├── cases/             # Case management
│   │   ├── medications/       # Medication data
│   │   └── admin/             # Admin endpoints
│   ├── auth/                  # Auth pages (login/register)
│   ├── dashboard/             # Main dashboard
│   │   ├── patients/          # Patient pages
│   │   └── cases/             # Case pages
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Home redirect
├── components/
│   ├── patient-form.tsx       # Patient form component
│   ├── case-form.tsx          # Case creation form
│   ├── case-analysis-button.tsx
│   ├── risk-assessment-display.tsx
│   └── dashboard-nav.tsx      # Navigation
├── lib/
│   ├── auth.ts                # NextAuth configuration
│   ├── db.ts                  # Database functions
│   └── decision-engine.ts     # Risk analysis logic
└── scripts/
    └── seed-medications.ts    # Database seeding script
```

## Database Schema

### Core Tables
- **users**: Doctor/toxicologist accounts
- **patients**: Patient records
- **cases**: Clinical cases (emergency or clinical)
- **case_medications**: Medications in a specific case
- **medications**: Reference medication database
- **interactions**: Drug-drug interaction rules
- **risk_assessments**: Stored risk analysis results

## Usage

### Creating a Patient
1. Navigate to Dashboard → Patients
2. Click "Add New Patient"
3. Fill in patient demographics, medical history, and allergies
4. Save patient record

### Creating a Case
1. Navigate to Dashboard → Cases
2. Click "Create New Case"
3. Select patient and case type (clinical/emergency)
4. Enter chief complaint, symptoms, and vital signs
5. Add medications with dosage information
6. Submit case

### Running Risk Analysis
1. Open a case
2. Click "Run Analysis"
3. System analyzes for:
   - Drug-drug interactions
   - Allergy conflicts
   - Medication warnings
   - Comorbidity risks
   - Abnormal vital signs
4. View detailed risk assessment with recommendations

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Patients
- `GET /api/patients/list` - List user's patients
- `POST /api/patients` - Create patient
- `GET /api/patients/[id]` - Get patient details
- `PUT /api/patients/[id]` - Update patient

### Cases
- `POST /api/cases` - Create case
- `GET /api/cases/[id]` - Get case details
- `POST /api/cases/[id]/analyze` - Run risk analysis
- `GET /api/cases/[id]/analyze` - Get risk assessment

### Data
- `GET /api/medications` - List all medications

### Admin
- `POST /api/admin/seed` - Seed database with test data

## Decision Engine

The decision engine performs comprehensive risk analysis:

### Risk Scoring (0-100)
- **Critical**: 80+ (immediate intervention needed)
- **High**: 50-79 (significant concerns)
- **Moderate**: 20-49 (monitor carefully)
- **Low**: 0-19 (minimal concerns)

### Analysis Components
1. **Allergy Check**: Cross-references medications with known allergies (Critical severity)
2. **Drug Interactions**: Detects harmful drug combinations
3. **Medication Warnings**: Reviews built-in medication warnings
4. **Comorbidity Analysis**: Checks drug-disease interactions
5. **Vital Signs**: Detects abnormal vital sign patterns in emergency cases

## Sample Medications & Interactions

The system includes pre-configured medications with common interactions:
- Warfarin + NSAIDs (bleeding risk)
- Metformin + Gentamicin (lactic acidosis risk)
- ACE Inhibitors + NSAIDs (renal dysfunction risk)
- And more...

## Authentication Details

- **Strategy**: JWT-based sessions
- **Session Duration**: 30 days
- **Provider**: Credentials-based (email/password)
- **Password Hashing**: bcryptjs (10 salt rounds)
- **Security**: Passwords validated on every login

## Future Enhancements

- AI-powered interaction discovery
- Plant-drug interaction detection
- OCR for medication image recognition
- Advanced pharmacogenomic analysis
- Real-time alerts for emergency cases
- Multi-user case collaboration
- Detailed audit logs
- Integration with EHR systems

## Testing

### Create Test Account
1. Register with email/password
2. Create test patient
3. Create test case
4. Run analysis

### Test Interactions
Create cases with known dangerous combinations:
- Warfarin + Aspirin
- Metformin + Gentamicin
- Multiple NSAIDs

## Performance Considerations

- Database indexes on user_id, patient_id, case_id
- Medication list caching in client
- Optimized case queries with joins
- Risk assessment stored for quick retrieval

## Security

- SQL parameterized queries (SQL injection prevention)
- Password hashing with bcryptjs
- NextAuth session management
- User-scoped data access (all queries filtered by user_id)
- Environment variables for sensitive data

## Support & Documentation

For detailed specification of the medical decision support system, see the original spec document.

## License

Private - Medical Decision Support System
