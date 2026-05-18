# Task: Deep Context Codebase Analysis
**Description :** This API call sends the imported Lazarus codebase to IBM Bob so it can reconstruct repository context, identify languages, and understand the intent of each file before auditing or rewriting anything.

**Prompt / API Request (System & User) :** 
```json
{
  "session_report": {
    "application": "IBM Bob Lazarus Swarm",
    "task_id": "task_1_deep_context",
    "generated_at": "2026-05-18",
    "source_code_evidence": {
      "server_route": "app/api/bob/route.ts",
      "frontend_caller": "app/page.tsx",
      "frontend_payload": {
        "codebase": "Array of imported files and folders",
        "oldCode": "Currently selected legacy file content",
        "language": "Detected or selected programming language",
        "fileName": "Currently selected file name"
      },
      "backend_functions_used": [
        "normalizeCodebase",
        "serializeCodebaseForPrompt",
        "POST"
      ]
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
          "content": "Analyze this codebase, even if it is large, and produce the complete multi-agent report.\nDeclared language: Auto\nFile name: legacy-source.txt\nOptional PR URL: unknown\n\nCodebase to analyze:\n<serialized files from serializeCodebaseForPrompt(codebase)>"
        }
      ]
    }
  },
  "ibm_bob_expected_work": {
    "agent_step": "Deep Context",
    "goal": "Read the complete submitted code database, detect active files, infer framework boundaries, and rebuild the technical intent of the repository.",
    "output_fields_used_by_lazarus": [
      "rawAuditLog",
      "reviewSections",
      "oldCode"
    ]
  }
}
```
