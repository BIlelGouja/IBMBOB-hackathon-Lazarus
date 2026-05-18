# Task: Recode Live Secure Modernization
**Description :** This API call asks IBM Bob to produce clean corrected code for each reviewed file, then Lazarus displays the rewrite progressively in the live coding panel and enables corrected file downloads.

**Prompt / API Request (System & User) :** 
```json
{
  "session_report": {
    "application": "IBM Bob Lazarus Swarm",
    "task_id": "task_3_recode_live",
    "generated_at": "2026-05-18",
    "source_code_evidence": {
      "server_route": "app/api/bob/route.ts",
      "frontend_caller": "app/page.tsx",
      "api_response_parser": "parseIbmBobResponse",
      "assistant_content_reader": "readAssistantContent",
      "downloaded_outputs": [
        "backendCode",
        "reviewSections[].after"
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
          "content": "Analyze this codebase, even if it is large, and produce the complete multi-agent report.\nDeclared language: <detected language>\nFile name: <selected legacy file>\nOptional PR URL: <submitted PR URL or unknown>\n\nCodebase to analyze:\n<serialized code database from the Lazarus workspace>"
        }
      ]
    }
  },
  "ibm_bob_expected_work": {
    "agent_step": "Core Logic Translation",
    "goal": "Rewrite vulnerable legacy code into production-ready code using safer patterns for the detected language and framework.",
    "strict_code_rule": "backendCode and reviewSections[].after must contain only clean corrected code, with no explanatory comments, no banners, and no audit prose.",
    "required_response_shape": {
      "securityAudit": "string",
      "migrationSql": "string",
      "oldCode": "string",
      "backendCode": "string",
      "rawAuditLog": "string",
      "riskScore": "number from 0 to 10",
      "reviewSections": [
        {
          "id": "string",
          "title": "string",
          "fileName": "string",
          "summary": "string",
          "changed": "string",
          "verified": "string",
          "before": "string",
          "after": "string"
        }
      ]
    },
    "lazarus_ui_usage": [
      "The live coding panel animates the corrected code from reviewSections[].after.",
      "The side-by-side diff compares reviewSections[].before and reviewSections[].after.",
      "The download button exports corrected files generated from IBM Bob output."
    ]
  }
}
```
