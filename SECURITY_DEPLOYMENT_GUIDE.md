# Production DevSecOps VPS Deployment & Orchestration Guide

This guide details the exact steps to deploy the centralized **OWASP DefectDojo** vulnerability management platform on your VPS, configure automated scan ingestion, and establish continuous automated auditing.

---

## 1. System Requirements & Architecture

- **Host OS**: Ubuntu 22.04 LTS / Debian 12 / RHEL 9
- **Hardware**: Minimum 2 vCPU, 4GB RAM, 40GB SSD (DefectDojo + Celery + PostgreSQL + Redis)
- **Prerequisites**: Docker Engine 24+ & Docker Compose v2 (`docker compose`)

---

## 2. Step 1: Deploy OWASP DefectDojo on VPS

Create a dedicated directory on your VPS:

```bash
sudo mkdir -p /opt/defectdojo && cd /opt/defectdojo
```

Create the production `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: defectdojo
      POSTGRES_USER: dojo
      POSTGRES_PASSWORD: ${DOJO_DB_PASSWORD:-SuperSecretDojoDBPass2026!}
    volumes:
      - dojo-postgres-data:/var/lib/postgresql/data
    networks:
      - dojo-internal

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    networks:
      - dojo-internal

  uwsgi:
    image: defectdojo/defectdojo-django:3.1.0
    restart: unless-stopped
    depends_on:
      - postgres
      - redis
    environment:
      DD_DATABASE_URL: postgresql://dojo:${DOJO_DB_PASSWORD:-SuperSecretDojoDBPass2026!}@postgres:5432/defectdojo
      DD_CELERY_BROKER_URL: redis://redis:6379/0
      DD_SECRET_KEY: ${DOJO_SECRET_KEY:-ChangeMeInProductionSecretKey2026!}
      DD_ALLOWED_HOSTS: "*"
    volumes:
      - dojo-media:/app/media
    networks:
      - dojo-internal

  celery-worker:
    image: defectdojo/defectdojo-django:3.1.0
    command: ["/entrypoint-celery-worker.sh"]
    restart: unless-stopped
    depends_on:
      - uwsgi
      - redis
    environment:
      DD_DATABASE_URL: postgresql://dojo:${DOJO_DB_PASSWORD:-SuperSecretDojoDBPass2026!}@postgres:5432/defectdojo
      DD_CELERY_BROKER_URL: redis://redis:6379/0
      DD_SECRET_KEY: ${DOJO_SECRET_KEY:-ChangeMeInProductionSecretKey2026!}
    volumes:
      - dojo-media:/app/media
    networks:
      - dojo-internal

  celery-beat:
    image: defectdojo/defectdojo-django:3.1.0
    command: ["/entrypoint-celery-beat.sh"]
    restart: unless-stopped
    depends_on:
      - uwsgi
      - redis
    environment:
      DD_DATABASE_URL: postgresql://dojo:${DOJO_DB_PASSWORD:-SuperSecretDojoDBPass2026!}@postgres:5432/defectdojo
      DD_CELERY_BROKER_URL: redis://redis:6379/0
      DD_SECRET_KEY: ${DOJO_SECRET_KEY:-ChangeMeInProductionSecretKey2026!}
    networks:
      - dojo-internal

  nginx:
    image: defectdojo/defectdojo-nginx:3.1.0
    restart: unless-stopped
    depends_on:
      - uwsgi
    ports:
      - "8080:8080"
    volumes:
      - dojo-media:/app/media:ro
    networks:
      - dojo-internal

volumes:
  dojo-postgres-data:
  dojo-media:

networks:
  dojo-internal:
    driver: bridge
```

Start the DefectDojo stack:

```bash
docker compose up -d
```

Obtain the generated admin password:

```bash
docker compose logs uwsgi | grep "Admin password:"
```

---

## 3. Step 2: Initialize DefectDojo Product & API Key

1. Navigate in your browser to `http://<YOUR_VPS_IP>:8080` (or your reverse-proxied domain e.g. `https://security.yourdomain.com`).
2. Log in as `admin`.
3. Create a **Product Type**: `Web Applications`.
4. Create a **Product**: `AuraBet Full-Stack`.
5. Create an **Engagement**: `Continuous CI/CD Automated Audits`.
6. Navigate to your User Profile (`admin`) → **API Key** → Copy the **API v2 Key**.

---

## 4. Step 3: Configure GitHub Secrets

Add the following secrets to your GitHub repository (`Settings` → `Secrets and variables` → `Actions`):

- `DEFECTDOJO_URL`: `https://security.yourdomain.com` (or `http://<VPS_IP>:8080`)
- `DEFECTDOJO_API_KEY`: `<YOUR_DEFECTDOJO_V2_API_KEY>`
- `DEFECTDOJO_ENGAGEMENT_ID`: `1` (The Engagement ID created in Step 2)
- `STAGING_APP_URL`: `https://staging.yourdomain.com`
- `STAGING_AUTH_TOKEN`: `<TEST_USER_BEARER_TOKEN>`

---

## 5. Step 4: Staging DAST Automation Setup (`zap.yaml`)

Create the OWASP ZAP Automation Framework configuration file at `.zap/zap.yaml`:

```yaml
---
env:
  contexts:
    - name: "AuraBet Staging API"
      urls:
        - "${STAGING_APP_URL}"
      includePaths:
        - "${STAGING_APP_URL}/api/.*"
        - "${STAGING_APP_URL}/rewards.*"
        - "${STAGING_APP_URL}/casino.*"
      excludePaths:
        - "${STAGING_APP_URL}/api/admin/system/reset.*"
        - "${STAGING_APP_URL}/api/account/delete.*"
      authentication:
        method: "manual"
      sessionManagement:
        method: "cookie"
  parameters:
    failOnError: false
    failOnWarning: false
    progressToStdout: true

jobs:
  - type: spider
    parameters:
      context: "AuraBet Staging API"
      maxDuration: 5
      maxDepth: 3

  - type: openapi
    parameters:
      context: "AuraBet Staging API"
      apiUrl: "${STAGING_APP_URL}/api/docs/openapi.json"

  - type: passiveScan-wait
    parameters:
      maxDuration: 5

  - type: activeScan
    parameters:
      context: "AuraBet Staging API"
      policy: "API-Minimal"
      maxRuleDurationInMins: 2
      maxScanDurationInMins: 10

  - type: report
    parameters:
      template: "traditional-json"
      reportDir: "/zap/wrk"
      reportFile: "zap-report.json"
```

---

## 6. Step 5: Nightly Automated Cron Scan on VPS

To perform daily off-peak scans directly against the staging and sandbox environments, create `/opt/security-scripts/nightly-audit.sh` on the VPS:

```bash
#!/usr/bin/env bash
set -euo pipefail

SCAN_DATE=$(date +%Y-%m-%d)
REPORT_DIR="/var/log/security-audits/$SCAN_DATE"
mkdir -p "$REPORT_DIR"

echo "[$SCAN_DATE] Starting Nightly Nuclei Passive Audit..."
docker run --rm -v "$REPORT_DIR:/reports" projectdiscovery/nuclei:latest \
  -u "https://staging.yourdomain.com" \
  -tags misconfig,cve,tech,ssl,headers \
  -severity info,low,medium,high,critical \
  -json-export /reports/nuclei-staging.json

echo "[$SCAN_DATE] Uploading Nuclei Report to DefectDojo..."
curl -X POST "http://localhost:8080/api/v2/import-scan/" \
  -H "Authorization: Token ${DOJO_API_KEY}" \
  -H "Content-Type: multipart/form-data" \
  -F "scan_type=Nuclei Scan" \
  -F "engagement=1" \
  -F "file=@$REPORT_DIR/nuclei-staging.json" \
  -F "active=true" \
  -F "verified=false"

echo "[$SCAN_DATE] Nightly Audit Complete."
```

Schedule it in `crontab -e`:

```cron
0 2 * * * /opt/security-scripts/nightly-audit.sh >> /var/log/security-audits/cron.log 2>&1
```

---

## 7. Step 6: Backup, Retention & Maintenance Strategy

1. **Database Backups**:
   ```bash
   docker compose exec postgres pg_dump -U dojo defectdojo | gzip > /opt/backups/dojo-$(date +%F).sql.gz
   ```
2. **DefectDojo Deduplication**:
   - DefectDojo automatically marks duplicate findings from successive runs as duplicates and updates the "Last Seen" timestamp.
3. **Closing Fixed Issues**:
   - Re-running scans with the `reimport-scan` API automatically moves unresolved findings to "Mitigated / Closed" if they are no longer detected in the new report artifact.
