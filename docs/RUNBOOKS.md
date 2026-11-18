# Incident Runbooks

Short, step-by-step procedures for common incidents. Keep these printed and accessible offline.

---

## 1. Server Down / Unreachable

**Symptoms**: Uptime Kuma alerts (HTTP, TCP), SSH fails, no response on port 80/443.

**Steps**:
1. Check provider console — is the VM running? (Power cycle if stuck)
2. If VM running but SSH fails: check console/VNC for kernel panic or OOM killer
3. If OOM: `docker stats` (if accessible) or reboot via provider console
4. Once SSH works:
   ```bash
   sudo systemctl status docker
   docker compose -f /opt/app/docker-compose.yml ps
   docker compose -f /opt/app/docker-compose.yml logs --tail=100
   ```
5. Restart failed containers: `docker compose -f /opt/app/docker-compose.yml restart`
6. Verify: `curl -I https://yourdomain.com`

---

## 2. Container Crash Loop

**Symptoms**: Container restarts repeatedly (`docker ps` shows `Restarting` or uptime < 10s).

**Steps**:
1. `docker compose -f /opt/app/docker-compose.yml logs <service> --tail=200`
2. Common causes:
   - OOM: increase memory limit or fix memory leak
   - Port conflict: another process on same port
   - Config error: missing env var, bad Caddyfile
   - DB migration failed: run `npx prisma migrate deploy` manually
3. Fix root cause, then `docker compose restart <service>`

---

## 3. Disk Full

**Symptoms**: `df -h` shows >90% used, writes fail, DB errors.

**Steps**:
1. Find largest directories:
   ```bash
   sudo du -h /var/lib/docker | sort -hr | head -20
   ```
2. Clean Docker:
   ```bash
   docker system prune -a --volumes  # WARNING: removes unused volumes!
   # Safer: docker image prune -a && docker builder prune -a
   ```
3. Clean logs:
   ```bash
   sudo journalctl --vacuum-time=7d
   ```
4. If DB: check for runaway WAL or old partitions
5. After cleanup: `docker compose restart`

---

## 4. Suspected Breach / Compromise

**Symptoms**: Unknown processes, unexpected outbound connections, modified binaries, strange DB queries in logs.

**Steps**:
1. **Isolate**: `sudo ufw deny out on eth0` (or provider firewall) — stop data exfiltration
2. Preserve evidence: snapshot disk via provider console
3. Check:
   ```bash
   # Recent logins
   last -i
   # Open network connections
   ss -tulpn
   # Suspicious processes
   ps auxf
   # Modified files in last 24h
   find / -type f -mtime -1 -not -path "/proc/*" -not -path "/sys/*" 2>/dev/null | head -50
   ```
4. Rotate ALL secrets: DB password, API keys, JWT secrets, SSH keys
5. Rebuild server from clean repo (docker-compose, configs) — do not trust compromised host
6. Restore DB from last known-good backup (verify timestamp before breach)
7. Post-incident: document timeline, root cause, prevention

---

## 5. Restore from Backup

**When**: Data corruption, accidental deletion, ransomware, failed migration.

**Prereqs**: Backup repo accessible, restic password available.

### Database Restore
```bash
# 1. List DB snapshots
restic -r $RESTIC_REPOSITORY snapshots --tag db

# 2. Pick snapshot ID (e.g. abc123def)
# 3. Restore dump
restic -r $RESTIC_REPOSITORY restore abc123def --target /tmp/restore --include "pg-dump-*.dump"
DUMP=$(ls /tmp/restore/pg-dump-*.dump)

# 4. Restore (WARNING: overwrites data)
docker compose -f /opt/app/docker-compose.yml exec -T db \
  pg_restore -U app_user -d system_website --clean --if-exists --no-owner --no-privileges "$DUMP"

# 5. Verify
docker compose -f /opt/app/docker-compose.yml exec -T db \
  psql -U app_user -d system_website -c "SELECT COUNT(*) FROM \"Order\";"
```

### Client Website Volume Restore
```bash
# 1. List volume snapshots
restic -r $RESTIC_REPOSITORY snapshots --tag volumes

# 2. Restore specific client (e.g. client-xyz)
restic -r $RESTIC_REPOSITORY restore <snap-id> \
  --target /tmp/restore \
  --include "var/lib/docker/volumes/app_client-xyz/*"

# 3. Swap volume data
docker compose -f /opt/app/docker-compose.yml stop client-xyz
rm -rf /var/lib/docker/volumes/app_client-xyz/_data/*
cp -a /tmp/restore/var/lib/docker/volumes/app_client-xyz/_data/* /var/lib/docker/volumes/app_client-xyz/_data/
docker compose -f /opt/app/docker-compose.yml start client-xyz
```

---

## 6. TLS Certificate Issues

**Symptoms**: Browser shows cert warning, Uptime Kuma keyword check fails.

**Steps**:
1. Check Caddy logs: `docker compose logs caddy --tail=100`
2. Common: DNS not propagated, CA rate limit, port 80 blocked
3. Force renewal: `docker compose restart caddy`
4. If rate limited: wait (Caddy backs off), or switch to DNS challenge (needs Cloudflare API token in Caddy)

---

## 7. Database Migration Failed

**Symptoms**: App won't start, migration error in logs.

**Steps**:
1. Check exact error: `docker compose logs app | grep -A 20 migration`
2. If failed migration is reversible: `npx prisma migrate resolve --rolled-back <migration_name>`
3. If schema drift: `npx prisma db pull` then `npx prisma migrate dev` (dev only!)
4. Production: manually apply SQL fix, then `npx prisma migrate resolve --applied <name>`

---

## Emergency Contacts

| Role | Name | Phone | Slack/Telegram |
|---|---|---|---|
| Primary Infra | | | |
| Secondary Infra | | | |
| DBA | | | |
| Security | | | |
| Cloudflare DNS | | | |
| Backup Storage (Wasabi/B2) | | | |

---

## Access Inventory (Review Monthly)

| Person | SSH Access | Docker Access | DB Access | Cloudflare | Backup Repo | Notes |
|---|---|---|---|---|---|---|
| | | | | | | |
| | | | | | | |

*No shared logins. Every person has their own SSH key and sudo account.*