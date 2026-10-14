# Pizza Harrison — Database Backup & Disaster Recovery Guide

This standard operating procedure (SOP) defines the backup, replication, and disaster recovery protocol for Pizza Harrison's PostgreSQL database (hosted via Supabase or self-managed PostgreSQL) and cloud asset storage.

---

## 1. Objectives & Service Level Agreements (SLAs)

| Metric | Target | Rationale |
| :--- | :--- | :--- |
| **RPO (Recovery Point Objective)** | < 15 Minutes | Maximum acceptable data loss window for restaurant orders & payments. |
| **RTO (Recovery Time Objective)** | < 30 Minutes | Maximum acceptable service downtime before full operational failover. |
| **Retention Policy** | 30 Days Daily, 12 Months Monthly | Compliance for local sales tax and financial auditing in Uttar Pradesh. |

---

## 2. PostgreSQL Database Backup Procedures

### A. Automated Daily Dump (Custom Compressed Format)
Use `pg_dump` with custom compression format (`-Fc`), which allows selective table restoration and parallel jobs:

```bash
#!/bin/bash
# scripts/backup-postgres.sh
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/pizzaharrison/postgres"
BACKUP_FILE="${BACKUP_DIR}/pizzaharrison_${TIMESTAMP}.dump"

mkdir -p ${BACKUP_DIR}

# Execute dump with exact paise schema and audit tables
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -p 5432 \
  -Fc \
  -v \
  -f "${BACKUP_FILE}"

# Encrypt backup with GPG
gpg --batch --yes --passphrase "${BACKUP_ENCRYPTION_KEY}" -c "${BACKUP_FILE}"
rm "${BACKUP_FILE}"

# Sync encrypted archive to offsite S3-compatible cold storage
aws s3 cp "${BACKUP_FILE}.gpg" s3://pizza-harrison-backups-secure/daily/ --endpoint-url https://s3.ap-south-1.amazonaws.com

# Prune local backups older than 14 days
find ${BACKUP_DIR} -name "*.gpg" -mtime +14 -exec rm {} \;
```

### B. Supabase CLI Snapshot
If operating on managed Supabase:
```bash
# Export schema and active data snapshot
supabase db dump --data-only -f supabase/backups/data_$(date +%Y%m%d).sql
supabase db dump --schema-only -f supabase/backups/schema_$(date +%Y%m%d).sql
```

---

## 3. Disaster Recovery & Restoration Procedures

### A. Point-in-Time Database Restoration
To restore a corrupted or wiped database to a clean PostgreSQL instance:

```bash
# 1. Decrypt archive
gpg --batch --yes --passphrase "${BACKUP_ENCRYPTION_KEY}" -d pizzaharrison_20261014_030000.dump.gpg > restore_target.dump

# 2. Terminate active client connections
psql -h ${DB_HOST} -U ${DB_USER} -d postgres -c "
  SELECT pg_terminate_backend(pid) 
  FROM pg_stat_activity 
  WHERE datname = 'pizzaharrison' AND pid <> pg_backend_pid();
"

# 3. Clean drop and recreate database
psql -h ${DB_HOST} -U ${DB_USER} -d postgres -c "DROP DATABASE IF EXISTS pizzaharrison;"
psql -h ${DB_HOST} -U ${DB_USER} -d postgres -c "CREATE DATABASE pizzaharrison WITH OWNER ph_admin ENCODING 'UTF8';"

# 4. Multi-threaded restore using pg_restore
pg_restore \
  -h ${DB_HOST} \
  -U ${DB_USER} \
  -d pizzaharrison \
  -j 4 \
  -v \
  restore_target.dump

# 5. Clean up unencrypted restore dump
rm restore_target.dump
```

### B. Applying Schema Migrations
Verify schema migrations are sequential and match repository commits:
```bash
# Run migration verification
psql -h ${DB_HOST} -U ${DB_USER} -d pizzaharrison -f supabase/migrations/00001_initial_schema.sql
```

---

## 4. Product Image & Asset Backup Procedures

Product photographs, hero assets, and category banners stored in Supabase Storage or AWS S3 must be synchronized continuously:

```bash
#!/bin/bash
# scripts/sync-media-assets.sh
# Bidirectional sync of uploaded menu images to secondary disaster-recovery bucket
aws s3 sync \
  s3://pizzaharrison-media-primary/ \
  s3://pizzaharrison-media-dr-mumbai/ \
  --delete \
  --storage-class STANDARD_IA
```

---

## 5. Verification & Restoration Drill Checklist

Conduct a quarterly verification drill:
- [ ] Spin up isolated local Docker PostgreSQL instance on port `5433`.
- [ ] Pull latest encrypted backup from S3 cold storage.
- [ ] Decrypt and run `pg_restore`.
- [ ] Verify Row Counts:
  - `SELECT COUNT(*) FROM orders;`
  - `SELECT COUNT(*) FROM products;`
  - `SELECT COUNT(*) FROM audit_logs;`
- [ ] Verify exact paise calculation consistency:
  - `SELECT order_number, total_paise, subtotal_paise - discount_paise + delivery_fee_paise + tax_paise + packaging_fee_paise AS calculated_paise FROM orders WHERE total_paise <> (subtotal_paise - discount_paise + delivery_fee_paise + tax_paise + packaging_fee_paise);` (Must return 0 rows).
- [ ] Connect Next.js application staging instance to verified restored container and execute test transaction.
