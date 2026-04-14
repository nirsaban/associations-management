# Deployment Guide - Amutot Frontend

## Quick Start

### Local Development
```bash
# Install dependencies
pnpm install

# Set environment variables
cp .env.example .env.local

# Edit .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Start development server
pnpm dev

# Open http://localhost:3000
```

## Pre-Deployment Checklist

- [ ] API server running on `NEXT_PUBLIC_API_URL`
- [ ] JWT secret configured on API
- [ ] Database seeded with test users
- [ ] CORS configured on API for frontend domain
- [ ] Environment variables updated
- [ ] TypeScript compiles: `pnpm typecheck`
- [ ] ESLint passes: `pnpm lint`
- [ ] All pages tested manually

## Building for Production

### Build Command
```bash
pnpm build
```

This will:
1. Compile all TypeScript files
2. Optimize all images
3. Generate static pages where possible
4. Create production bundle in `.next/`

### Starting Production Server
```bash
pnpm start

# Runs on http://localhost:3000 by default
# Set PORT env var to change port
PORT=8080 pnpm start
```

## Deployment Options

### Option 1: Vercel (Recommended)

**Benefits**: Zero-config, serverless, auto-scaling, built for Next.js

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy

# Link to existing project
vercel link

# Set environment variables in Vercel dashboard
# - NEXT_PUBLIC_API_URL

# Deploy to production
vercel --prod
```

**Important**: Add your domain in Vercel settings and update API CORS whitelist.

### Option 2: Docker

**Dockerfile**
```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

ENV NEXT_TELEMETRY_DISABLED=1
CMD ["node", "server.js"]
```

**Build & Run**
```bash
# Build image
docker build -t amutot-web:latest .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://api.example.com/api/v1 \
  amutot-web:latest

# Docker Compose
docker-compose up
```

**docker-compose.yml**
```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://api:3001/api/v1
    depends_on:
      - api
  
  api:
    image: amutot-api:latest
    ports:
      - "3001:3001"
    # ... API configuration
```

### Option 3: Traditional Server (VPS/EC2)

**Prerequisites**
- Node.js 20+
- pnpm or npm
- Nginx reverse proxy
- SSL certificate (Let's Encrypt)

**Setup**
```bash
# SSH to server
ssh user@your-server.com

# Clone repository
git clone https://github.com/amutot/amutot.git
cd amutot/apps/web

# Install & build
pnpm install
pnpm build

# Start with PM2 (process manager)
npm i -g pm2
pm2 start "pnpm start" --name "amutot-web"
pm2 startup
pm2 save
```

**Nginx Configuration**
```nginx
upstream nextjs {
  server 127.0.0.1:3000;
}

server {
  listen 80;
  server_name app.example.com;

  # Redirect HTTP to HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name app.example.com;

  # SSL certificates
  ssl_certificate /etc/letsencrypt/live/app.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;

  # Compression
  gzip on;
  gzip_types text/plain text/css text/javascript application/javascript;

  location / {
    proxy_pass http://nextjs;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # Static files cache
  location /_next/static {
    proxy_pass http://nextjs;
    proxy_cache_valid 200 60d;
    add_header Cache-Control "public, immutable";
  }

  location /public {
    alias /home/user/amutot/apps/web/public;
    expires 30d;
  }
}
```

**Enable SSL with Let's Encrypt**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d app.example.com
```

### Option 4: AWS (S3 + CloudFront)

**For Static Export** (if needed)
```bash
# Add to next.config.js:
# output: 'export'

pnpm build

# Upload to S3
aws s3 sync out/ s3://my-bucket/

# Configure CloudFront distribution
# Set Origin to S3 bucket
# Set default root object to index.html
# Set error pages (404 -> index.html for SPA routing)
```

**For App Runner** (recommended)
```bash
# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

docker tag amutot-web:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/amutot-web:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/amutot-web:latest

# Create App Runner service in AWS Console
# Source: ECR image
# Environment: Set NEXT_PUBLIC_API_URL
# Auto-deploy on image push
```

## Environment Variables

### Required
```
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
```

### Optional
```
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_GA_ID=UA-XXXXXXXXX-X
NODE_ENV=production
```

## Performance Optimization

### Image Optimization
```bash
# Use next/image for all images
# Automatic webp conversion & responsive sizing
```

### Code Splitting
- App Router automatically splits code per route
- Client-only components use `'use client'`
- Dynamic imports for heavy components:
```typescript
const CsvImporter = dynamic(() => import('./_components/CsvImporter'), {
  loading: () => <div>Loading...</div>
});
```

### Caching Strategy
```
1. Static pages: 30 days (CDN)
2. Next.js scripts: Immutable (never changes)
3. API responses: 5 minutes (TanStack Query staleTime)
4. Browser cache: 1 year for static assets
```

### Monitoring

**Application Monitoring**
```bash
# Use Sentry for error tracking
npm install @sentry/nextjs

# Configure in next.config.js
```

**Analytics**
- Add NEXT_PUBLIC_GA_ID for Google Analytics
- Monitor Core Web Vitals in Next.js Analytics
- Check build size with `npm run build`

## Troubleshooting

### Issue: 401 Unauthorized
**Solution**: 
- Verify API URL is correct
- Check JWT token in localStorage
- Ensure refresh token endpoint is working

### Issue: CORS Error
**Solution**:
- Add your frontend domain to API CORS whitelist
- Example: `CORS_ORIGIN=https://app.example.com`

### Issue: Styles not loading
**Solution**:
- Check Tailwind CSS build: `pnpm build`
- Verify globals.css is imported in layout.tsx
- Clear `.next` folder: `rm -rf .next && pnpm build`

### Issue: Fonts not loading
**Solution**:
- Check Google Fonts URL in layout.tsx
- Verify network tab in DevTools
- Use system fonts as fallback if needed

## Continuous Deployment (CI/CD)

### GitHub Actions Example
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm build
      
      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          production: true
```

## Security Checklist

- [ ] HTTPS/SSL enabled
- [ ] Security headers configured (Nginx/CDN):
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Strict-Transport-Security: max-age=31536000`

- [ ] API CORS whitelist set correctly
- [ ] JWT secrets strong (32+ chars)
- [ ] No sensitive data in env vars (use secrets)
- [ ] Rate limiting enabled on API
- [ ] Content Security Policy headers set
- [ ] CSRF protection enabled

## Health Check

```bash
# Test deployment
curl https://app.example.com/
# Should return 200 with HTML

curl https://app.example.com/api/health
# Should return { status: "ok" }
```

## Rollback Procedure

### Vercel
```bash
vercel rollback
```

### Docker/Server
```bash
# Previous image version
docker run -p 3000:3000 amutot-web:v1.0.0

# Or revert git commit
git revert <commit-hash>
git push
# Then rebuild and restart
```

## Maintenance

### Regular Tasks
- [ ] Weekly: Check error logs
- [ ] Monthly: Update dependencies
- [ ] Quarterly: Security audit
- [ ] Yearly: Performance review

### Update Dependencies
```bash
pnpm outdated
pnpm update

# Or for major versions
pnpm add next@latest react@latest
```

### Monitor Bundle Size
```bash
npm run build
# Check .next/static/chunks size
# Keep below 1MB total gzipped
```

---

**Last Updated**: April 2024  
**Framework**: Next.js 14.0+  
**Node Version**: 20.0+
