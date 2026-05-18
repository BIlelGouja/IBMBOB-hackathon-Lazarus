# Task: Deep Context Codebase Analysis
**Description :** This API interaction sends the complete imported Lazarus code database to IBM Bob so it can understand repository structure, languages, file intent and downstream audit context.

**Prompt / API Request (System & User) :** 
```json
{
  "session_report": {
    "application": "IBM Bob Lazarus Swarm",
    "task_id": "task_1_deep_context",
    "task_name": "Deep Context Codebase Analysis",
    "generated_at": "2026-05-18",
    "description": "Repository-level context ingestion and architecture reconstruction.",
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
    "agent_step": "Deep Context",
    "technical_goal": "Read every imported file, infer architecture, identify languages/frameworks, and prepare the audit map.",
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
- Lazarus integrated IBM Bob through code, not through a manual chat-only workflow.
- The browser never calls IBM Bob directly; it calls the internal `/api/bob` route.
- The backend route is the security boundary that owns the API key and external API call.
- The submitted codebase is serialized with file names, language labels and fenced source code.
- IBM Bob receives enough context to reason over a multi-file project instead of a single snippet.

## Traceability Matrix
| Layer | Evidence | Purpose |
| --- | --- | --- |
| Frontend | app/page.tsx | Collects imported files and sends codebase metadata to /api/bob. |
| Backend route | app/api/bob/route.ts | Builds and sends the IBM Bob API request. |
| Codebase parser | normalizeCodebase | Converts folder or file input into a consistent array. |
| Prompt builder | serializeCodebaseForPrompt | Creates FILE blocks for IBM Bob to read. |
| External call | fetch(IBM_BOB_API_URL, ...) | Direct API usage proof. |
| Timeout | AbortController + 8000 ms | Protects the demo from slow external responses. |
| Fallback | buildFallbackBobResponse | Preserves UI behavior if external API is unavailable. |
| Parser | parseIbmBobResponse | Validates JSON response fields before rendering. |

## Deep Context Flow
1. The user imports files or folders into the Lazarus workspace.
2. The UI stores each file with name, language and code content.
3. The selected file is also sent as oldCode for backward-compatible single-file analysis.
4. The backend receives prUrl, oldCode, language, fileName and codebase.
5. The codebase is normalized into CodebaseFile[] to remove invalid entries.
6. The prompt serializer emits readable per-file blocks for IBM Bob.
7. IBM Bob receives system instructions plus user workspace context.
8. The API is expected to return rawAuditLog and reviewSections for traceability.
9. The dashboard uses these fields to build the Lazarus review map.
10. The Bobalytics screenshot in bob_sessions supports usage proof alongside this report.

## Reviewer Checklist
- Check that `IBM_BOB_API_KEY` is only referenced in server code.
- Check that `page.tsx` calls `/api/bob`, not the external IBM Bob endpoint.
- Check that the JSON body contains `messages` with system and user prompts.
- Check that `response_format` requests a JSON object.
- Check that the required output keys match the Lazarus frontend contract.
- Check that the report contains no real API key, only an environment variable placeholder.

## Acceptance Criteria
- IBM Bob receives repository context with files and languages.
- The API call is reproducible from the code path documented here.
- The app remains stable if the external service times out.
- The response can be rendered without free-text scraping.
- The proof is safe to commit publicly.

