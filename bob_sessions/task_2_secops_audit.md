# Task: SecOps Vulnerability Audit
**Description :** This API interaction asks IBM Bob to inspect the submitted multi-language codebase for exploitable backend risks such as SQL injection, unsafe dynamic execution, weak validation, exposed secrets and missing audit controls.

**Prompt / API Request (System & User) :** 
```json
{
  "session_report": {
    "application": "IBM Bob Lazarus Swarm",
    "task_id": "task_2_secops_audit",
    "task_name": "SecOps Vulnerability Audit",
    "generated_at": "2026-05-18",
    "description": "Security analysis, vulnerability classification, risk scoring and per-section explanation.",
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
    "agent_step": "Security Injection",
    "technical_goal": "Detect security defects, explain risk, assign a 0-10 riskScore and create clickable review sections.",
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
- Lazarus uses IBM Bob for security analysis across multi-language backend code.
- The prompt explicitly asks for vulnerability detection and review sections.
- The response must include `securityAudit`, `riskScore`, `rawAuditLog` and `reviewSections`.
- Risk scoring is normalized server-side before the frontend displays it.
- Security explanations are kept separate from corrected code so downloads stay clean.

## Threat Model
| Risk | Example Signal | Expected IBM Bob Output |
| --- | --- | --- |
| SQL injection | Concatenated SQL using request input | Parameterized query or ORM-safe replacement. |
| Missing validation | Direct trust in req.body or req.query | Zod or language-equivalent validation layer. |
| Dynamic execution | eval, shell calls or dynamic code paths | Removal or allowlisted execution boundary. |
| Secret exposure | Credentials in source or client bundle | Server-only environment variable handling. |
| Weak errors | Raw exception leakage | Controlled response and audit trace. |
| Audit gap | No trace of why code changed | rawAuditLog plus verified review sections. |

## SecOps Flow
1. The frontend submits the selected file and full codebase to `/api/bob`.
2. The backend prompt asks IBM Bob to analyze JavaScript, TypeScript, Python, Java, PHP, Ruby, Go, C#, SQL, shell and backend languages.
3. IBM Bob is instructed to detect vulnerabilities before proposing corrected code.
4. The JSON contract requires findings, score, before/after snippets and verification text.
5. The backend parser rejects unusable responses and falls back to compatible mock data.
6. The frontend displays the score, audit cards, explanations and diff evidence.
7. The user can inspect each rubrique to understand the risk and the proposed mitigation.
8. The final audit log can be downloaded as proof of the analysis path.

## Risk Score Rubric
- 0-2: Low or informational issue with limited exploitability.
- 3-5: Moderate issue that should be fixed before production use.
- 6-8: High-risk backend weakness such as unsafe query construction or weak validation.
- 9-10: Critical exploit path such as direct SQL injection, command execution or severe data exposure.

## Review Section Contract
- `summary` explains what IBM Bob read in the original code.
- `changed` explains what remediation was applied.
- `verified` explains why the fix is safer and behavior-preserving.
- `before` stores vulnerable code for the diff view.
- `after` stores corrected code only for replay and download.

## Reviewer Checklist
- Confirm that no real bearer token appears in this Markdown file.
- Confirm the API request includes the exact response keys consumed by the UI.
- Confirm the SecOps output maps to dashboard fields, not just prose.
- Confirm Bobalytics screenshot exists as `bob_sessions/bobalytics_api_proof.png`.
- Confirm the fallback path does not hide the real IBM Bob integration.

