# תוכנית Deploy — Phase 2

תאריך: 2026-04-21  
אסטרטגיה: Option C — פורט נפרד, בלי SSL, אפס מגע בפרויקט miluim

---

## ארכיטקטורה

```
Internet
    │
    ▼ :3100
┌─────────────────────────────────────────────┐
│  amutot-nginx (our container)               │
│  /api/* → backend:3000                      │
│  /*     → frontend:3000                     │
└─────────────────────────────────────────────┘
    │                    │
    ▼                    ▼
┌──────────┐      ┌──────────────┐
│ backend  │      │  frontend    │
│ :3000    │      │  :3000       │
└──────────┘      └──────────────┘
    │
    ▼
┌──────────────────┐
│  postgres:5432   │
│  (127.0.0.1:5433 │
│   on host)       │
└──────────────────┘
```

- כל הקונטיינרים ברשת `miltech-association-net`
- רק ה-nginx חשוף ל-0.0.0.0:3100
- Postgres חשוף רק ל-127.0.0.1:5433 (לגישת debug מהשרת)

---

## A. קבצים שייווצרו ב-REPO (לוקאלי)

| קובץ | תיאור |
|-------|--------|
| `docker/Dockerfile.backend` | Multi-stage build ל-NestJS |
| `docker/Dockerfile.frontend` | Multi-stage build ל-Next.js standalone |
| `docker/nginx.conf` | Config ל-nginx שלנו |
| `docker-compose.prod.yml` | Compose לפרודקשן |
| `.github/workflows/deploy.yml` | CI/CD pipeline |
| `deploy/server-bootstrap.sh` | סקריפט הכנת שרת חד-פעמי |
| `deploy/.env.example` | תבנית env |
| `docs/deploy/README.md` | Runbook |

## B. קבצים שייווצרו על השרת — `/opt/miltech-association/`

```
/opt/miltech-association/
├── docker-compose.prod.yml
├── nginx.conf
├── .env                    ← secrets, never committed
├── data/
│   ├── postgres/           ← volume mount
│   └── backups/            ← pg dumps
└── logs/
```

## C. Reverse Proxy

- **nginx חדש שלנו** בתוך ה-compose שלנו, על פורט 3100
- **אפס שינוי** ב-yogev-nginx או בכל קובץ של miluim
- SSL אפשר להוסיף בהמשך (certbot + nginx config update)

## D. GitHub Actions Secrets נדרשים

| Secret Name | תיאור | איך ליצור |
|-------------|--------|-----------|
| `DEPLOY_SSH_HOST` | `72.62.154.127` | פשוט ה-IP |
| `DEPLOY_SSH_USER` | `root` | — |
| `DEPLOY_SSH_KEY` | Private SSH key | `ssh-keygen -t ed25519` → תוכן הפרטי |
| `GHCR_TOKEN` | GitHub PAT עם write:packages | Settings → Developer settings → PAT |
| `DATABASE_URL` | `postgresql://amutot:PASSWORD@postgres:5432/amutot_db` | בחר סיסמה חזקה |
| `JWT_SECRET` | מחרוזת אקראית | `openssl rand -hex 32` |
| `GREEN_API_INSTANCE` | Instance ID של Green API | מהחשבון שלך |
| `GREEN_API_TOKEN` | API token של Green API | מהחשבון שלך |
| `VAPID_PUBLIC_KEY` | Push notification public key | `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Push notification private key | אותה פקודה |

## E. DNS

לאחר הכנת השרת, צריך להוסיף:

```
Type: A
Name: app (or @ for root)
Value: 72.62.154.127
TTL: 300
```

**הערה**: מכיוון שאין SSL, אפשר גם פשוט לגשת ישירות ל-`http://72.62.154.127:3100` בלי DNS. ה-DNS הוא נוחות.

## F. Rollback

1. כל image נתויג עם `:latest` + `:SHA`
2. לחזור לגרסה קודמת:
   ```bash
   cd /opt/miltech-association
   # Edit docker-compose.prod.yml — change image tag from :latest to :SPECIFIC_SHA
   docker compose pull
   docker compose up -d
   ```
3. מיגרציות Prisma הן forward-only. אם מיגרציה שברה — צריך מיגרציה מתקנת חדשה.

## G. פורטים (סיכום)

| Service | Inside Network | Host Bind |
|---------|---------------|-----------|
| nginx (שלנו) | 80 | 0.0.0.0:3100 |
| frontend | 3000 | — (internal only) |
| backend | 3000 | — (internal only) |
| postgres | 5432 | 127.0.0.1:5433 |

**אין התנגשות** עם:
- yogev-nginx (80, 443)
- yogev-postgres (5432)
- evolution_api (8080)
- n8n (32768)
