#!/bin/bash

# Vercel Deployment Checklist
# Run this script to verify your Vercel configuration

echo "🔍 POS System Vercel Deployment Checklist"
echo "=========================================="
echo ""

# Check 1: Git repository
echo "✓ Checking Git repository..."
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "  ✅ Git repository initialized"
else
    echo "  ❌ Not a git repository - run 'git init'"
fi

# Check 2: Required files
echo ""
echo "✓ Checking required files..."
files=("vercel.json" ".env.example" "VERCEL_DEPLOYMENT.md" "package.json" "server/package.json")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file exists"
    else
        echo "  ❌ $file missing"
    fi
done

# Check 3: API directory
echo ""
echo "✓ Checking API structure..."
if [ -d "api" ]; then
    echo "  ✅ api/ directory exists"
    if [ -f "api/index.ts" ]; then
        echo "  ✅ api/index.ts exists"
    else
        echo "  ❌ api/index.ts missing"
    fi
else
    echo "  ❌ api/ directory missing"
fi

# Check 4: Dependencies
echo ""
echo "✓ Checking dependencies..."
if [ -f "node_modules/.bin/vite" ]; then
    echo "  ✅ Frontend dependencies installed"
else
    echo "  ⚠️  Frontend dependencies not installed - run 'npm install'"
fi

if [ -f "server/node_modules/.bin/nest" ]; then
    echo "  ✅ Backend dependencies installed"
else
    echo "  ⚠️  Backend dependencies not installed - run 'cd server && npm install'"
fi

# Check 5: Build configuration
echo ""
echo "✓ Checking build configuration..."
if grep -q '"buildCommand"' vercel.json; then
    echo "  ✅ Build command configured in vercel.json"
else
    echo "  ❌ Build command missing in vercel.json"
fi

if grep -q '"outputDirectory"' vercel.json; then
    echo "  ✅ Output directory configured in vercel.json"
else
    echo "  ❌ Output directory missing in vercel.json"
fi

# Check 6: Environment variables
echo ""
echo "✓ Environment variables needed in Vercel Dashboard:"
echo "  - JWT_SECRET (required)"
echo "  - CORS_ORIGIN (required)"
echo "  - NODE_ENV (optional, default: production)"
echo "  - DATABASE_TYPE (optional, for PostgreSQL)"
echo "  - DB_HOST (optional, for PostgreSQL)"
echo "  - DB_PORT (optional, for PostgreSQL)"
echo "  - DB_USER (optional, for PostgreSQL)"
echo "  - DB_PASSWORD (optional, for PostgreSQL)"
echo "  - DB_NAME (optional, for PostgreSQL)"

# Check 7: Package.json scripts
echo ""
echo "✓ Checking package.json scripts..."
scripts=("build" "build:vercel" "dev")
for script in "${scripts[@]}"; do
    if grep -q "\"$script\"" package.json; then
        echo "  ✅ Script '$script' defined"
    else
        echo "  ❌ Script '$script' missing"
    fi
done

echo ""
echo "=========================================="
echo "🚀 Ready to deploy to Vercel!"
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git add . && git commit -m 'feat: Vercel deployment' && git push"
echo "2. Go to https://vercel.com/new"
echo "3. Import your repository"
echo "4. Add environment variables"
echo "5. Click Deploy!"
echo ""
