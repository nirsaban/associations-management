# דוח סקירת שרת — Phase 1 Discovery

תאריך: 2026-04-21  
שרת: 72.62.154.127 (Hostinger VPS)

---

## מערכת הפעלה

- **OS**: Debian GNU/Linux 13 (trixie)
- **Kernel**: 6.12.63+deb13-amd64
- **Arch**: x86_64

## Docker

- **Docker**: 29.2.1
- **Compose**: v5.1.0 (plugin mode)

## קונטיינרים קיימים (אסור לגעת!)

| Container | Image | Ports | Status | Project |
|-----------|-------|-------|--------|---------|
| yogev-nginx | nginx:alpine | 0.0.0.0:80→80, 0.0.0.0:443→443 | Up (healthy) | miluim |
| yogev-frontend | miluim-frontend | 3000/tcp (internal) | Up (healthy) | miluim |
| yogev-backend | miluim-backend | 3001/tcp (internal) | Up (healthy) | miluim |
| yogev-postgres | postgres:16-alpine | 0.0.0.0:5432→5432 | Up (healthy) | miluim |
| evolution_api | atendai/evolution-api:v2.1.1 | 0.0.0.0:8080→8080 | Up | evolution-api |
| evolution_postgres | postgres:15-alpine | 5432/tcp (internal) | Up | evolution-api |
| evolution_redis | redis:7-alpine | 6379/tcp (internal) | Up | evolution-api |
| n8n-2ce3-n8n-1 | n8n | 0.0.0.0:32768→5678 | Up | n8n |

## רשתות Docker קיימות

| Network | Driver |
|---------|--------|
| bridge | bridge |
| evolution-api_evolution_network | bridge |
| miluim_yogev-network | bridge |
| n8n-2ce3_default | bridge |
| openclaw-vvgz_default | bridge |

## Volumes קיימים

- evolution-api_evolution_instances
- evolution-api_postgres_data
- evolution-api_redis_data
- miluim_postgres_data
- miluim_uploads_data
- n8n-2ce3_n8n_data

## פורטים תפוסים

| Port | Process |
|------|---------|
| 22 | sshd |
| 80 | docker-proxy (yogev-nginx) |
| 443 | docker-proxy (yogev-nginx) |
| 5432 | docker-proxy (yogev-postgres) |
| 8080 | docker-proxy (evolution_api) |
| 32768 | docker-proxy (n8n) |

## Reverse Proxy

- **Type**: Nginx (containerized, inside miluim project)
- **Container**: `yogev-nginx`
- **Config**: `/root/miluim/nginx/nginx.conf`
- **Domain served**: `miltech.cloud` + `www.miltech.cloud`
- **SSL**: Let's Encrypt via certbot, cert at `/root/miluim/certbot/conf/live/miltech.cloud/`
- **Network**: `miluim_yogev-network` (internal to miluim)

## מיקום הפרויקטים הקיימים

| Path | Project |
|------|---------|
| /root/miluim/ | פרויקט מילואים (yogev) |
| /root/evolution-api/ | Evolution WhatsApp API |
| /root/yogev-system/ | (קבצי עזר) |

## משאבים

- **Disk**: 99GB total, 43GB used, 53GB available (45%)
- **RAM**: 8GB total, ~2.4GB used, ~5.6GB available
- **Swap**: None

## Firewall

- **UFW**: לא מותקן
- **iptables**: default policy (לא מוגבל)

## SSL / Certbot

- Certbot מותקן (snap)
- תעודה ל-`miltech.cloud` דרך certbot (מנוהלת בתוך `/root/miluim/certbot/conf/`)
- אין תעודות נוספות ברמת המערכת

## Cron

- אין crontab מוגדר

---

## אסטרטגיית Reverse Proxy — ההמלצה

הבעיה: ה-Nginx הקיים הוא **בתוך** הרשת של miluim (yogev-network) ומגיש רק את miltech.cloud. הוא לא מוגדר כ-shared reverse proxy.

**אפשרויות:**

1. ~~להוסיף server block ל-nginx של miluim~~ — ❌ אסור לגעת בפרויקט הקיים
2. **להקים Nginx/Traefik חדש שלנו** — צריך לשחרר פורטים 80/443 ← ❌ ישבור את miluim
3. ✅ **להוסיף server block חדש ב-nginx של miluim בצורה בטוחה** — הדרך היחידה שעובדת מבלי לנגוע בפורטים

**החלטה הסופית מחכה לאישורך** — ראה בהמשך.

---

## סיכום סיכונים

| סיכון | חומרה | הערה |
|--------|--------|------|
| Nginx תופס 80/443 — אי אפשר להקים proxy חדש על אותם פורטים | גבוה | צריך לשתף את ה-Nginx הקיים או לשנות ארכיטקטורה |
| Postgres של miluim חשוף ל-0.0.0.0:5432 | בינוני | לא שלנו, אבל זה לא best practice |
| אין firewall | נמוך | פורטים 3100/3101/5433 שלנו יהיו 127.0.0.1 only |
| אין swap | נמוך | 5.6GB פנוי מספיק כרגע |
