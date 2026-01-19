# Quick Start: Deploy to Vercel

## 5-Minute Setup

### Step 1: Push to GitHub
```bash
git add .
git commit -m "feat: Add Vercel deployment support"
git push origin main
```

### Step 2: Connect Vercel
1. Go to https://vercel.com
2. Click "New Project"
3. Import your repository
4. Click "Continue"

### Step 3: Configure Environment Variables
In the Vercel dashboard, add these environment variables:

```
JWT_SECRET=generate-a-random-string-32-chars-or-more
CORS_ORIGIN=https://your-project.vercel.app
NODE_ENV=production
```

To generate a secure JWT secret:
```bash
# On Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Minimum 0 -Maximum 256) }))

# On Mac/Linux:
openssl rand -base64 32
```

### Step 4: Deploy
Click "Deploy" - that's it!

Your app will be live in 2-3 minutes at: `https://your-project-name.vercel.app`

---

## What Changed?

The system now supports Vercel deployment:

✅ Frontend (React/Vite) - Built and served as static files
✅ Backend (NestJS) - Runs as serverless functions at `/api`
✅ Auto-detection - API routes automatically adjust for Vercel
✅ Database - Configured for both SQLite (dev) and PostgreSQL (production)

## Environment-Aware Configuration

The system automatically detects whether it's running on:
- **Vercel** → Uses `/api` relative paths
- **Localhost** → Uses `http://localhost:3000/api`
- **Network** → Uses your local IP

No configuration needed!

## Database Options

### Development (SQLite)
- Data stored in-memory
- Perfect for testing
- Resets on cold start

### Production (PostgreSQL)
- Persistent data
- Scales better
- Requires external database

Set up PostgreSQL by:
1. Creating a database (Vercel Postgres, Neon, Supabase, etc.)
2. Adding DB environment variables to Vercel
3. Uncommenting PostgreSQL config in `server/src/app.module.ts`

## Testing Locally

```bash
# Install dependencies
npm run install:all

# Start frontend
npm run dev

# In another terminal, start backend
cd server && npm run start:dev

# Access at http://localhost:8080
```

## Next Steps

- See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for detailed setup
- Review [SETUP_GUIDE.md](SETUP_GUIDE.md) for local development
- Check the [API docs](API_TESTING_GUIDE.md) for endpoint information

## Support

Encountered issues? Check:
1. Vercel dashboard logs
2. Environment variables are set
3. Database is accessible
4. CORS_ORIGIN matches your Vercel URL
