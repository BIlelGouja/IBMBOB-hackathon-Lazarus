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
    },
    "recode_data_flow": {
      "input": [
        "Original vulnerable code from oldCode",
        "Full imported codebase from codebase",
        "Selected file name from fileName",
        "Detected language from language"
      ],
      "ibm_bob_processing": [
        "Reads the original code and repository context.",
        "Identifies unsafe patterns and the intended business behavior.",
        "Produces clean corrected code in backendCode.",
        "Produces per-file or per-section patches in reviewSections[].after.",
        "Explains the transformation in changed and verified fields.",
        "Keeps the downloadable corrected code free from audit prose."
      ],
      "frontend_output": [
        "Live coding replay panel",
        "Before and after diff",
        "Corrected file download",
        "Full corrected bundle download",
        "Session audit log export"
      ]
    },
    "download_evidence": [
      "The frontend uses backendCode as the main corrected output.",
      "The frontend uses reviewSections[].after as the corrected code for each clicked section.",
      "The corrected output is intended to be downloadable without explanatory comments.",
      "The API contract forces code and explanation into separate JSON fields.",
      "This separation supports clean remediation artifacts for developers."
    ],
    "code_generation_constraints": [
      "Preserve the original business purpose of the file.",
      "Keep the output in the original or most appropriate backend language.",
      "Replace insecure database access with parameterized or ORM-safe access.",
      "Validate untrusted input before it reaches the database, filesystem or dynamic execution boundary.",
      "Use typed or structured errors where appropriate.",
      "Avoid leaking implementation details to users.",
      "Avoid comments, banners and audit prose inside downloadable corrected code.",
      "Return enough code for the developer to understand and reuse the fix."
    ],
    "developer_value": [
      "The developer can import a legacy codebase instead of manually copying one small snippet.",
      "The developer can click a section to understand why that piece of code changed.",
      "The developer can watch the live replay to follow the remediation path.",
      "The developer can compare vulnerable and corrected code side by side.",
      "The developer can download corrected code without manually cleaning AI explanations from the file.",
      "The developer can keep the audit log as proof for review, demo or compliance."
    ],
    "quality_gate_before_ui_render": {
      "parser": "parseIbmBobResponse(payload)",
      "required_string_fields": [
        "securityAudit",
        "migrationSql",
        "oldCode",
        "backendCode",
        "rawAuditLog"
      ],
      "risk_score_handling": "If riskScore is a number, it is clamped between 0 and 10. Otherwise the route uses 8.4.",
      "review_section_handling": "normalizeReviewSections keeps only sections with valid id, title, fileName, summary, changed, verified, before and after strings.",
      "fallback_handling": "If IBM Bob cannot provide a parseable response, Lazarus returns a compatible fallback response so the UI remains functional."
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
    "remediation_examples_expected_by_language": [
      {
        "language": "TypeScript or JavaScript",
        "expected_pattern": "Use Zod validation, typed request parsing, Prisma or parameterized queries, and controlled NextResponse outputs."
      },
      {
        "language": "PHP",
        "expected_pattern": "Use prepared statements, strict request validation, escaped output and controlled exception handling."
      },
      {
        "language": "Python",
        "expected_pattern": "Use pydantic or explicit validation, parameterized database calls and remove eval or unsafe subprocess calls."
      },
      {
        "language": "SQL",
        "expected_pattern": "Replace unsafe dynamic SQL assumptions with safe schema changes, constraints, indexes and least-privilege access notes."
      },
      {
        "language": "C#",
        "expected_pattern": "Use parameterized commands, model validation and safe async controller boundaries."
      },
      {
        "language": "Ruby",
        "expected_pattern": "Use ActiveRecord parameterization, strong params and remove direct string interpolation in queries."
      }
    ],
    "live_replay_contract": [
      "The UI starts with the original vulnerability section selected.",
      "When the user clicks a rubrique, Lazarus reads that section's after field.",
      "The corrected code is progressively revealed in the live panel.",
      "The before field remains available for side-by-side comparison.",
      "The changed field explains what changed without polluting the corrected code.",
      "The verified field explains how IBM Bob checked the fix."
    ],
    "auditability": [
      "rawAuditLog keeps the high-level reasoning path.",
      "reviewSections stores per-file before and after evidence.",
      "riskScore gives an executive summary of severity.",
      "securityAudit gives a readable summary for reviewers.",
      "downloaded corrected files give a concrete developer artifact."
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
    "acceptance_criteria": [
      "The response must provide corrected code that can be rendered and downloaded.",
      "The response must separate code from explanation.",
      "Every clickable review section must include before and after code.",
      "The corrected code must address the vulnerability described in the corresponding section.",
      "The UI must still work if IBM Bob returns a direct JSON object or a choices[0].message.content JSON string.",
      "No API key may appear in the generated Markdown proof."
    ],
    "hackathon_proof_value": "This report proves that Lazarus uses IBM Bob not only for analysis, but also for actionable secure code generation, live remediation replay, and downloadable corrected files."
  }
}
```
