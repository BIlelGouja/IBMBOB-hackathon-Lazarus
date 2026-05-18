# Task: SecOps Vulnerability Audit
**Description :** This API interaction asks IBM Bob to inspect the submitted multi-language codebase for exploitable backend risks such as SQL injection, unsafe dynamic execution, weak validation, exposed secrets, and missing audit controls.

**Prompt / API Request (System & User) :** 
```json
{
  "session_report": {
    "application": "IBM Bob Lazarus Swarm",
    "task_id": "task_2_secops_audit",
    "task_name": "SecOps Vulnerability Audit",
    "generated_at": "2026-05-18",
    "purpose": "Document the security-analysis part of the IBM Bob API integration used by Lazarus.",
    "source_code_evidence": {
      "primary_api_file": "app/api/bob/route.ts",
      "real_api_call": "fetch(IBM_BOB_API_URL, ...)",
      "api_key_source": "process.env.IBM_BOB_API_KEY",
      "safe_secret_handling": "The API key is read only on the server route and is never sent to the browser.",
      "timeout_policy": "AbortController cancels the IBM Bob request after 8000 ms.",
      "fallback_policy": "If the API key is missing, if IBM Bob returns a non-OK response, if parsing fails, or if the timeout is reached, Lazarus returns a realistic fallback object with the same schema and HTTP 200.",
      "risk_score_contract": "riskScore is normalized with Math.min(10, Math.max(0, parsed.riskScore)).",
      "required_json_keys": [
        "securityAudit",
        "migrationSql",
        "oldCode",
        "backendCode",
        "rawAuditLog",
        "riskScore",
        "reviewSections"
      ]
    },
    "security_scope": [
      "Raw SQL and string-concatenated database queries",
      "Untrusted request inputs",
      "Missing schema validation",
      "Dangerous dynamic execution",
      "Credential and environment variable misuse",
      "Weak error handling",
      "Missing audit trail",
      "Unsafe controller/database coupling"
    ]
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
          "content": "Analyze this codebase, even if it is large, and produce the complete multi-agent report.\nDeclared language: <detected language such as JavaScript, TypeScript, PHP, Python, SQL, C#, Ruby, Go or Java>\nFile name: <selected vulnerable file>\nOptional PR URL: <submitted PR URL or unknown>\n\nCodebase to analyze:\n<all imported source files, including controllers, database code, scripts, SQL files and legacy modules>"
        }
      ]
    }
  },
  "ibm_bob_expected_work": {
    "agent_step": "Security Injection",
    "technical_goal": "Detect security defects, explain why they are dangerous, assign a risk score from 0 to 10, and create review sections that can be clicked in the Lazarus interface.",
    "expected_findings": [
      {
        "category": "SQL Injection",
        "example": "SELECT statements built by concatenating req.query, form input, or user-controlled variables.",
        "expected_fix": "Use parameterized queries, Prisma filters, prepared statements, or the idiomatic safe database layer for the detected language."
      },
      {
        "category": "Input Validation",
        "example": "Request body or query parameters are trusted directly.",
        "expected_fix": "Add strict validation such as Zod in TypeScript, pydantic in Python, request validators in PHP or equivalent language-native validation."
      },
      {
        "category": "Dynamic Execution",
        "example": "eval, system calls, dynamic imports or command execution with untrusted input.",
        "expected_fix": "Remove dynamic execution or replace it with allowlisted operations."
      },
      {
        "category": "Auditability",
        "example": "Security-sensitive actions are not logged or are hard to review.",
        "expected_fix": "Return rawAuditLog and verified reviewSections for traceable remediation."
      }
    ],
    "response_fields_used_by_lazarus": [
      "securityAudit",
      "riskScore",
      "rawAuditLog",
      "reviewSections[].summary",
      "reviewSections[].changed",
      "reviewSections[].verified"
    ],
    "hackathon_proof_value": "This report demonstrates how Lazarus turns an IBM Bob API response into a security dashboard with risk scoring and per-file explanations."
  }
}
```
