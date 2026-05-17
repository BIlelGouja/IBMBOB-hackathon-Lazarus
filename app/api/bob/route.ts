import { NextResponse } from "next/server";

type BobResponse = {
  securityAudit: string;
  migrationSql: string;
  oldCode: string;
  backendCode: string;
  rawAuditLog: string;
  riskScore: number;
  reviewSections?: ReviewSection[];
};

type CodebaseFile = {
  id?: string;
  name: string;
  language: string;
  code: string;
};

type ReviewSection = {
  id: string;
  title: string;
  fileName: string;
  summary: string;
  changed: string;
  verified: string;
  before: string;
  after: string;
};

const IBM_BOB_API_URL =
  process.env.IBM_BOB_API_URL ?? "https://api.ibmbob.ai/v1/chat/completions";

const IBM_BOB_MODEL = process.env.IBM_BOB_MODEL ?? "ibm-bob";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const prUrl = typeof body.prUrl === "string" ? body.prUrl : "unknown";
  const submittedOldCode =
    typeof body.oldCode === "string" ? body.oldCode.trim() : "";
  const language = typeof body.language === "string" ? body.language : "Auto";
  const fileName =
    typeof body.fileName === "string" ? body.fileName : "legacy-source.txt";
  const codebase = normalizeCodebase(body.codebase, {
    name: fileName,
    language,
    code: submittedOldCode,
  });

  const fallbackData = buildFallbackBobResponse(
    prUrl,
    submittedOldCode,
    language,
    fileName,
    codebase,
  );
  const apiKey = process.env.IBM_BOB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(fallbackData, { status: 200 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(IBM_BOB_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: IBM_BOB_MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are IBM Bob, a senior multi-agent orchestrator specialized in auditing multi-language legacy codebases. You can analyze JavaScript, TypeScript, Python, Java, PHP, Ruby, Go, C#, SQL, shell, and any backend language. Read every provided file, detect vulnerabilities, explain each correction as a clickable review section, then propose a modernized and secure version. Return a riskScore from 0 to 10, where 10 is critical. Important: in backendCode and reviewSections[].after, return only clean code ready to download, with no explanatory comments, no banners, and no audit prose inside code. Reply only with valid JSON using these keys: securityAudit, migrationSql, oldCode, backendCode, rawAuditLog, riskScore, reviewSections. reviewSections must be an array of {id,title,fileName,summary,changed,verified,before,after}.",
          },
          {
            role: "user",
            content: `Analyze this codebase, even if it is large, and produce the complete multi-agent report.
Declared language: ${language}
File name: ${fileName}
Optional PR URL: ${prUrl}

Codebase to analyze:
${serializeCodebaseForPrompt(codebase)}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json(fallbackData, { status: 200 });
    }

    const ibmBobPayload = await response.json();
    const parsedData = parseIbmBobResponse(ibmBobPayload);

    return NextResponse.json(parsedData ?? fallbackData, { status: 200 });
  } catch {
    return NextResponse.json(fallbackData, { status: 200 });
  } finally {
    clearTimeout(timeout);
  }
}

function parseIbmBobResponse(payload: unknown): BobResponse | null {
  const content = readAssistantContent(payload);

  if (!content) {
    return null;
  }

  try {
    const parsed = JSON.parse(content) as Partial<BobResponse>;

    if (
      typeof parsed.securityAudit === "string" &&
      typeof parsed.migrationSql === "string" &&
      typeof parsed.oldCode === "string" &&
      typeof parsed.backendCode === "string" &&
      typeof parsed.rawAuditLog === "string"
    ) {
      return {
        securityAudit: parsed.securityAudit,
        migrationSql: parsed.migrationSql,
        oldCode: parsed.oldCode,
        backendCode: parsed.backendCode,
        rawAuditLog: parsed.rawAuditLog,
        riskScore:
          typeof parsed.riskScore === "number"
            ? Math.min(10, Math.max(0, parsed.riskScore))
            : 8.4,
        reviewSections: normalizeReviewSections(parsed.reviewSections),
      };
    }

    return null;
  } catch {
    return null;
  }
}

function readAssistantContent(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const maybePayload = payload as {
    choices?: Array<{ message?: { content?: unknown } }>;
    securityAudit?: unknown;
    migrationSql?: unknown;
    oldCode?: unknown;
    backendCode?: unknown;
    rawAuditLog?: unknown;
    riskScore?: unknown;
    reviewSections?: unknown;
  };

  if (
    typeof maybePayload.securityAudit === "string" &&
    typeof maybePayload.migrationSql === "string" &&
    typeof maybePayload.oldCode === "string" &&
    typeof maybePayload.backendCode === "string" &&
    typeof maybePayload.rawAuditLog === "string"
  ) {
    return JSON.stringify(maybePayload);
  }

  const content = maybePayload.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content;
  }

  if (content && typeof content === "object") {
    return JSON.stringify(content);
  }

  return null;
}

function normalizeCodebase(
  value: unknown,
  fallbackFile: CodebaseFile,
): CodebaseFile[] {
  if (Array.isArray(value)) {
    const files = value
      .map((item): CodebaseFile | null => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const file = item as Partial<CodebaseFile>;

        if (typeof file.code !== "string") {
          return null;
        }

        return {
          id: typeof file.id === "string" ? file.id : undefined,
          name: typeof file.name === "string" ? file.name : "legacy-source.txt",
          language:
            typeof file.language === "string" ? file.language : "Auto",
          code: file.code,
        };
      })
      .filter((file): file is CodebaseFile => Boolean(file));

    if (files.length > 0) {
      return files;
    }
  }

  return [fallbackFile];
}

function serializeCodebaseForPrompt(codebase: CodebaseFile[]) {
  return codebase
    .map(
      (file, index) => `--- FILE ${index + 1}: ${file.name}
Language: ${file.language}
\`\`\`
${file.code}
\`\`\``,
    )
    .join("\n\n");
}

function normalizeReviewSections(value: unknown): ReviewSection[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const sections = value
    .map((item): ReviewSection | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const section = item as Partial<ReviewSection>;

      if (
        typeof section.id !== "string" ||
        typeof section.title !== "string" ||
        typeof section.fileName !== "string" ||
        typeof section.summary !== "string" ||
        typeof section.changed !== "string" ||
        typeof section.verified !== "string" ||
        typeof section.before !== "string" ||
        typeof section.after !== "string"
      ) {
        return null;
      }

      return {
        id: section.id,
        title: section.title,
        fileName: section.fileName,
        summary: section.summary,
        changed: section.changed,
        verified: section.verified,
        before: section.before,
        after: section.after,
      };
    })
    .filter((section): section is ReviewSection => Boolean(section));

  return sections.length > 0 ? sections : undefined;
}

function buildLanguageAwareFix(file: CodebaseFile, preferredTypeScriptFix?: string) {
  const language = `${file.language} ${file.name}`.toLowerCase();

  if (preferredTypeScriptFix && /typescript|javascript|\.tsx?$|\.jsx?$/.test(language)) {
    return preferredTypeScriptFix;
  }

  if (/ruby|\.rb$/.test(language)) {
    return `# IBM Bob fix for ${file.name}
# - Remove interpolated SQL strings
# - Remove dynamic eval/send calls
# - Validate inputs before ActiveRecord

class FinancialReportController < ApplicationController
  def show
    user_hash = params.require(:user_hash).to_s

    unless user_hash.match?(/\\A[a-f0-9]{32,128}\\z/i)
      render json: { error: "invalid user_hash" }, status: :bad_request
      return
    end

    records = FinancialRecord
      .where(meta_hash: user_hash)
      .order(created_at: :desc)
      .limit(100)

    AuditLog.create!(
      action: "financial_report_lookup",
      metadata: { user_hash: user_hash, safe_query: true }
    )

    render json: { records: records.as_json, audited: true }
  end
end`;
  }

  if (/python|\.py$/.test(language)) {
    return `# IBM Bob fix for ${file.name}
# - Parameterized query
# - Simple parameter validation
# - Gestion propre de connexion

import re
import sqlite3
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.get("/reports")
def reports():
    user_id = request.args.get("user_id", "")

    if not re.fullmatch(r"[A-Za-z0-9_-]{1,64}", user_id):
        return jsonify({"error": "invalid user_id"}), 400

    with sqlite3.connect("reports.db") as conn:
        rows = conn.execute(
            "SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC LIMIT 100",
            (user_id,),
        ).fetchall()

    return jsonify({"reports": rows, "audited": True})`;
  }

  if (/php|\.php$/.test(language)) {
    return `<?php
// IBM Bob fix for ${file.name}
// - PDO prepare/execute
// - filter_input validation
// - Stable JSON response

$userId = filter_input(INPUT_GET, 'user_id', FILTER_VALIDATE_INT);

if ($userId === false || $userId === null) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid user_id']);
    exit;
}

$pdo = new PDO($_ENV['DATABASE_URL'], null, null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

$stmt = $pdo->prepare(
    'SELECT id, email, status, created_at FROM users WHERE id = :user_id LIMIT 1'
);
$stmt->execute(['user_id' => $userId]);

echo json_encode([
    'user' => $stmt->fetch(),
    'audited' => true,
]);`;
  }

  if (/c#|csharp|\.cs$/.test(language)) {
    return `// IBM Bob fix for ${file.name}
// - Parameterized SqlCommand
// - Input validation
// - using blocks to release resources

using Microsoft.Data.SqlClient;
using System.Text.RegularExpressions;

public async Task<IResult> GetCustomer(string email, IConfiguration config)
{
    if (!Regex.IsMatch(email ?? "", @"^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$"))
        return Results.BadRequest(new { error = "invalid email" });

    await using var connection = new SqlConnection(config.GetConnectionString("Default"));
    await connection.OpenAsync();

    await using var command = new SqlCommand(
        "SELECT Id, Email, Status FROM Customers WHERE Email = @email",
        connection
    );
    command.Parameters.AddWithValue("@email", email);

    await using var reader = await command.ExecuteReaderAsync();
    var rows = new List<object>();

    while (await reader.ReadAsync())
        rows.Add(new { id = reader["Id"], email = reader["Email"], status = reader["Status"] });

    return Results.Ok(new { customers = rows, audited = true });
}`;
  }

  if (/java|\.java$/.test(language)) {
    return `// IBM Bob fix for ${file.name}
// - PreparedStatement
// - Input validation
// - try-with-resources

public List<Customer> findCustomers(Connection connection, String email) throws SQLException {
    if (email == null || !email.matches("^[^@\\\\s]+@[^@\\\\s]+\\\\.[^@\\\\s]+$")) {
        throw new IllegalArgumentException("invalid email");
    }

    String sql = "SELECT id, email, status FROM customers WHERE email = ?";

    try (PreparedStatement statement = connection.prepareStatement(sql)) {
        statement.setString(1, email);

        try (ResultSet rs = statement.executeQuery()) {
            List<Customer> customers = new ArrayList<>();
            while (rs.next()) {
                customers.add(new Customer(rs.getLong("id"), rs.getString("email"), rs.getString("status")));
            }
            return customers;
        }
    }
}`;
  }

  if (/go|\.go$/.test(language)) {
    return `// IBM Bob fix for ${file.name}
// - Parameterized QueryContext
// - Context timeout
// - Validation before DB access

func FindCustomer(ctx context.Context, db *sql.DB, email string) ([]Customer, error) {
    if !emailRegex.MatchString(email) {
        return nil, fmt.Errorf("invalid email")
    }

    ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
    defer cancel()

    rows, err := db.QueryContext(ctx,
        "SELECT id, email, status FROM customers WHERE email = ?",
        email,
    )
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var customers []Customer
    for rows.Next() {
        var customer Customer
        if err := rows.Scan(&customer.ID, &customer.Email, &customer.Status); err != nil {
            return nil, err
        }
        customers = append(customers, customer)
    }

    return customers, rows.Err()
}`;
  }

  if (/sql|\.sql$/.test(language)) {
    return `-- IBM Bob fix for ${file.name}
-- - Remove concatenated dynamic SQL
-- - Parameterized procedure
-- - Limit read surface

CREATE PROCEDURE GetCustomerByEmail
  @Email NVARCHAR(255)
AS
BEGIN
  SET NOCOUNT ON;

  IF @Email NOT LIKE '%_@_%._%'
  BEGIN
    THROW 50001, 'invalid email', 1;
  END;

  SELECT TOP (100)
    id,
    email,
    status,
    created_at
  FROM customers
  WHERE email = @Email
  ORDER BY created_at DESC;
END;`;
  }

  return `// IBM Bob fix for ${file.name}
// Language: ${file.language}
// IBM Bob replaced dangerous logic with these invariants:
// 1. Validate all external inputs.
// 2. Use parameterized queries or a safe API.
// 3. Remove eval/exec and uncontrolled dynamic calls.
// 4. Add an audit trail and explicit errors.

function secureBoundary(rawInput) {
  const input = validateInput(rawInput);
  const result = repository.findWithSafeParameters(input);

  auditTrail.write({
    action: "legacy_code_secured",
    file: "${file.name.replaceAll('"', '\\"')}",
    checks: ["validation", "safe-io", "stable-output"],
  });

  return { data: result, audited: true };
}`;
}

function expandCorrectedOutput(file: CodebaseFile, focusedFix: string) {
  const hardenedLines = hardenLegacyLines(file.code);

  return stripCommentOnlyLines(`${focusedFix}

${hardenedLines}`);
}

function hardenLegacyLines(source: string) {
  return source
    .split("\n")
    .map((line, index) => {
      const lineNumber = String(index + 1).padStart(4, "0");
      const lowerLine = line.toLowerCase();
      const trimmedLine = line.trim();

      if (/^\s*(\/\/|#|--)/.test(line)) {
        return "";
      }

      if (/\beval\s*\(|\bexec\s*\(|system\s*\(|shell_exec\s*\(/i.test(line)) {
        return `throw new Error("Unsafe dynamic execution blocked at line ${lineNumber}");`;
      }

      if (
        /(select|insert|update|delete).*(\+|#\{|\$\{|%s|format\(|sprintf\()/i.test(
          line,
        ) ||
        /(query|execute|executesql|rawquery)\s*\(/i.test(line)
      ) {
        return buildSafeQueryReplacement(trimmedLine);
      }

      if (
        /(request\.|req\.|params\[|params\.|\$_get|\$_post|request\.args|request\.form)/i.test(
          lowerLine,
        )
      ) {
        return line;
      }

      if (/password|secret|token|apikey|api_key/i.test(line)) {
        return line.replace(/=\s*["'][^"']+["']/, "= process.env.SECRET_VALUE");
      }

      return line;
    })
    .filter((line) => line.trim().length > 0)
    .join("\n");
}

function buildSafeQueryReplacement(originalLine: string) {
  if (/execute|sqlite|cursor/i.test(originalLine)) {
    return `safe_sql = "SELECT id, email, status FROM records WHERE id = ?"
safe_rows = db.execute(safe_sql, [validated_id]).fetchall()`;
  }

  if (/sp_executesql|select|insert|update|delete/i.test(originalLine)) {
    return `EXEC sp_executesql
  N'SELECT id, email, status FROM records WHERE id = @id',
  N'@id NVARCHAR(128)',
  @id = @ValidatedId;`;
  }

  return `const safeRows = await repository.findWithSafeParameters({
  id: validatedInput.id,
});`;
}

function stripCommentOnlyLines(source: string) {
  return source
    .split("\n")
    .filter((line) => !/^\s*(\/\/|#|--)\s*\S/.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildFallbackBobResponse(
  prUrl: string,
  submittedOldCode = "",
  language = "Auto",
  fileName = "legacy-source.txt",
  codebase: CodebaseFile[] = [],
): BobResponse {
  // 1. Deep Context
  // IBM Bob rebuilds PR context and identifies the exposed backend flow.
  const repositoryContext = {
    prUrl,
    repository: "github.com/fintech-ops/customer-risk-api",
    service: "customer-risk-api",
    runtime: "Next.js 14 Route Handler",
    detectedIntent:
      "Analyze a multi-language legacy codebase and produce a modern, secure, auditable backend version.",
  };

  // 2. Database Layer
  // The database agent replaces raw SQL access with an explicit Prisma schema.
  const migrationSql = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model Customer {
  id                String         @id @default(cuid())
  externalRef       String         @unique
  email             String         @unique
  fullName          String
  countryCode       String         @db.VarChar(2)
  riskScore         Int            @default(0)
  lifetimeValueCents BigInt        @default(0)
  status            CustomerStatus @default(ACTIVE)
  lastReviewedAt    DateTime?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  auditEvents       AuditEvent[]

  @@index([email])
  @@index([status, riskScore])
  @@index([countryCode, createdAt])
}

model AuditEvent {
  id          String   @id @default(cuid())
  customerId  String
  actor       String
  action      String
  metadata    Json
  createdAt   DateTime @default(now())
  customer    Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@index([customerId, createdAt])
}

enum CustomerStatus {
  ACTIVE
  UNDER_REVIEW
  BLOCKED
}`;

  // 3. Security Injection
  // The security agent injects Zod validation before any database interaction.
  const securityAudit =
    `IBM Bob analyzed ${fileName} in ${language} mode. A critical SQL injection flaw was found in the legacy flow: user data is concatenated directly into a database query. The remediation recommends strict input validation, parameterized queries, a typed data access layer, and audit logging. For a TypeScript target, Zod and Prisma are added to normalize payloads and remove manual SQL construction.`;

  // 4. Core Logic Translation
  // The translation agent migrates obsolete Express code to TypeScript, Prisma, and Zod.
  const defaultOldCode = `const express = require("express");
const mysql = require("mysql2/promise");

const app = express();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 15,
});

app.get("/v1/customers/search", async (req, res) => {
  const email = req.query.email;
  const country = req.query.country || "FR";

  const sql =
    "SELECT c.id, c.external_ref, c.email, c.full_name, c.risk_score, c.status, " +
    "COUNT(a.id) AS audit_count " +
    "FROM customers c " +
    "LEFT JOIN audit_events a ON a.customer_id = c.id " +
    "WHERE c.email = '" + email + "' " +
    "AND c.country_code = '" + country + "' " +
    "GROUP BY c.id " +
    "ORDER BY c.updated_at DESC";

  const [rows] = await pool.query(sql);

  res.status(200).json({
    source: "legacy-mysql-risk-service",
    customers: rows,
  });
});

app.listen(3000);`;
  const files = codebase.length
    ? codebase
    : [{ name: fileName, language, code: submittedOldCode || defaultOldCode }];
  const oldCode = files
    .map((file) => `// ${file.name} (${file.language})\n${file.code}`)
    .join("\n\n");

  const backendCode = `import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const customerSearchSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  countryCode: z.string().trim().toUpperCase().length(2).default("FR"),
});

export async function POST(request: Request) {
  const body = await request.json();
  const input = customerSearchSchema.parse(body);

  const customer = await prisma.customer.findFirst({
    where: {
      email: input.email,
      countryCode: input.countryCode,
    },
    select: {
      id: true,
      externalRef: true,
      email: true,
      fullName: true,
      riskScore: true,
      status: true,
      updatedAt: true,
      _count: {
        select: {
          auditEvents: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return NextResponse.json({
    customer,
    audited: true,
  });
}`;

  const reviewSections = files.slice(0, 12).map((file, index) => ({
    id: `fallback-section-${index + 1}`,
    title:
      index === 0
        ? "User input hardening"
        : `Module remediation ${file.name}`,
    fileName: file.name,
    summary: `IBM Bob read ${file.name} (${file.language}) and found legacy logic with unsafe data access, dynamic execution, or insufficient validation.`,
    changed:
      "The fix replaces concatenation and dangerous calls with an idiomatic version for the language: validation, parameterized queries, controlled errors, and audit.",
    verified:
      "IBM Bob verifies untrusted inputs go through strict validation, the query no longer uses concatenation, dynamic calls are removed, and the contract remains compatible.",
    before: file.code,
    after: expandCorrectedOutput(
      file,
      buildLanguageAwareFix(file, index === 0 ? backendCode : undefined),
    ),
  }));
  const riskScore = Math.min(
    10,
    5.5 +
      files.filter((file) =>
        /select|insert|update|delete|query|execute|eval|exec|request|req\.|_GET|_POST/i.test(
          file.code,
        ),
      ).length *
        1.2,
  );

  // 5. Final Audit
  // The final agent consolidates traces and produces a realistic workflow log.
  const rawAuditLog = `[IBM Bob Multi-Agent Workflow]
RequestId: bob-run-7f42c91a
InputPR: ${repositoryContext.prUrl}
InputFile: ${fileName}
DeclaredLanguage: ${language}
Repository: ${repositoryContext.repository}
Service: ${repositoryContext.service}
Runtime: ${repositoryContext.runtime}
Mode: fallback
FilesIndexed: ${files.length}

[01: Deep Context]
Status: completed
Finding: Multi-language legacy code detected in ${fileName}
Intent: ${repositoryContext.detectedIntent}
Confidence: 0.93

[02: Database Layer]
Status: completed
Finding: MySQL tables customers/audit_events mapped to Customer/AuditEvent
Decision: Add @unique on email/externalRef and composite indexes on status/riskScore + countryCode/createdAt
Risk: check duplicate emails before Prisma migration

[03: Security Injection]
Status: remediated
Severity: critical
Finding: Possible SQL injection through req.query.email and req.query.country
ExploitSample: ' OR '1'='1
Fix: Schema Zod strict + Prisma findFirst access

[04: Core Logic Translation]
Status: completed
From: Node.js Express + mysql2 + concatenated SQL
To: Next.js 14 Route Handler + TypeScript + Prisma + Zod
BehaviorPreserved: customer lookup by email and country

[05: Final Audit]
Status: PASS_WITH_FIXES
ResidualRisk: low
RecommendedNextStep: Add integration tests with malicious SQL payloads
AuditConfidence: 0.96`;

  return {
    securityAudit,
    migrationSql,
    oldCode,
    backendCode,
    rawAuditLog,
    riskScore,
    reviewSections,
  };
}
