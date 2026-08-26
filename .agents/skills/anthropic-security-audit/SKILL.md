---
name: anthropic-security-audit
description: >-
  Use this skill when the user asks to perform a security audit of the codebase, 
  check for vulnerabilities, or review code for security best practices.
---

# Anthropic Security Audit Skill

This skill provides a structured methodology for performing a comprehensive security audit of a codebase or specific components, inspired by industry best practices and Anthropic's security guidelines.

## Audit Workflow

When asked to perform a security audit, follow these steps systematically:

### 1. Information Gathering & Threat Modeling
- **Identify the Scope:** Clarify which files, components, or services are in scope.
- **Understand Data Flow:** Trace how sensitive data (PII, credentials, payment info) enters, moves through, and exits the system.
- **Identify Trust Boundaries:** Note where data crosses from untrusted sources (e.g., user input, external APIs) into the application.

### 2. Vulnerability Scanning (Manual & Static Analysis)
Check for the OWASP Top 10 and common architectural flaws:
- **Injection:** Are all inputs sanitized and parameterized (SQL, NoSQL, OS Command)?
- **Broken Authentication/Authorization:** Are sessions managed securely? Are permissions checked at every boundary?
- **Sensitive Data Exposure:** Are secrets hardcoded? Is TLS used everywhere? Is sensitive data hashed (bcrypt/Argon2) or encrypted?
- **XSS & CSRF:** Are React/Next.js safeguards bypassed (e.g., `dangerouslySetInnerHTML`)? Are CSRF tokens implemented for mutations?
- **Insecure Direct Object References (IDOR):** Can a user access another user's data by manipulating IDs?

### 3. Dependency & Configuration Review
- Check `package.json` for outdated or notoriously insecure packages.
- Ensure environment variables are not leaked to the frontend unintentionally (e.g., missing `NEXT_PUBLIC_` prefix when they shouldn't have it, or exposing backend-only secrets).

### 4. Reporting
Compile findings into a clear, structured artifact:
- **Severity Level:** (Critical, High, Medium, Low)
- **Vulnerability Description:** What is the issue?
- **Impact:** What happens if an attacker exploits this?
- **Remediation:** Provide exact code snippets or architectural changes to fix the vulnerability.

## Execution Rules
- **Do not execute untrusted code** during the audit.
- Always provide actionable, secure code replacements.
- If you find a critical vulnerability (e.g., hardcoded database credentials), alert the user immediately before continuing the full audit.
