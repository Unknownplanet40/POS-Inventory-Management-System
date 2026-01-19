# Vercel Deployment Guide

This guide will help you deploy the POS Inventory Management System to Vercel.

## Prerequisites

- A [Vercel account](https://vercel.com) (free tier works)
- [Git](https://git-scm.com) installed
- Your project pushed to GitHub, GitLab, or Bitbucket

## Deployment Steps

### 1. Connect Your Repository to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Connect your Git provider (GitHub, GitLab, or Bitbucket)
4. Select your POS-Inventory-Management-System repository
5. Click "Import"

### 2. Configure Build Settings

The `vercel.json` file is already configured for your project with:
- **Build Command**: `npm run build && cd server && npm install && npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install && cd server && npm install`

### 3. Set Environment Variables

In the Vercel dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables:

```
JWT_SECRET=your-super-secret-key-generate-a-strong-one
CORS_ORIGIN=https://your-vercel-url.vercel.app
NODE_ENV=production
```

### 4. Database Configuration

#### Option A: SQLite (Development - In-Memory)
The default configuration uses in-memory SQLite for Vercel. This is suitable for testing but data will be lost when the function cold-starts.

#### Option B: PostgreSQL (Recommended for Production)

For persistent data, use a PostgreSQL database. Vercel recommends:
- [Vercel Postgres](https://vercel.com/storage/postgres)
- [Neon](https://neon.tech)
- [Supabase](https://supabase.com)

**Steps to set up PostgreSQL:**

1. Create a PostgreSQL database (using your provider)
2. Add these environment variables to Vercel:

```
DATABASE_TYPE=postgres
DB_HOST=your-database-host
DB_PORT=5432
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=pos_system
```

3. Update `server/src/app.module.ts` to use PostgreSQL (uncomment the PostgreSQL configuration)

### 5. Deploy

1. Click **Deploy** on the Vercel dashboard
2. Wait for the build to complete (usually 2-3 minutes)
3. Your site will be live at `https://your-project-name.vercel.app`

## Local Testing Before Deployment

### Test the Build Locally

```bash
# Install all dependencies
npm run install:all

# Build the frontend
npm run build

# Build the backend
cd server
npm run build
cd ..
```

### Environment Variables for Local Vercel Testing

Create a `.env.local` file in the root:

```
JWT_SECRET=test-secret-key
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

## Accessing Your Application

After deployment:

1. **Frontend**: `https://your-project-name.vercel.app`
2. **API Endpoints**: `https://your-project-name.vercel.app/api`

## Troubleshooting

### Issue: Build Fails
- Check the build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify database configuration is correct

### Issue: API Routes Return 404
- Check that the `/api` directory exists
- Verify `vercel.json` rewrites are correct
- Check that backend builds successfully

### Issue: Database Connection Errors
- For SQLite: In-memory database is ephemeral (will reset)
- For PostgreSQL: Verify credentials in environment variables
- Check database is running and accessible

### Issue: CORS Errors
- Update `CORS_ORIGIN` environment variable to your Vercel URL
- Ensure frontend requests use relative paths or correct API URL

## API Routes

The API is served under `/api`:

- `POST /api/auth/login` - Login
- `GET /api/products` - Get products
- `POST /api/sales` - Create sale
- `GET /api/users` - Get users
- `GET /api/settings` - Get settings

## Performance Considerations

- Vercel Functions have a 10-second default timeout (configurable)
- Use environment variables for sensitive data
- Consider caching strategies for frequently accessed data
- Monitor cold start times in the Vercel dashboard

## Production Best Practices

1. **Use PostgreSQL** instead of SQLite for persistent data
2. **Generate strong JWT_SECRET** (minimum 32 characters)
3. **Set proper CORS_ORIGIN** to your domain only
4. **Enable Vercel Analytics** for monitoring
5. **Set up error logging** (e.g., Sentry)
6. **Use environment-specific settings** for production
7. **Keep dependencies updated** regularly

## Rollback

To rollback a deployment:

1. Go to Vercel dashboard
2. Go to **Deployments**
3. Find the previous working deployment
4. Click the three dots and select **Promote to Production**

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Postgres Guide](https://vercel.com/docs/storage/vercel-postgres)
- [NestJS on Serverless](https://docs.nestjs.com/deployment)

## Support

For issues or questions:
1. Check Vercel logs: `vercel logs <function-name>`
2. Review the application logs in Vercel dashboard
3. Check GitHub issues if there are known problems
4. Contact Vercel support for infrastructure issues
