# Open-Source DevSecOps Repository Research & Verification Dossier

This document provides a verified, evidence-backed evaluation of active open-source security tools. Every repository listed below has been independently inspected and confirmed public, active, licensed, and automated via CLI, Docker, and CI/CD pipelines.

---

## 1. Static Application Security Testing (SAST)

### Primary: Semgrep (`semgrep/semgrep`)
- **Official Repository**: [https://github.com/semgrep/semgrep](https://github.com/semgrep/semgrep)
- **Official Organization**: Semgrep, Inc.
- **License**: GNU Lesser General Public License v2.1 (LGPL-2.1)
- **Maintenance Status**: Active (Latest release: `v1.172.0+`, daily commits)
- **Supported Languages**: JavaScript, TypeScript, Python, Go, Java, C#, Ruby, PHP, Rust, Kotlin, Scala, Terraform, Dockerfile, YAML, JSON.
- **How It Works**: Semgrep performs fast, syntax-aware, semantic pattern matching directly on the Abstract Syntax Tree (AST) without requiring complete compilation binaries.
- **What It Can Detect**:
  - OWASP Top 10 vulnerabilities (SQL Injection, Cross-Site Scripting (XSS), Command Injection, Path Traversal, Insecure Deserialization).
  - Cryptographic weaknesses (hardcoded IVs, weak hashing algorithms like MD5/SHA1, insecure PRNG).
  - Business logic misconfigurations (missing authorization checks, open redirects, improper error handling revealing stack traces).
  - Framework-specific antipatterns (Next.js server action leaks, Express SSR vulnerabilities, Prisma raw query injections).
- **What It Cannot Detect**:
  - Runtime memory corruption in compiled binaries without rules.
  - Vulnerabilities dependent on complex multi-service dynamic runtime state.
- **Docker Support**: `docker pull semgrep/semgrep:latest`
- **CI/CD Integration**: Native CLI `semgrep scan --config auto --sarif --output semgrep.sarif` or GitHub Action `semgrep/semgrep`.
- **Output Formats**: JSON, SARIF, Text, JUnit XML, Emacs, GitLab SAST.

### Alternative Evaluated: GitHub CodeQL (`github/codeql-action`)
- **Official Repository**: [https://github.com/github/codeql-action](https://github.com/github/codeql-action)
- **License**: MIT (Action runner wrapper); CodeQL CLI operates under GitHub CodeQL Terms and Conditions (Free for public open-source repos; requires GitHub Advanced Security for private corporate enterprise repos).
- **Maintenance Status**: Active (Current major version `v4`).
- **Capabilities**: Deep path-sensitive taint tracking across compilation units. Excellent for complex multi-function taint analysis, but slower build times and restrictive commercial licensing for private self-hosted setups.

### Alternative Evaluated: SonarQube Community Edition (`SonarSource/sonarqube`)
- **Official Repository**: [https://github.com/SonarSource/sonarqube](https://github.com/SonarSource/sonarqube)
- **License**: LGPL-3.0 (Community Build)
- **Docker**: `docker pull sonarqube:community`
- **Capabilities**: Comprehensive code quality, bugs, hotspots, and security vulnerabilities. High resource footprint (requires dedicated JVM and database).

---

## 2. Dynamic Application Security Testing (DAST) & API Security

### Primary: OWASP ZAP (Zed Attack Proxy) (`zaproxy/zaproxy`)
- **Official Repository**: [https://github.com/zaproxy/zaproxy](https://github.com/zaproxy/zaproxy)
- **Official Organization**: Software in the Public Interest (SPI) / OWASP Foundation
- **License**: Apache License 2.0
- **Maintenance Status**: Active (Regular monthly updates, active core team).
- **Capabilities**:
  - **Passive Scanning**: Analyzes HTTP traffic passing through the proxy without modifying requests (inspects missing security headers, insecure cookies, content type sniffing, information disclosure).
  - **Active Scanning**: Injects real attack payloads into query parameters, body payloads, headers, and form inputs (SQLi, reflected/stored XSS, SSRF, XML External Entities (XXE), Path Traversal).
  - **API Inspection**: Ingests OpenAPI / Swagger 2.0/3.0 JSON/YAML specifications and GraphQL schemas to automatically map and test all endpoints.
  - **Automation Framework (AF)**: Uses a declarative `zap.yaml` file to execute reproducible scan jobs headless in CI/CD.
  - **Authenticated Testing**: Supports Session Management, Form-Based, JSON Script-Based, and Header-Based (Bearer Token / Cookie) authentication contexts.
- **Docker Support**: `ghcr.io/zaproxy/zaproxy:stable` or `zaproxy/zap-stable`
- **GitHub Actions**: `zaproxy/action-baseline`, `zaproxy/action-api-scan`, `zaproxy/action-full-scan`.
- **Known Limitations**: Active scanning against stateful mutations (e.g. `DELETE /api/users/1`) can destroy test database state. Active scans must be targeted exclusively against isolated staging environments.

### Complementary: ProjectDiscovery Nuclei (`projectdiscovery/nuclei`)
- **Official Repository**: [https://github.com/projectdiscovery/nuclei](https://github.com/projectdiscovery/nuclei)
- **Official Organization**: ProjectDiscovery
- **License**: MIT License
- **Maintenance Status**: Active (Frequent weekly releases).
- **Capabilities**: Fast, template-based vulnerability scanner with 10,000+ community templates. Scans for known CVEs, exposed admin panels, zero-day misconfigurations, DNS/SSL misconfigurations, and specific web framework exposures.
- **Docker Support**: `projectdiscovery/nuclei:latest`
- **GitHub Action**: `projectdiscovery/nuclei-action`
- **Output Formats**: JSON, SARIF, Markdown.

---

## 3. Secret Detection & Leaked Credential Scanning

### Primary: Gitleaks (`gitleaks/gitleaks`)
- **Official Repository**: [https://github.com/gitleaks/gitleaks](https://github.com/gitleaks/gitleaks)
- **Official Organization**: Gitleaks
- **License**: MIT License (Core CLI)
- **Maintenance Status**: Active (v8.x release track).
- **Capabilities**:
  - Fast, regex and Shannon-entropy based scanning of entire Git commit histories, uncommitted diffs, and loose filesystem directories.
  - Detects 160+ token types including AWS keys, Stripe secret keys, JWT tokens, GitHub tokens, database connection URIs, private RSA/SSH keys, Slack webhooks, SendGrid keys, Google API credentials.
- **Docker Support**: `ghcr.io/gitleaks/gitleaks:latest`
- **CI/CD Integration**: `gitleaks detect --source . --report-format sarif --report-path gitleaks.sarif --verbose`
- **Output Formats**: JSON, SARIF, CSV.

### Alternative Evaluated: TruffleHog (`trufflesecurity/trufflehog`)
- **Official Repository**: [https://github.com/trufflesecurity/trufflehog](https://github.com/trufflesecurity/trufflehog)
- **License**: GNU AGPL-3.0
- **Capabilities**: Deep secret detection with live API key verification (attempts non-destructive verification calls to determine if a discovered key is active). Higher runtime and network overhead; useful in periodic deep audit schedules.

---

## 4. Software Composition Analysis (SCA) & Container Security

### Primary: Aqua Security Trivy (`aquasecurity/trivy`)
- **Official Repository**: [https://github.com/aquasecurity/trivy](https://github.com/aquasecurity/trivy)
- **Official Organization**: Aqua Security
- **License**: Apache License 2.0
- **Maintenance Status**: Active (Continuous daily database updates and weekly releases).
- **Comprehensive Coverage**:
  1. **Filesystem & Lockfiles (SCA)**: Scans `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `requirements.txt`, `Pipfile.lock`, `go.sum`, `Cargo.lock`, `composer.lock`, `Gemfile.lock`.
  2. **Container Images**: Scans OS packages (Alpine, Debian, Ubuntu, RedHat, Amazon Linux) and application-level libraries embedded in container layers.
  3. **Infrastructure as Code (IaC)**: Analyzes Dockerfiles, Kubernetes manifests, Terraform, and Helm charts for security misconfigurations.
  4. **Software Bill of Materials (SBOM)**: Generates and ingests CycloneDX and SPDX format SBOMs.
  5. **License Compliance**: Identifies non-compliant software licenses across dependency trees (GPL, AGPL, commercial).
- **Docker Support**: `aquasec/trivy:latest` or `ghcr.io/aquasecurity/trivy:latest`
- **GitHub Action**: `aquasecurity/trivy-action`
- **Output Formats**: JSON, SARIF, Table, CycloneDX, SPDX, Template.

### Complementary: Hadolint (`hadolint/hadolint`)
- **Official Repository**: [https://github.com/hadolint/hadolint](https://github.com/hadolint/hadolint)
- **License**: GPL-3.0
- **Capabilities**: Dockerfile linter enforcing best practices (root user prevention, pinned package versions, improper `ADD` usage, apt-get cache clearing).
- **Docker**: `hadolint/hadolint:latest-alpine`

### Alternative Evaluated: Google OSV-Scanner (`google/osv-scanner`)
- **Official Repository**: [https://github.com/google/osv-scanner](https://github.com/google/osv-scanner)
- **License**: Apache License 2.0
- **Capabilities**: Direct interface to Google's Open Source Vulnerabilities database (OSV.dev). Fast and lightweight SCA scanner.

---

## 5. Infrastructure-as-Code (IaC) & Cloud Security

### Primary: Checkov (`bridgecrewio/checkov`)
- **Official Repository**: [https://github.com/bridgecrewio/checkov](https://github.com/bridgecrewio/checkov)
- **Official Organization**: Bridgecrew (Palo Alto Networks / Prisma Cloud)
- **License**: Apache License 2.0
- **Maintenance Status**: Active (Regular releases and updates).
- **Capabilities**:
  - Over 1,000 built-in security policies for Terraform, CloudFormation, Kubernetes, Dockerfile, Serverless framework, Helm charts, and GitHub Actions workflows.
  - Validates CIS benchmarks, AWS Well-Architected, SOC2, PCI-DSS compliance frameworks.
- **Docker Support**: `bridgecrew/checkov:latest`
- **Output Formats**: JSON, SARIF, CLI Table, JUnit XML, CycloneDX.

---

## 6. Vulnerability Management & DevSecOps Orchestration

### Primary: OWASP DefectDojo (`DefectDojo/django-DefectDojo`)
- **Official Repository**: [https://github.com/DefectDojo/django-DefectDojo](https://github.com/DefectDojo/django-DefectDojo)
- **Official Organization**: OWASP Foundation
- **License**: BSD 3-Clause License
- **Maintenance Status**: Active (V3 architecture, hundreds of active contributors).
- **Capabilities**:
  - **Unified Ingestion**: Native parsers for 200+ security tools (Semgrep, Trivy, OWASP ZAP, Gitleaks, Checkov, Nuclei, SonarQube, Hadolint, Dependency-Track, Burp Suite, Nmap).
  - **Deduplication**: Automatically correlates findings across scanner runs by CWE, file path, endpoint, and hash to eliminate duplicate alerts.
  - **Risk Grading & Compliance**: Aggregates CVSS v3.1 scores, tracks SLA breaches, maps findings to compliance regulations (OWASP Top 10, ASVS, PCI-DSS).
  - **Bidirectional Integrations**: Syncs issues with Jira, GitHub Issues, Slack, Teams, Email, and webhook systems.
  - **REST API v2**: Full API capabilities for automated report ingestion directly from CI/CD runners (`/api/v2/import-scan/` and `/api/v2/reimport-scan/`).
- **Deployment Support**: Official Docker Compose (`docker-compose.yml`) and Kubernetes Helm Chart.
