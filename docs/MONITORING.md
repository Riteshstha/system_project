# Monitoring & Alerting Setup

**Goal**: Know about downtime before clients do. All monitoring runs OUTSIDE the production server.

---

## 1. Uptime Kuma (External Monitoring)

Deploy Uptime Kuma on a **separate small VPS** ($5-10/mo) or use a managed instance (e.g., Uptime Kuma Cloud, Better Stack).

### Monitors to Configure

| Monitor Type | Target | Interval | Alert Condition |
|---|---|---|---|
| HTTP(s) | `https://yourdomain.com` | 60s | Status != 200 |
| HTTP(s) | `https://yourdomain.com/api/health` | 30s | Status != 200 or body != `{"ok":true}` |
| HTTP(s) | `https://yourdomain.com/api/health/db` | 60s | Status != 200 |
| TCP | `yourdomain.com:443` | 60s | Connection refused/timeout |
| Keyword | `https://yourdomain.com` | 300s | Response missing "Acme Web Studio" |

### Heartbeat Endpoints (add to Next.js app)

Create `/api/health/route.ts`:
```typescript
// Basic liveness
export async function GET() {
  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}
```

Create `/api/health/db/route.ts`:
```typescript
// Readiness - checks DB connectivity
import { prisma } from '@/lib/prisma';
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: 'connected' });
  } catch (e) {
    return NextResponse.json({ ok: false, db: 'down' }, { status: 503 });
  }
}
```

---

## 2. Server-Level Monitoring (Prometheus Node Exporter + Uptime Kuma Push)

### Option A: Uptime Kuma Push URLs (simplest, no Prometheus)

Each backup script and health check pushes to Uptime Kuma push URL:

```bash
# Success push
curl "https://uptime.yourdomain.com/api/push/<monitor-id>?status=up&msg=OK"
# Failure push
curl "https://uptime.yourdomain.com/api/push/<monitor-id>?status=down&msg=FAIL"
```

### Option B: Node Exporter + Prometheus + Alertmanager (proper)

If team capacity allows, deploy on the **monitoring VPS**:
- `prometheus-node-exporter` on production server (exposes `:9100/metrics`)
- Prometheus scrapes it
- Alertmanager routes to Slack/email/Telegram

**Key alerts:**
| Alert | Expression | Severity |
|---|---|---|
| DiskSpaceCritical | `node_filesystem_avail_bytes / node_filesystem_size_bytes < 0.15` | critical |
| RAMCritical | `node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes < 0.1` | warning |
| CPULoadHigh | `node_load5 > 2 * count(cpu_cores)` | warning |
| ContainerDown | `up{job="docker"} == 0` | critical |
| CertExpiringSoon | `ssl_cert_not_after - time() < 86400 * 14` | warning |
| BackupMissed | `time() - backup_last_success_timestamp > 86400 * 6` | critical |

---

## 3. Alert Routing

**All alerts go to a team channel (Slack / Telegram / Email group), never a single person.**

Uptime Kuma → Slack/Telegram webhook → `#infra-alerts` channel
Prometheus/Alertmanager → same webhook

---

## 4. Log Aggregation (Optional but Recommended)

Ship application logs + Docker logs to a separate log store:
- **Loki + Grafana** (on monitoring VPS) — free, powerful
- **Better Stack / Logtail** — managed, cheap for low volume
- **Elastic / Datadog** — overkill for 4-5 person team

Minimum: ensure `docker compose logs -f` works and `journalctl -u docker` is accessible.

---

## 5. TLS Certificate Monitoring

Caddy manages certs automatically. Monitor:
- Uptime Kuma keyword check on homepage
- Cert expiry via `openssl` check from monitoring VPS:
  ```bash
  echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
  ```
- Alert if `notAfter < 14 days`