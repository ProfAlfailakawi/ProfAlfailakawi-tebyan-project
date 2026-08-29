# Tebyan Platform

## Architecture

The Tebyan platform consists of:
- **Frontend**: A React application built with Vite, Tailwind CSS, and Framer Motion.
- **Production Backend**: Firebase Cloud Functions (specifically the `api` function in `functions/index.js`) handles all `/api/**` routes in production.
- **Development Backend**: A custom `server.ts` handles the API routes during local development to replicate the Cloud Functions environment. Both use `functions/aiCore.cjs` for shared AI logic.
- **Database**: Firestore is used for storing user data, settings, and logs.
- **Hosting**: Firebase Hosting serves the frontend and proxies API requests via `firebase.json` rewrites.
- **AI Model**: Google Gemini (model `gemini-2.5-flash`).

## Dependencies Note
The repository contains both `@google/generative-ai` and `@google/genai`.
- `@google/generative-ai` is used across the frontend and backend core for generating content.
- `@google/genai` is explicitly required by several local scripts (`test-audio.ts`, `scripts/generate_all.ts`, and `scripts/provisionFileSearch.mjs`) for file-search and provisioning purposes. It cannot be removed without breaking local scripts.

## Local Setup

**Prerequisites:** Node.js (version 20 or higher)

1. **Install dependencies:**
   \`\`\`bash
   npm install
   cd functions && npm install && cd ..
   \`\`\`

2. **Environment Variables:**
   Create a `.env` file in the root and add necessary keys (do not expose `GEMINI_API_KEY` on the client-side):
   \`\`\`
   GEMINI_API_KEY=your_key_here
   \`\`\`

3. **Run Locally:**
   \`\`\`bash
   npm run dev &
   \`\`\`
   This will start both the frontend and the local API server (`server.ts`).

## Deployment

Deployment is handled via Firebase CLI.

1. Ensure you have the Firebase CLI installed and are logged in.
2. The `npm run deploy` command will build the frontend, build the server components, and deploy Hosting, Functions, and Firestore Rules.
   \`\`\`bash
   npm run deploy &
   \`\`\`

## Security

- **API Keys**: The `GEMINI_API_KEY` should never be included in the source code or client-facing files. It must be provided via environment variables in the Cloud Functions environment (using Google Secret Manager or Firebase env config).
- **App Check**: App Check is supported and recommended. Set `VITE_RECAPTCHA_SITE_KEY` on the frontend and `APP_CHECK_ENFORCE=true` on the Cloud Function.
- **Content Security Policy**: The application enforces a strict Content Security Policy defined in `firebase.json` to prevent XSS and other injection attacks.
- **Firestore Rules**: Strict Firestore rules are maintained in `firestore.rules`. System collections are restricted to `isAdmin()` verified accounts.
