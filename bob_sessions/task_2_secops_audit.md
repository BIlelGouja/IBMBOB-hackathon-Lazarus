# Task: SecOps Vulnerability Audit
**Description :** This API call asks IBM Bob to inspect the imported codebase for unsafe patterns such as SQL injection, dynamic execution, weak validation, leaked secrets, and missing request hardening.

**Prompt / API Request (System & User) :** 
```json
{
  "session_report": {
    "application": "IBM Bob Lazarus Swarm",
    "task_id": "task_2_secops_audit",
    "generated_at": "2026-05-18",
    "source_code_evidence": {
      "server_route": "app/api/bob/route.ts",
      "real_api_call": "fetch(IBM_BOB_API_URL, ...)",
      "api_key_source": "process.env.IBM_BOB_API_KEY",
      "fallback_policy": "If the key is missing, the API fails, JSON parsing fails, or the response takes more than 8 seconds, Lazarus returns the same JSON schema with realistic mock data.",
      "risk_score_contract": "riskScore is clamped between 0 and 10 before being sent back to the frontend."
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
          "content": "Analyze this codebase, even if it is large, and produce the complete multi-agent report.\nDeclared language: <detected language>\nFile name: <selected file>\nOptional PR URL: <submitted PR URL or unknown>\n\nCodebase to analyze:\n<all imported source files, including legacy SQL, backend controllers, scripts, and services>"
        }
      ]
    }
  },
  "ibm_bob_expected_work": {
    "agent_step": "Security Injection",
    "goal": "Mark every untrusted input path, raw query, dynamic execution point, missing schema validation, and unsafe credential pattern.",
    "required_response_keys": [
      "securityAudit",
      "riskScore",
      "reviewSections",
      "rawAuditLog"
    ],
    "example_findings_lazarus_displays": [
      "Raw SQL built with string concatenation",
      "Missing Zod or equivalent input validation",
      "Dynamic execution through eval-like behavior",
      "Database access too close to request handlers",
      "Missing controlled error handling and audit trace"
    ]
  }
}
```
