# IBM Bob Hackathon - Lazarus

Lazarus is a Next.js 14 interface for auditing a codebase through an IBM Bob-inspired multi-agent workflow. The app lets developers import files or full folders, launch a security analysis, follow the remediation path, inspect the generated fixes, and download corrected files.

## Vision

Lazarus turns legacy code review into a clear developer experience:

- import a multi-language codebase;
- understand where the risks are;
- watch IBM Bob analyze, rewrite, and verify the code;
- get a vulnerability score from `0` to `10`;
- compare old code against corrected code;
- download fixes and the audit session proof.

The goal is to give backend teams a readable audit copilot for hackathons, Pull Request reviews, legacy migrations, and fast security hardening.

## What IBM Bob Does In This App

IBM Bob is represented as a multi-agent orchestrator. Each step has a clear responsibility:

1. **Deep Context**  
   Bob reads the imported files, rebuilds the codebase structure, and detects the intent behind the code.

2. **Database Layer**  
   Bob tracks database access, SQL queries, ORM models, data flows, and sensitive dependencies.

3. **Security Injection**  
   Bob detects untrusted inputs, SQL injection risks, exposed secrets, missing validation, and dangerous calls such as `eval`, `exec`, or concatenated raw SQL.

4. **Core Logic Translation**  
   Bob proposes corrected code using strict validation, parameterized queries, cleaner responsibility boundaries, stronger typing, controlled errors, and audit logging.

5. **Tests & Verify**  
   Bob simulates verification by checking that dangerous payloads are blocked, expected behavior is preserved, and the output contract remains stable.

6. **Final Audit**  
   Bob produces the final audit, risk score, reviewable diff, and downloadable session log.

## Features

- Import individual source files.
- Import complete folders.
- Multi-language support: JavaScript, TypeScript, Python, PHP, Ruby, Go, C#, Java, SQL, and other text-based code files.
- Full codebase analysis.
- Live workflow animation.
- Clickable review sections for each correction.
- Before/after code comparison.
- Popups for large content.
- Download one corrected file.
- Download all corrected files.
- Download the audit log as `lazarus-audit.txt`.
- Local fallback mode when the IBM Bob API is unavailable.

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- App Router
- Route Handler API: `app/api/bob/route.ts`
- CSS-in-JS UI inside `app/page.tsx`
- Icons with `lucide-react`

## Local Setup

```bash
npm install
npm run dev
```

Then open:

```text
http://127.0.0.1:3000
```

## Environment Variables

Create a `.env.local` file at the project root:

```env
IBM_BOB_API_KEY=your_api_key_here
IBM_BOB_API_URL=https://api.ibmbob.ai/v1/chat/completions
IBM_BOB_MODEL=ibm-bob
```

`IBM_BOB_API_KEY` must never be committed to GitHub. The `.env.local` file is ignored by Git.

## Fallback Mode

If the API key is missing, if the API returns an error, or if the response takes more than 8 seconds, the app automatically switches to fallback mode.

The fallback always returns a frontend-compatible response:

- `securityAudit`
- `migrationSql`
- `oldCode`
- `backendCode`
- `rawAuditLog`
- `riskScore`
- `reviewSections`

This keeps the demo stable even without API access.

## Project Structure

```text
app/
  api/
    bob/
      route.ts      # Next.js API route, IBM Bob call + fallback
  globals.css       # global styles
  layout.tsx        # root layout
  page.tsx          # client interface
package.json
tsconfig.json
```

## How To Use The App

1. Start the application.
2. Import one or more files, or a complete folder.
3. Click **Analyze**.
4. Follow the IBM Bob path live.
5. Open review sections to see:
   - what Bob read;
   - what changed;
   - how Bob verified the fix;
   - the old code;
   - the corrected code.
6. Download the fixes or the audit log.

## Why Developers Would Use It

This app helps speed up:

- legacy code audits;
- Pull Request reviews;
- backend vulnerability discovery;
- migration from raw SQL to safer data access patterns;
- onboarding into an unknown codebase;
- producing a clear technical report for a team.

It does not replace final human review, but it provides a structured, actionable first pass that is easy to understand and easy to present.

## Free Deployment On Vercel

1. Push the project to GitHub.
2. Go to [Vercel](https://vercel.com).
3. Import the GitHub repository.
4. Add the environment variables:

```env
IBM_BOB_API_KEY=your_api_key_here
IBM_BOB_API_URL=https://api.ibmbob.ai/v1/chat/completions
IBM_BOB_MODEL=ibm-bob
```

5. Click **Deploy**.

## License

Hackathon project. Adapt the license depending on how you plan to publish or reuse it.
