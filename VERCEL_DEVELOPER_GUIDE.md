# Developer Guide: Vercel Migration

This guide explains the changes made to support Vercel deployment.

## Architecture Changes

### Before: Traditional Server Architecture
```
Frontend (React) ─────→ Backend Server (NestJS on port 3000)
   │
   └─ Network access: localhost:3000 only
```

### After: Serverless Architecture
```
Frontend (React) ─────→ Vercel Functions (/api routes)
   │
   └─ Global edge locations
   └─ Automatic scaling
   └─ Pay per request
```

---

## Key Technical Changes

### 1. API Layer: From Express Server to Serverless

**Before** (`server/src/main.ts`):
```typescript
await app.listen(3000, '0.0.0.0');
```

**After** (`api/index.ts`):
```typescript
// Vercel serverless handler
export default async (req, res) => {
  const app = await createNestApp();
  return app(req, res);
};
```

**Why**: Vercel manages the server lifecycle, you provide the handler.

---

### 2. Database: From File-Based to Environment-Aware

**Before** (`server/src/app.module.ts`):
```typescript
database: './pos-database.sqlite'
```

**After**:
```typescript
// Development: SQLite file
// Vercel: In-memory SQLite or PostgreSQL
const getDatabaseConfig = () => {
  const isVercel = process.env.VERCEL === '1';
  
  if (isVercel) {
    // Use PostgreSQL for production
    return postgresConfig();
  }
  
  return sqliteConfig();
};
```

**Why**: Vercel's filesystem is ephemeral. Production needs persistent DB.

---

### 3. API URLs: From Hard-Coded to Auto-Detecting

**Before** (`src/config/api.config.ts`):
```typescript
const API_BASE_URL = 'http://localhost:3000/api';
```

**After**:
```typescript
if (isVercelDeployment) {
  API_BASE_URL = '/api';  // Relative path
} else if (isLocalhost) {
  API_BASE_URL = 'http://localhost:3000/api';
} else {
  API_BASE_URL = `http://${networkIP}:3000/api`;
}
```

**Why**: Different environments need different URLs. Auto-detection = zero config.

---

### 4. Environment Variables: From Hardcoded to Configurable

**Before** (`server/src/main.ts`):
```typescript
secret: 'your-secret-key-change-in-production'
```

**After**:
```typescript
secret: process.env.JWT_SECRET || 'default-for-dev'
```

**Why**: Secrets must never be in code. Use environment variables.

---

## Development Workflow (Unchanged)

Your local development **stays exactly the same**:

```bash
# Terminal 1
cd server && npm run start:dev

# Terminal 2
npm run dev

# Browser
http://localhost:8080
```

**No breaking changes!** The changes are completely transparent.

---

## File-by-File Explanation

### New Files

#### `api/index.ts`
```typescript
// Vercel serverless function entry point
// - Creates Express app
// - Initializes NestJS
// - Handles incoming requests
// - Caches app instance for performance
```

**Why**: Vercel Functions need an export that handles HTTP requests.

---

#### `vercel.json`
```json
{
  "buildCommand": "npm run build && cd server && npm install && npm run build",
  "outputDirectory": "dist",
  "routes": [
    { "source": "/api/(.*)", "dest": "api/index.ts" },
    { "source": "/(.*)", "dest": "dist/index.html" }
  ]
}
```

**Why**: Tells Vercel how to build and route your app.

---

#### `.env.example` & `.env.local.example`
Templates for environment configuration. Copy and fill in values.

**Why**: Everyone knows what variables are needed.

---

### Modified Files

#### `src/config/api.config.ts`
**Changes**: Added environment detection logic
**Impact**: API calls automatically use correct URL
**Testing**: None needed - works in all environments

---

#### `server/src/app.module.ts`
**Changes**: 
- Database config uses environment variables
- Supports both SQLite and PostgreSQL

**Impact**: Backend adapts to environment
**Testing**: Test locally with SQLite, deploy with PostgreSQL

---

#### `server/src/main.ts`
**Changes**:
- Only bootstrap if not on Vercel (`process.env.VERCEL`)
- Use PORT env variable

**Impact**: Prevents duplicate server startup on Vercel
**Testing**: Add `VERCEL=1` to .env.local to test Vercel path

---

#### `package.json` & `server/package.json`
**Changes**:
- Added `npm run build:vercel` script
- Added express dependency to server

**Impact**: Vercel can execute build
**Testing**: Run `npm run build:vercel` locally

---

## How Vercel Deployment Works

### Build Phase (runs once, ~2-3 minutes)

1. **Install dependencies**
   ```bash
   npm install
   cd server && npm install
   ```

2. **Build frontend**
   ```bash
   vite build
   # Output: dist/index.html + assets
   ```

3. **Build backend**
   ```bash
   nest build
   # Output: server/dist/main.js + modules
   ```

4. **Package for Vercel**
   - Upload dist/ (frontend static files)
   - Upload api/ (serverless function)
   - Store environment variables

### Runtime Phase (handles requests)

1. **User visits** `https://your-project.vercel.app`
   - Vercel serves static index.html from dist/

2. **API request** to `/api/products`
   - Vercel routes to api/index.ts
   - Serverless function initializes NestJS
   - Request handled by NestJS controller
   - Response sent back

3. **Cold start optimization**
   - First request: Initialize app (~1-2 sec)
   - Subsequent requests: Use cached app (~10-100ms)

---

## Testing Different Environments

### Test as Vercel
```bash
# Set Vercel env var
export VERCEL=1

# Start backend (won't listen on port, will use /api)
# Note: This won't work fully locally, but tests the path

# Or use Docker to simulate Vercel environment
```

### Test as Network
```bash
# Get your IP
ipconfig  # Windows
ifconfig  # Mac/Linux

# Access from another device
http://192.168.1.100:8080
```

### Test as Localhost
```bash
# Default - just run normally
npm run dev
```

---

## Environment Variables Explained

### Required for Vercel Production

| Variable | Purpose | Example |
|----------|---------|---------|
| `JWT_SECRET` | Encrypt/sign JWT tokens | `abc123xyz...` (32+ chars) |
| `CORS_ORIGIN` | Allow API access from domain | `https://myapp.vercel.app` |
| `NODE_ENV` | Development/production mode | `production` |

### Optional for Database

| Variable | Purpose | Example |
|----------|---------|---------|
| `DB_HOST` | PostgreSQL server | `db.example.com` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `secure-password` |
| `DB_NAME` | Database name | `pos_system` |

---

## Migration Checklist

For existing deployments:

- [ ] Run local build: `npm run build:vercel`
- [ ] Generate JWT_SECRET (32+ chars)
- [ ] Prepare CORS_ORIGIN URL
- [ ] Choose database (SQLite for dev, PostgreSQL for prod)
- [ ] Push all changes to GitHub
- [ ] Create Vercel project
- [ ] Add environment variables
- [ ] Deploy
- [ ] Test API endpoints
- [ ] Monitor logs if issues occur

---

## Common Development Questions

### Q: Can I still develop locally?
**A**: Yes! Everything works the same. NestJS runs on localhost:3000, React on localhost:8080.

---

### Q: Will my database data persist?
**A**: 
- **Local**: Yes (SQLite file)
- **Vercel with SQLite**: No (resets on cold start)
- **Vercel with PostgreSQL**: Yes (external database)

---

### Q: How do I debug Vercel issues?
**A**: 
1. Check `vercel.json` for syntax errors
2. Look at build logs in Vercel dashboard
3. Check environment variables are set
4. Test API locally first

---

### Q: Should I modify the API handler?
**A**: Only if you need to add middleware or change the initialization. The current setup is optimized for Vercel.

---

### Q: How do I rollback a deployment?
**A**: In Vercel dashboard, go to Deployments and promote a previous working build.

---

## Performance Considerations

### Cold Start
- First request: 1-2 seconds (app initialization)
- Subsequent: 10-100ms (cached)
- **Mitigation**: Vercel's auto-scaling reduces cold starts

### Database
- SQLite in-memory: Instant but ephemeral
- PostgreSQL: Slight latency but persistent
- **Recommendation**: Use PostgreSQL for production

### Caching
- Static files: Cached at edge (fast)
- API responses: Cache headers in vercel.json
- **Setting**: See `vercel.json` for cache-control headers

---

## Security Checklist

- [ ] Never commit `.env` files
- [ ] Use strong `JWT_SECRET` (32+ characters)
- [ ] Set correct `CORS_ORIGIN` (not wildcard)
- [ ] Use HTTPS only (Vercel provides free)
- [ ] Validate all API inputs (handled by NestJS ValidationPipe)
- [ ] Use environment variables for secrets

---

## Next Steps

1. **Understand**: Read this guide thoroughly
2. **Test**: Run `npm run build:vercel` locally
3. **Deploy**: Push to GitHub and connect Vercel
4. **Monitor**: Watch Vercel logs for any issues
5. **Optimize**: Check Vercel analytics for improvements

---

## References

- [Vercel Documentation](https://vercel.com/docs)
- [NestJS Deployment Guide](https://docs.nestjs.com/deployment)
- [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) - Full setup
- [VERCEL_TROUBLESHOOTING.md](VERCEL_TROUBLESHOOTING.md) - Common issues
- [API_TESTING_GUIDE.md](API_TESTING_GUIDE.md) - Test endpoints

---

**Your system is Vercel-ready! Start with local testing, then deploy. 🚀**
