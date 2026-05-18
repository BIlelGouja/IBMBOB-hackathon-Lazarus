# Task: Recode Live Secure Modernization
**Description :** This API interaction asks IBM Bob to rewrite vulnerable legacy files into clean, secure code and returns corrected output used by Lazarus for live replay, side-by-side diff and downloadable patches.

**Prompt / API Request (System & User) :** 
```json
{
  "session_report": {
    "application": "IBM Bob Lazarus Swarm",
    "task_id": "task_3_recode_live",
    "task_name": "Recode Live Secure Modernization",
    "generated_at": "2026-05-18",
    "description": "Secure code generation, corrected output, live replay evidence and downloadable remediation artifacts.",
    "evidence_summary": {
      "frontend": "app/page.tsx calls fetch(\"/api/bob\", ...) with codebase, oldCode, language and fileName.",
      "backend": "app/api/bob/route.ts receives the request and calls the external IBM Bob chat completions endpoint with server-side credentials.",
      "endpoint": "process.env.IBM_BOB_API_URL ?? 'https://api.ibmbob.ai/v1/chat/completions'",
      "secret": "process.env.IBM_BOB_API_KEY, never exposed to the browser or written into this report.",
      "model": "process.env.IBM_BOB_MODEL ?? 'ibm-bob'",
      "timeout": "AbortController cancels the external API call after 8000 ms.",
      "fallback": "If the key is missing, the API fails, parsing fails, or the request times out, Lazarus returns the same JSON schema with mock data and HTTP 200."
    }
  },
  "api_request": {
    "method": "POST",
    "url": "process.env.IBM_BOB_API_URL ?? https://api.ibmbob.ai/v1/chat/completions",
    "headers": {
      "Authorization": "Bearer process.env.IBM_BOB_API_KEY",
      "Content-Type": "application/json"
    },
    "timeout_ms": 8000,
    "body": {
      "model": "process.env.IBM_BOB_MODEL ?? ibm-bob",
      "temperature": 0.2,
      "response_format": {
        "type": "json_object"
      },
      "messages": [
        {
          "role": "system",
          "content": "You are IBM Bob, a senior multi-agent orchestrator specialized in auditing multi-language legacy codebases. You can analyze JavaScript, TypeScript, Python, Java, PHP, Ruby, Go, C#, SQL, shell, and any backend language. Read every provided file, detect vulnerabilities, explain each correction as a clickable review section, then propose a modernized and secure version. Return a riskScore from 0 to 10, where 10 is critical. Important: in backendCode and reviewSections[].after, return only clean code ready to download, with no explanatory comments, no banners, and no audit prose inside code. Reply only with valid JSON using these keys: securityAudit, migrationSql, oldCode, backendCode, rawAuditLog, riskScore, reviewSections. reviewSections must be an array of {id,title,fileName,summary,changed,verified,before,after}."
        },
        {
          "role": "user",
          "content": "Analyze this codebase, even if it is large, and produce the complete multi-agent report.\nDeclared language: <language>\nFile name: <fileName>\nOptional PR URL: <prUrl>\n\nCodebase to analyze:\n<serializeCodebaseForPrompt(codebase)>"
        }
      ]
    }
  },
  "ibm_bob_expected_work": {
    "agent_step": "Core Logic Translation",
    "technical_goal": "Transform insecure legacy code into production-ready code using safe database access, strict validation, typed boundaries and safer error handling.",
    "required_response_keys": [
      "securityAudit",
      "migrationSql",
      "oldCode",
      "backendCode",
      "rawAuditLog",
      "riskScore",
      "reviewSections"
    ],
    "review_section_contract": {
      "id": "Stable id used by the Lazarus UI",
      "title": "Clickable remediation title",
      "fileName": "Affected source file",
      "summary": "What IBM Bob understood in the original code",
      "changed": "What IBM Bob changed",
      "verified": "How IBM Bob verified the correction",
      "before": "Original vulnerable code",
      "after": "Corrected clean code only"
    }
  }
}
```

## What This Proves
- IBM Bob is used for actionable remediation, not only static explanation.
- The API response includes `backendCode` for the main corrected output.
- The API response includes `reviewSections[].after` for focused per-section corrected code.
- The UI can animate the correction because the code is structured in response fields.
- Downloadable corrected files are kept clean because explanations live in separate fields.

## Output Usage Map
| Response Field | Lazarus Usage | Developer Value |
| --- | --- | --- |
| backendCode | Main corrected output panel and download | Provides a complete remediation artifact. |
| reviewSections[].after | Live replay and focused patch display | Shows exactly what IBM Bob rewrote. |
| reviewSections[].before | Left side of the diff | Keeps original vulnerable evidence visible. |
| reviewSections[].changed | Explanation card | Explains the technical transformation. |
| reviewSections[].verified | Verification card | Shows how IBM Bob checked the correction. |
| rawAuditLog | Audit log export | Provides proof of the multi-agent reasoning path. |

## Recode Live Flow
1. The user selects a vulnerability rubrique in the Lazarus dashboard.
2. The frontend reads the selected `reviewSections` entry.
3. The `before` field is shown as the vulnerable source.
4. The `after` field is revealed as the corrected code in the live panel.
5. The `changed` and `verified` fields explain the fix outside the code block.
6. The download action exports corrected code without audit comments or banners.
7. The same data can power a full-bundle download for several corrected files.
8. The final user experience is a developer-friendly remediation workflow rather than a plain chatbot answer.

## Language-Specific Expectations
- TypeScript/JavaScript: use Zod validation, Prisma or parameterized queries and controlled NextResponse output.
- PHP: use prepared statements, strict request validation and controlled error handling.
- Python: use explicit validation or pydantic, parameterized database calls and remove unsafe eval/subprocess paths.
- SQL: suggest constraints, indexes and safe schema-level improvements where relevant.
- C#: use model validation, parameterized commands and safe async controller boundaries.
- Ruby: use ActiveRecord parameterization, strong params and avoid interpolated SQL.

## Corrected Code Quality Gates
- Preserve the original business intent.
- Remove direct SQL concatenation and unsafe dynamic execution.
- Validate untrusted input before database, filesystem or execution boundaries.
- Keep audit prose out of downloadable corrected code.
- Return enough corrected code for a developer to reuse the fix.
- Keep before/after evidence available for review.

## Reviewer Checklist
- Confirm `backendCode` exists in the required response shape.
- Confirm `reviewSections[].after` is defined as corrected clean code only.
- Confirm explanations are stored in `changed` and `verified`, not inside code output.
- Confirm the UI can compare `before` and `after` for a side-by-side diff.
- Confirm no real API key appears in the Markdown report.

