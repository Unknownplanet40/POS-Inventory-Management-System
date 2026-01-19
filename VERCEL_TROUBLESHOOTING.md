# Vercel Deployment - Common Issues & Solutions

## Build Issues

### ❌ "Build failed: Cannot find module @nestjs/core"

**Cause**: Dependencies not installed  
**Solution**:
```bash
cd server
npm install
cd ..
npm install
```

Then push to GitHub. Vercel will install during build.

---

### ❌ "Error: Cannot find dist/index.html"

**Cause**: Frontend didn't build  
**Solution**:
```bash
npm install
npm run build
```

Check for errors in the build output. Must complete before Vercel build.

---

### ❌ "Timeout: Function execution timeout"

**Cause**: API taking too long to respond  
**Solution**:
1. Optimize database queries
2. Increase timeout in `vercel.json` (set `maxDuration` higher)
3. For PostgreSQL: Check database performance
4. Consider caching frequently-used data

---

## Runtime Issues

### ❌ API returns 404 on /api routes

**Cause**: Vercel routing misconfigured  
**Solution**:
1. Verify `vercel.json` has correct routes
2. Check `api/index.ts` exists
3. Redeploy: `vercel --prod`

**Debug**:
```bash
curl https://your-project.vercel.app/api/auth/login
```

---

### ❌ "CORS error" - Frontend can't reach API

**Cause**: `CORS_ORIGIN` not set correctly  
**Solution**:

1. Go to Vercel Dashboard → Environment Variables
2. Verify `CORS_ORIGIN` is set to: `https://your-project.vercel.app`
3. NOT `http://` (must be `https://`)
4. Redeploy after changing

**Check in browser console**:
```javascript
// Should work:
fetch('/api/auth/login', {...})

// Should NOT work:
fetch('http://localhost:3000/api/auth/login', {...})
```

---

### ❌ "Cannot GET /api/products" (401 Unauthorized)

**Cause**: JWT authentication failing  
**Solution**:

1. Check `JWT_SECRET` is set in Vercel env vars
2. Ensure token is sent in request header:
```javascript
fetch('/api/products', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

---

## Database Issues

### ❌ "Database connection refused"

**Cause**: SQLite (default) is in-memory (data is lost)  
**Solution**:

For production, use PostgreSQL:
1. Create database (Neon, Supabase, Vercel Postgres)
2. Add env vars: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
3. Update `server/src/app.module.ts` to use PostgreSQL
4. Redeploy

**Temporary fix** (testing only):
```bash
# Keep using in-memory SQLite (data will reset)
# This is expected behavior on Vercel
```

---

### ❌ "EACCES: permission denied, open './pos-database.sqlite'"

**Cause**: Trying to write SQLite file (not allowed on Vercel)  
**Solution**:

Vercel filesystem is read-only. Must use:
1. PostgreSQL (recommended)
2. Vercel KV/Redis for session data
3. Accept that data resets on cold start (for testing)

---

### ❌ "typeorm: Cannot find migrations"

**Cause**: Migrations not included in build  
**Solution**:

Add to `server/package.json`:
```json
"nest build": "nest build",
```

Ensure migrations are included in compiled output.

---

## Frontend Issues

### ❌ "Blank page" or "Cannot GET /"

**Cause**: Frontend not built or not served  
**Solution**:
1. Check `npm run build` completed
2. Verify `dist/index.html` exists
3. Check `vercel.json` routes are correct

```bash
npm run build
ls -la dist/  # Should show index.html
```

---

### ❌ "API calls work locally but fail on Vercel"

**Cause**: Hard-coded API URL  
**Solution**:

Check `src/config/api.config.ts`:
```typescript
// ❌ Wrong - hard-coded URL
export const API_BASE_URL = 'http://localhost:3000/api';

// ✅ Correct - auto-detects
const isVercel = window.location.hostname.includes('vercel.app');
const API_BASE_URL = isVercel ? '/api' : 'http://localhost:3000/api';
```

The file is already updated, but check your API calls use this config.

---

### ❌ "Cannot find CSS or assets"

**Cause**: Build didn't include assets  
**Solution**:
1. Verify assets in `src/` directory
2. Check build output: `ls dist/`
3. Rebuild: `npm run build`

---

## Environment Variable Issues

### ❌ "Error: JWT_SECRET is undefined"

**Cause**: Environment variable not set  
**Solution**:

1. Vercel Dashboard → Settings → Environment Variables
2. Add: `JWT_SECRET=your-value`
3. Redeploy
4. Check it's not in `.env` file (use dashboard only)

---

### ❌ "CORS error - origin check failed"

**Cause**: `CORS_ORIGIN` missing or wrong  
**Solution**:

1. Set in Vercel: `CORS_ORIGIN=https://your-vercel-url.vercel.app`
2. Not: `http://` or `localhost`
3. Must match deployed URL exactly
4. Redeploy after setting

**Test**:
```bash
# From browser console:
fetch('/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({username: 'test', password: 'test'})
})
.then(r => r.json())
.catch(e => console.error('CORS error:', e))
```

---

## Deployment Issues

### ❌ "Deployment keeps failing"

**Debug steps**:
1. Check Vercel logs: Click deployment → Logs
2. Look for error messages
3. Common causes:
   - Missing environment variables
   - npm install failures
   - Build script errors
   - Git branch issues

---

### ❌ "Changes aren't showing up"

**Cause**: Vercel cached old deployment  
**Solution**:
1. Go to Vercel → Deployments
2. Click latest deployment → three dots
3. Select "Promote to Production"
4. Or force redeploy: `git push origin main`

---

### ❌ "Can't connect to Vercel"

**Cause**: GitHub auth issue  
**Solution**:
1. Go to Vercel → Settings → Git
2. Disconnect GitHub
3. Reconnect and authorize
4. Try deploying again

---

## Performance Issues

### ⚠️ API is slow (>1 second response)

**Causes & Solutions**:
1. **Cold start**: First request is slower (expected, 1-2 sec)
   - Solution: Set up Vercel monitoring to reduce cold starts
2. **Database slow**: Check queries
   - Solution: Add database indexes, optimize queries
3. **Large payload**: Returning too much data
   - Solution: Paginate results, use projection

**Monitor**:
- Vercel Dashboard → Monitoring
- Check function duration
- Check memory usage

---

### ⚠️ "Function timeout" (>30 seconds)

**Cause**: Request taking too long  
**Solution**:

For long operations:
1. Move to background job
2. Return job ID immediately
3. Poll for results

Or increase timeout in `vercel.json`:
```json
"functions": {
  "api/**/*.ts": {
    "maxDuration": 60
  }
}
```

---

## Local Testing Issues

### ❌ "Environment variables not loading"

**Cause**: Wrong file used  
**Solution**:

For Vercel testing use `.env.local`:
```bash
# Create from template
cp .env.local.example .env.local

# Edit with your values
JWT_SECRET=test-key
CORS_ORIGIN=http://localhost:8080
```

Don't commit `.env.local` to Git!

---

### ❌ "vercel.json has syntax error"

**Cause**: Invalid JSON  
**Solution**:
1. Check `vercel.json` for trailing commas
2. Validate JSON: `cat vercel.json | jq .`
3. Use VS Code JSON validation

---

## Getting Help

### Check These First:
1. **Vercel Logs**: Deployment → Logs (most useful)
2. **VERCEL_DEPLOYMENT.md**: Detailed guide in repo
3. **API_TESTING_GUIDE.md**: Test endpoints locally
4. **Browser Console**: Look for 404, CORS, or fetch errors

### Debug Commands:

```bash
# Test API locally
curl http://localhost:3000/api/health

# Check environment
echo $JWT_SECRET

# Build test
npm run build

# Dependency check
npm ls @nestjs/core

# Vercel CLI
vercel logs <function-name>
vercel env ls
```

### Common Error Messages:

| Error | Meaning | Solution |
|-------|---------|----------|
| `Cannot find module` | Missing package | Run `npm install` |
| `EACCES` | Permission denied | Use PostgreSQL, not SQLite |
| `CORS error` | Origin blocked | Set `CORS_ORIGIN` env var |
| `401 Unauthorized` | Bad JWT | Verify `JWT_SECRET` |
| `404 Not Found` | Route doesn't exist | Check route in code |
| `503 Service Unavailable` | Database down | Check connection string |

---

## Still Stuck?

1. **Check existing GitHub issues** for this project
2. **Review Vercel docs**: https://vercel.com/docs
3. **Contact Vercel support** for infrastructure issues
4. **Post debug info** when asking for help:
   - Deployment URL
   - Error message (full)
   - Vercel logs
   - Environment setup

---

**Remember**: Most issues are environment variables or database connectivity! 🔍
