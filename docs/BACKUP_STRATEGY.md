# Backup & Restore Strategy

**Goal**: Daily encrypted backups of PostgreSQL database + client website data (volumes) to a separate provider/location, with a tested, documented restore procedure.

---

## Architecture

| Component | Backup Method | Destination | Frequency |
|---|---|---|---|
| PostgreSQL | `pg_dump` (custom format, compressed) | Restic repository on Wasabi / Backblaze B2 / S3-compatible | Daily 02:00 UTC |
| Client website data (Docker volumes) | Restic (filesystem-level, encrypted) | Same Restic repository | Daily 02:30 UTC |
| Caddy TLS certificates | Restic | Same | Daily 03:00 UTC |

**Why Restic?**
- Encryption at rest (AES-256) — provider never sees plaintext.
- Incremental, deduplicated — fast, cheap.
- Works with any S3-compatible storage (Wasabi, Backblaze B2, MinIO).
- Built-in snapshot verification and restore.

---

## 1. Prerequisites

- S3-compatible bucket at a **different provider/region** than the server (e.g., server at Hetzner, backup at Wasabi or Backblaze B2).
- Bucket credentials with write + list + delete access for retention policy.
- Restic password (strong, generated, stored in password manager + printed copy in physical safe).

---

## 2. Backup Scripts

### `/opt/backup/backup-db.sh`
```bash
#!/usr/bin/env bash
set -euo pipefail

# Load environment
source /opt/backup/.env

TIMESTAMP=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
DUMP_FILE="/tmp/pg-dump-${TIMESTAMP}.dump"

echo "[${TIMESTAMP}] Starting database backup..."

# Dump database (custom format, compressed, no owner/privs for portable restore)
docker compose -f /opt/app/docker-compose.yml exec -T db \
  pg_dump -U app_user -d system_website --format=custom --compress=9 --no-owner --no-privileges > "${DUMP_FILE}"

echo "[${TIMESTAMP}] Dump complete ($(du -h "${DUMP_FILE}" | cut -f1)). Encrypting & pushing to Restic..."

# Restic backs up the dump file
restic -r "${RESTIC_REPOSITORY}" backup "${DUMP_FILE}" --tag "db" --tag "${TIMESTAMP}"

echo "[${TIMESTAMP}] Pruning old snapshots..."
restic -r "${RESTIC_REPOSITORY}" forget --keep-daily 14 --keep-weekly 8 --keep-monthly 6 --prune

echo "[${TIMESTAMP}] Database backup complete."
rm -f "${DUMP_FILE}"
```

### `/opt/backup/backup-volumes.sh`
```bash
#!/usr/bin/env bash
set -euo pipefail

source /opt/backup/.env

TIMESTAMP=$(date -u +"%Y-%m-%dT%H-%M-%SZ")

echo "[${TIMESTAMP}] Starting volume backup..."

# Backup docker volumes (db_data, caddy_data, caddy_config, and client site volumes)
# Client site volumes are named like: app_client-{clientId}-*
restic -r "${RESTIC_REPOSITORY}" backup \
  /var/lib/docker/volumes/app_db_data \
  /var/lib/docker/volumes/app_caddy_data \
  /var/lib/docker/volumes/app_caddy_config \
  /var/lib/docker/volumes/app_client-* \
  --tag "volumes" --tag "${TIMESTAMP}"

echo "[${TIMESTAMP}] Pruning old snapshots..."
restic -r "${RESTIC_REPOSITORY}" forget --keep-daily 14 --keep-weekly 8 --keep-monthly 6 --prune

echo "[${TIMESTAMP}] Volume backup complete."
```

### `/opt/backup/.env` (mode 600, owned by root)
```bash
# Restic repository (S3 example)
export RESTIC_REPOSITORY="s3:s3.wasabisys.com/your-bucket-name"
export AWS_ACCESS_KEY_ID="YOUR_KEY"
export AWS_SECRET_ACCESS_KEY="YOUR_SECRET"
export RESTIC_PASSWORD="YOUR_STRONG_RANDOM_PASSWORD"
```

---

## 3. Cron Jobs (root crontab)

```bash
# Daily 02:00 UTC - Database
0 2 * * * /opt/backup/backup-db.sh >> /var/log/backup-db.log 2>&1

# Daily 02:30 UTC - Volumes
30 2 * * * /opt/backup/backup-volumes.sh >> /var/log/backup-volumes.log 2>&1
```

---

## 4. Restore Procedure (Documented & Tested)

### Test Schedule
- **Monthly**: Restore latest DB snapshot to a throwaway container, verify schema + row counts.
- **Quarterly**: Full disaster-recovery drill — spin up fresh server from backups only.

### Restore Database

```bash
# 1. List available snapshots
restic -r s3:s3.wasabisys.com/your-bucket snapshots --tag db

# 2. Identify snapshot ID (e.g. abc123)
# 3. Restore dump file to temp location
restic -r s3:s3.wasabisys.com/your-bucket restore abc123 --target /tmp/restore --include "pg-dump-*.dump"

# 4. Find the dump file
DUMP_FILE=$(ls /tmp/restore/pg-dump-*.dump)

# 5. Restore into running database (DANGER: overwrites!)
docker compose -f /opt/app/docker-compose.yml exec -T db \
  pg_restore -U app_user -d system_website --clean --if-exists --no-owner --no-privileges "${DUMP_FILE}"

# 6. Verify
docker compose -f /opt/app/docker-compose.yml exec -T db \
  psql -U app_user -d system_website -c "SELECT COUNT(*) FROM \"Order\";"
```

### Restore Client Website Volumes

```bash
# 1. List volume snapshots
restic -r s3:s3.wasabisys.com/your-bucket snapshots --tag volumes

# 2. Restore specific client volume (e.g. client-abc123)
restic -r s3:s3.wasabisys.com/your-bucket restore abc123 \
  --target /tmp/restore \
  --include "var/lib/docker/volumes/app_client-abc123/*"

# 3. Stop the client's container
docker compose -f /opt/app/docker-compose.yml stop client-abc123

# 4. Replace volume data
rm -rf /var/lib/docker/volumes/app_client-abc123/_data/*
cp -a /tmp/restore/var/lib/docker/volumes/app_client-abc123/_data/* /var/lib/docker/volumes/app_client-abc123/_data/

# 5. Restart container
docker compose -f /opt/app/docker-compose.yml start client-abc123
```

---

## 5. Alerting for Failed Backups

Add to cron wrapper or use a monitoring tool (Uptime Kuma HTTP check on a health endpoint, or a simple heartbeat):

```bash
# Simple heartbeat: after each backup, curl a monitoring URL
curl -fsS -m 10 --retry 3 "https://uptime.yourdomain.com/api/push/abc123?status=up&msg=DB+backup+ok" || true
```

Alert if no heartbeat received within 6 hours.

---

## 6. Credentials Storage

| Secret | Where Stored |
|---|---|
| Restic password | Password manager (Bitwarden/1Password) + printed copy in physical safe |
| S3 credentials | `/opt/backup/.env` (mode 600, root) — consider HashiCorp Vault or SOPS later |
| DB password | Docker secret / `.env` (already in docker-compose) |

---

## 7. Single Point of Failure & Upgrade Path

**Current**: One server = one SPOF. If it dies, downtime = time to provision new server + restore.

**Upgrade Path (when paying clients exist)**:
1. **Warm standby**: Second VPS ($10-20/mo) in different AZ/region.
   - Runs `db` as a **read replica** (streaming replication).
   - Syncs Docker volumes via `rsync` hourly or `restic` snapshot sync.
   - Can promote to primary in ~15 min.
2. **Full HA**: Two active servers + external PostgreSQL (RDS/Cloud SQL) + object storage for site volumes. Cost: 3-5x current.