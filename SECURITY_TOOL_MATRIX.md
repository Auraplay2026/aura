# Comprehensive DevSecOps Tool Verification & Coverage Matrix

| Security Area | Verified Tool | Open Source | Verified | Automated | Docker | CI/CD | Cloud / VPS | SAST | DAST | API Security | Secrets | Dependencies | Containers | IaC | TLS / Headers | SBOM | Vulnerability Mgmt |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **SAST (Static Code)** | [Semgrep](https://github.com/semgrep/semgrep) (LGPL-2.1) | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** | NO | NO | Partial | NO | NO | Partial | NO | NO | NO |
| **Deep Semantic SAST** | [CodeQL](https://github.com/github/codeql-action) (Action MIT) | **YES** | **YES** | **YES** | NO | **YES** | NO | **YES** | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| **DAST & API Scanner** | [OWASP ZAP](https://github.com/zaproxy/zaproxy) (Apache-2.0) | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** | NO | **YES** | **YES** | NO | NO | NO | NO | **YES** | NO | NO |
| **Vulnerability & CVE** | [Nuclei](https://github.com/projectdiscovery/nuclei) (MIT) | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** | NO | **YES** | **YES** | NO | NO | NO | NO | **YES** | NO | NO |
| **Secrets & Keys** | [Gitleaks](https://github.com/gitleaks/gitleaks) (MIT) | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** | NO | NO | NO | **YES** | NO | NO | NO | NO | NO | NO |
| **Live Credential Verification**| [TruffleHog](https://github.com/trufflesecurity/trufflehog) (AGPL-3.0) | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** | NO | NO | NO | **YES** | NO | NO | NO | NO | NO | NO |
| **SCA, Containers & IaC** | [Aqua Trivy](https://github.com/aquasecurity/trivy) (Apache-2.0) | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** | NO | NO | NO | **YES** | **YES** | **YES** | **YES** | NO | **YES** | NO |
| **Dockerfile Best Practices** | [Hadolint](https://github.com/hadolint/hadolint) (GPL-3.0) | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** | NO | NO | NO | NO | NO | **YES** | NO | NO | NO | NO |
| **IaC Compliance Engine** | [Checkov](https://github.com/bridgecrewio/checkov) (Apache-2.0) | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** | NO | NO | NO | **YES** | NO | NO | **YES** | NO | **YES** | NO |
| **Orchestration & Dashboard** | [OWASP DefectDojo](https://github.com/DefectDojo/django-DefectDojo) (BSD-3) | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** | Ingest | Ingest | Ingest | Ingest | Ingest | Ingest | Ingest | Ingest | Ingest | **YES** |

---

## Detailed Tool Breakdown & Operational Characteristics

### 1. Semgrep
- **Exact URL**: `https://github.com/semgrep/semgrep`
- **Strengths**: Sub-second execution on large codebases; zero-configuration default rules (`p/default`, `p/owasp-top-ten`, `p/javascript`, `p/typescript`); custom rule syntax matches standard code syntax.
- **Limitations**: Does not cross complex multi-repository dynamic RPC boundaries; cannot execute binaries.

### 2. OWASP ZAP (Zed Attack Proxy)
- **Exact URL**: `https://github.com/zaproxy/zaproxy`
- **Strengths**: Industry-standard DAST engine; Automation Framework (`zap.yaml`); OpenAPI/Swagger and GraphQL schema ingestion; authenticated active scanning.
- **Limitations**: Active scanning against stateful destructive endpoints (e.g. `POST /api/account/delete`) requires explicit exclusion to prevent corrupting database fixtures.

### 3. ProjectDiscovery Nuclei
- **Exact URL**: `https://github.com/projectdiscovery/nuclei`
- **Strengths**: Extremely rapid HTTP request engine; 10,000+ community YAML templates covering CVEs, TLS ciphers, misconfigured security headers, exposed admin consoles, and tech stack fingerprints.
- **Limitations**: Template-dependent; does not perform generic stateful application business logic fuzzing like ZAP.

### 4. Gitleaks
- **Exact URL**: `https://github.com/gitleaks/gitleaks`
- **Strengths**: Blazing fast regex and Shannon-entropy analysis across Git commit history, uncommitted staged diffs, and loose files.
- **Limitations**: High entropy strings (e.g. base64-encoded SVG images or SHA256 hashes) can occasionally cause false positives unless allowlisted via `.gitleaksignore`.

### 5. Aqua Security Trivy
- **Exact URL**: `https://github.com/aquasecurity/trivy`
- **Strengths**: Unified swiss-army scanner covering lockfiles (npm, pip, go, cargo), container image OS packages, Dockerfile/IaC misconfigurations, and CycloneDX/SPDX SBOM generation in a single binary.
- **Limitations**: Vulnerability matching is based on published package CVE databases; does not find 0-day bugs in proprietary application logic.

### 6. Bridgecrew Checkov
- **Exact URL**: `https://github.com/bridgecrewio/checkov`
- **Strengths**: Deep policy-as-code evaluation for Dockerfiles, Kubernetes manifests, Terraform, and cloud configs against CIS benchmarks and SOC2 frameworks.
- **Limitations**: Heavy Python runtime; slightly slower startup overhead than Go-based binaries.

### 7. OWASP DefectDojo
- **Exact URL**: `https://github.com/DefectDojo/django-DefectDojo`
- **Strengths**: Aggregates and deduplicates reports from Semgrep, Trivy, ZAP, Gitleaks, Checkov, and Nuclei into a single pane of glass with risk scoring, SLA tracking, and Jira/Slack alerts.
- **Limitations**: Requires self-hosted infrastructure (PostgreSQL, Redis, Celery workers, Django web service).
