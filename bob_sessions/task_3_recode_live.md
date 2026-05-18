# Task: Recode Live Secure Modernization
**Description :** This API interaction asks IBM Bob to rewrite vulnerable legacy files into clean, secure code and returns the corrected output used by Lazarus for live replay, side-by-side diff, and downloadable patches.

**Prompt / API Request (System & User) :** 
```json
{
  "session_report": {
    "application": "IBM Bob Lazarus Swarm",
    "task_id": "task_3_recode_live",
    "task_name": "Recode Live Secure Modernization",
    "generated_at": "2026-05-18",
    "purpose": "Document the remediation and code-generation part of the IBM Bob API integration.",
    "source_code_evidence": {
      "primary_api_file": "app/api/bob/route.ts",
      "frontend_file": "app/page.tsx",
      "api_response_parser": "parseIbmBobResponse(payload)",
      "assistant_content_reader": "readAssistantContent(payload)",
      "live_replay_source": "reviewSections[].after",
      "global_corrected_code_source": "backendCode",
      "download_outputs": [
        "backendCode",
        "reviewSections[].after"
      ],
      "frontend_usage": [
        "The user clicks a review section.",
        "The live panel animates the corrected code.",
        "The diff view compares before and after.",
        "The download button exports the corrected file."
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
    "technical_goal": "Transform insecure legacy code into production-ready code using safe database access, strict validation, typed boundaries, safer error handling, and framework-appropriate conventions.",
    "strict_code_rule": "backendCode and reviewSections[].after must contain only corrected code. They must not contain explanatory prose, audit banners, or vulnerability comments.",
    "required_response_shape": {
      "securityAudit": "Human-readable security finding summary",
      "migrationSql": "Database or ORM migration guidance when relevant",
      "oldCode": "Original vulnerable code used in the diff",
      "backendCode": "Main corrected code output ready for download",
      "rawAuditLog": "Trace of the IBM Bob multi-agent reasoning steps",
      "riskScore": "Numeric security score from 0 to 10",
      "reviewSections": [
        {
          "id": "Stable section id used by the UI",
          "title": "Clickable remediation title",
          "fileName": "Affected file path",
          "summary": "What IBM Bob understood in the original code",
          "changed": "What IBM Bob changed",
          "verified": "How IBM Bob verified the correction",
          "before": "Original vulnerable snippet",
          "after": "Corrected clean code snippet"
        }
      ]
    },
    "quality_requirements": [
      "Keep the corrected code in the original programming language when possible.",
      "Use the idiomatic security pattern for that language.",
      "Preserve the original business intent.",
      "Remove unsafe SQL concatenation.",
      "Validate untrusted inputs before database or filesystem access.",
      "Return enough corrected code for the developer to download and reuse.",
      "Keep explanations outside code blocks so the downloaded file is clean."
    ],
    "response_fields_used_by_lazarus": [
      "backendCode",
      "migrationSql",
      "reviewSections[].before",
      "reviewSections[].after",
      "reviewSections[].changed",
      "reviewSections[].verified",
      "rawAuditLog"
    ],
    "hackathon_proof_value": "This report proves that Lazarus uses IBM Bob not only for analysis, but also for actionable secure code generation, live remediation replay, and downloadable corrected files."
  }
}
```
