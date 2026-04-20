# Runbook — Amutot Platform Deployment

## ארכיטקטורה

- **שרת**: 72.62.154.127 (Hostinger VPS, Debian 13)
- **תיקייה**: `/opt/miltech-association/`
- **פורט**: 3100 (HTTP, ללא SSL)
- **Network**: `miltech-association-net` (מבודד מ-miluim)

## Bootstrap ראשוני (חד-פעמי)

```bash
# על השרת:
bash /root/server-bootstrap.sh

# צור .env:
nano /opt/miltech-association/.env
# (מלא ערכים לפי deploy/.env.example)
```

## Deploy רגיל

1. Push ל-`main`
2. GitHub Actions בונה images ודוחף ל-ghcr.io
3. Actions מתחבר ב-SSH, עושה `docker compose pull && up -d`
4. Prisma migrations רצות אוטומטית
5. Health check מוודא שהכל עלה

## צפייה ב-Logs

```bash
ssh root@72.62.154.127
cd /opt/miltech-association

# כל הלוגים
docker compose -f docker-compose.prod.yml logs -f

# רק backend
docker compose -f docker-compose.prod.yml logs -f backend

# רק 50 שורות אחרונות
docker compose -f docker-compose.prod.yml logs --tail=50 backend
```

## הרצת מיגרציה ידנית

```bash
cd /opt/miltech-association
docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy --schema=./prisma/schema.prisma
```

## Rollback לגרסה קודמת

```bash
cd /opt/miltech-association

# מצא את ה-SHA של הגרסה הרצויה מ-GitHub Actions
# ערוך את ה-compose או השתמש ב-IMAGE_TAG:
export IMAGE_TAG=abc123def456
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## שחזור מ-Backup

```bash
cd /opt/miltech-association

# רשימת גיבויים
ls -la data/backups/

# שחזור (⚠️ מוחק את כל הנתונים הנוכחיים!)
gunzip -c data/backups/pg-2026-04-21.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres psql -U amutot
```

## סיבוב Secrets

1. ערוך `/opt/miltech-association/.env`
2. `docker compose -f docker-compose.prod.yml up -d` (restart עם הערכים החדשים)

## Containers שלנו (ורק שלנו!)

| Container | Service |
|-----------|---------|
| amutot-postgres | PostgreSQL 16 |
| amutot-backend | NestJS API |
| amutot-frontend | Next.js |
| amutot-nginx | Reverse proxy |

**אסור לגעת** בכל container שמתחיל ב-`yogev-` או `evolution_` או `n8n`.
