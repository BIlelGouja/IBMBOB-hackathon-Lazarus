# Task: Deep Context Codebase Analysis
**Description :** This API interaction sends the complete imported Lazarus code database to IBM Bob so it can understand the workspace structure, detect languages, reconstruct file intent, and prepare the multi-agent audit.

**Prompt / API Request (System & User) :** 
```json
{
  "session_report": {
    "application": "IBM Bob Lazarus Swarm",
    "task_id": "task_1_deep_context",
    "task_name": "Deep Context Codebase Analysis",
    "generated_at": "2026-05-18",
    "purpose": "Prove that Lazarus uses the IBM Bob API directly from the Next.js backend instead of relying on the hosted chat UI.",
    "source_code_evidence": {
      "primary_api_file": "app/api/bob/route.ts",
      "frontend_entrypoint": "app/page.tsx",
      "frontend_api_call": "fetch('/api/bob', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ codebase, oldCode, language, fileName }) })",
      "backend_api_call": "fetch(IBM_BOB_API_URL, { method: 'POST', headers, signal, body: JSON.stringify(...) })",
      "api_url_definition": "process.env.IBM_BOB_API_URL ?? 'https://api.ibmbob.ai/v1/chat/completions'",
      "model_definition": "process.env.IBM_BOB_MODEL ?? 'ibm-bob'",
      "api_key_definition": "process.env.IBM_BOB_API_KEY",
      "timeout_controller": "AbortController with an 8000 ms timeout",
      "normalization_functions": [
        "normalizeCodebase(body.codebase, fallbackFile)",
        "serializeCodebaseForPrompt(codebase)"
      ],
      "parser_functions": [
        "readAssistantContent(payload)",
        "parseIbmBobResponse(payload)"
      ]
    },
    "data_flow": [
      "The developer imports or creates files in the Lazarus workspace UI.",
      "The frontend stores these files in the codebase state.",
      "When the user launches analysis, app/page.tsx posts the selected file and the full codebase to /api/bob.",
      "app/api/bob/route.ts normalizes the incoming files into a consistent CodebaseFile[] structure.",
      "serializeCodebaseForPrompt(codebase) turns the imported repository into a prompt-safe text representation.",
      "The server route sends the serialized codebase to IBM Bob through the chat completions endpoint.",
      "IBM Bob returns a structured JSON response that Lazarus uses to build the review dashboard."
    ],
    "implementation_traceability": [
      {
        "step": "Client-side workspace construction",
        "file": "app/page.tsx",
        "evidence": "The Lazarus UI keeps imported files in the codebase state and sends them to /api/bob with oldCode, language and fileName.",
        "why_it_matters": "This proves IBM Bob receives more than a single pasted snippet. It receives a workspace-like representation of the user's code database."
      },
      {
        "step": "Server-side API boundary",
        "file": "app/api/bob/route.ts",
        "evidence": "The POST handler parses request.json(), extracts prUrl, oldCode, language, fileName and codebase, then builds the IBM Bob request.",
        "why_it_matters": "The IBM Bob key stays server-side and the browser never receives the secret."
      },
      {
        "step": "Codebase normalization",
        "file": "app/api/bob/route.ts",
        "evidence": "normalizeCodebase accepts an array of CodebaseFile objects and falls back to the selected file when the array is missing.",
        "why_it_matters": "The API flow remains stable whether the user imports a full folder or analyzes one file."
      },
      {
        "step": "Prompt serialization",
        "file": "app/api/bob/route.ts",
        "evidence": "serializeCodebaseForPrompt emits FILE blocks with file name, language and fenced source code.",
        "why_it_matters": "IBM Bob can distinguish multiple files and understand which language and path each code block belongs to."
      },
      {
        "step": "IBM Bob request dispatch",
        "file": "app/api/bob/route.ts",
        "evidence": "fetch(IBM_BOB_API_URL, ...) sends model, temperature, response_format and messages to the IBM Bob chat completions endpoint.",
        "why_it_matters": "This is the concrete API usage that replaces manual chat usage in the Bob interface."
      }
    ],
    "codebase_payload_contract": {
      "codebase_item_shape": {
        "id": "Optional stable UI id",
        "name": "File name or path displayed in Lazarus",
        "language": "Detected or user-selected programming language",
        "code": "Raw source code content sent to IBM Bob"
      },
      "fallback_behavior": "If codebase is empty, the backend creates one file from oldCode, language and fileName.",
      "serialized_prompt_format": "--- FILE 1: <file name>\\nLanguage: <language>\\n```\\n<source code>\\n```",
      "supported_language_intent": [
        "JavaScript",
        "TypeScript",
        "Python",
        "Java",
        "PHP",
        "Ruby",
        "Go",
        "C#",
        "SQL",
        "Shell",
        "Any backend language supported by the submitted codebase"
      ]
    },
    "operational_controls": [
      {
        "control": "Server-only secret access",
        "implementation": "process.env.IBM_BOB_API_KEY is read in app/api/bob/route.ts only.",
        "benefit": "The API key is never embedded in page.tsx, never shipped to the client bundle, and never appears in the session proof files."
      },
      {
        "control": "Timeout",
        "implementation": "AbortController cancels the request after 8000 ms.",
        "benefit": "The app remains responsive during hackathon demos even if the external API is slow."
      },
      {
        "control": "Schema stability",
        "implementation": "Both real IBM Bob and fallback responses use the same top-level response keys.",
        "benefit": "The frontend dashboard does not crash if the external service is unavailable."
      },
      {
        "control": "Deterministic output request",
        "implementation": "temperature is set to 0.2 and response_format requests a JSON object.",
        "benefit": "The returned data is easier to parse and display consistently."
      }
    ],
    "manual_verification_checklist": [
      "Open app/api/bob/route.ts and confirm IBM_BOB_API_URL is the external IBM Bob chat completions endpoint.",
      "Confirm the Authorization header is built from process.env.IBM_BOB_API_KEY.",
      "Confirm the frontend calls only /api/bob and never calls the IBM endpoint directly.",
      "Confirm the user message contains Declared language, File name, Optional PR URL and serialized Codebase to analyze.",
      "Confirm the response is parsed through parseIbmBobResponse before being returned to the UI."
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
          "content": "Analyze this codebase, even if it is large, and produce the complete multi-agent report.\nDeclared language: <language selected or detected by Lazarus>\nFile name: <currently selected file name>\nOptional PR URL: <submitted PR URL or unknown>\n\nCodebase to analyze:\n<serialized files generated by serializeCodebaseForPrompt(codebase)>"
        }
      ]
    }
  },
  "ibm_bob_expected_work": {
    "agent_step": "Deep Context",
    "technical_goal": "Read every imported file, infer the repository architecture, identify each language or framework, and understand which files are controllers, database layers, scripts, migrations, or security-sensitive modules.",
    "inputs_given_to_bob": [
      "Current selected file content through oldCode",
      "Detected language through language",
      "Selected file name through fileName",
      "Complete imported codebase through codebase",
      "Optional pull request URL through prUrl"
    ],
    "expected_reasoning": [
      "Identify the active backend surface.",
      "Detect legacy code patterns and framework conventions.",
      "Map files to responsibilities before rewriting.",
      "Prepare reviewSections so Lazarus can show a clickable review map.",
      "Produce rawAuditLog so the session can be exported as proof."
    ],
    "multi_agent_mapping": [
      {
        "lazarus_stage": "Deep Context",
        "bob_responsibility": "Read every file, detect language, infer repository architecture and summarize the active code paths."
      },
      {
        "lazarus_stage": "Database Layer",
        "bob_responsibility": "Identify database calls, raw SQL, ORM usage, migrations, schema assumptions and dependency boundaries."
      },
      {
        "lazarus_stage": "Security Injection",
        "bob_responsibility": "Mark unsafe inputs and prepare the findings consumed by the SecOps report."
      },
      {
        "lazarus_stage": "Core Logic Translation",
        "bob_responsibility": "Prepare a rewrite plan that keeps business intent while replacing risky patterns."
      },
      {
        "lazarus_stage": "Final Audit",
        "bob_responsibility": "Return rawAuditLog and reviewSections so the session can be inspected and downloaded."
      }
    ],
    "response_fields_used_by_lazarus": [
      "oldCode",
      "rawAuditLog",
      "reviewSections",
      "riskScore"
    ],
    "acceptance_criteria": [
      "IBM Bob receives a complete representation of the imported files, not just a single line of code.",
      "The request contains enough metadata to identify file names, languages and optional PR context.",
      "The response must be valid JSON so the dashboard can render without custom text parsing.",
      "The response must include reviewSections because Lazarus uses them to create the clickable audit map.",
      "The response must include rawAuditLog because the hackathon submission requires proof of session activity."
    ],
    "hackathon_proof_value": "This report shows the exact request shape used to give IBM Bob repository-level context from the Lazarus application."
  }
}
```
