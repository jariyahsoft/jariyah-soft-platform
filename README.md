# Jariyah Soft Platform

แพลตฟอร์มศูนย์กลางซอฟต์แวร์ องค์ความรู้ดิจิทัล การเรียนรู้ กิจกรรม งาน และชุมชนนักพัฒนาซอฟต์แวร์สำหรับประชาชน

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Authentication | Firebase Authentication (Email, Google, GitHub, Facebook) |
| Database | Cloud Firestore |
| File Storage | Firebase Storage |
| Backend | Firebase Cloud Functions / Cloud Run |
| Search | Typesense Cloud |
| Email | Transactional email provider (TBD) |
| Push | Firebase Cloud Messaging |
| Analytics | Google Analytics + Firestore/BigQuery |
| Hosting | Firebase Hosting or Vercel |

## Project Structure

```
.
├── ai/                  # AI context files for multi-agent collaboration
├── docs/srs/            # Software Requirement Specifications
├── prompts/             # AI prompt templates
├── src/                 # Application source code (Next.js)
│   ├── app/             # Next.js App Router pages
│   ├── components/      # Reusable UI components
│   ├── lib/             # Shared utilities, Firebase config, API clients
│   ├── hooks/           # Custom React hooks
│   └── locales/         # i18n translation files (th, en)
├── functions/           # Firebase Cloud Functions
├── firestore.rules      # Firestore Security Rules
├── storage.rules        # Firebase Storage Rules
├── firestore.indexes.json
└── firebase.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm
- Firebase CLI (`npm install -g firebase-tools`)
- Java Runtime (for Firebase Emulators)

### Setup

```bash
# Clone repository
git clone <repository-url>
cd jariyah-soft

# Install dependencies
npm install

# Setup Firebase
firebase login
firebase use --add

# Copy environment variables
cp .env.example .env.local

# Start development
npm run dev
```

### Firebase Emulators

```bash
firebase emulators:start
```

## Environments

| Environment | Purpose |
|---|---|
| Development | Local development with Firebase Emulators |
| Staging | Pre-production testing with separate Firebase project |
| Production | Live application with separate Firebase project |

> Each environment uses its own Firebase project, Typesense cluster, and secrets. Never share credentials across environments.

## Documentation

- [SRS (opus4.6.md)](docs/srs/opus4.6.md) — Full Software Requirement Specification
- [AI Context Files](ai/) — Context files for AI-assisted development
- [Prompts](prompts/) — AI prompt templates

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

