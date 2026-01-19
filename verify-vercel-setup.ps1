# Vercel Deployment Checklist for Windows
# Run this script to verify your Vercel configuration

Write-Host "🔍 POS System Vercel Deployment Checklist" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check 1: Git repository
Write-Host "✓ Checking Git repository..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "  ✅ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "  ❌ Not a git repository - run 'git init'" -ForegroundColor Red
}

# Check 2: Required files
Write-Host ""
Write-Host "✓ Checking required files..." -ForegroundColor Yellow
$files = @("vercel.json", ".env.example", "VERCEL_DEPLOYMENT.md", "package.json", "server\package.json")
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file missing" -ForegroundColor Red
    }
}

# Check 3: API directory
Write-Host ""
Write-Host "✓ Checking API structure..." -ForegroundColor Yellow
if (Test-Path "api") {
    Write-Host "  ✅ api/ directory exists" -ForegroundColor Green
    if (Test-Path "api\index.ts") {
        Write-Host "  ✅ api/index.ts exists" -ForegroundColor Green
    } else {
        Write-Host "  ❌ api/index.ts missing" -ForegroundColor Red
    }
} else {
    Write-Host "  ❌ api/ directory missing" -ForegroundColor Red
}

# Check 4: Dependencies
Write-Host ""
Write-Host "✓ Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules\.bin\vite" -ErrorAction SilentlyContinue) {
    Write-Host "  ✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Frontend dependencies not installed - run 'npm install'" -ForegroundColor Yellow
}

if (Test-Path "server\node_modules\.bin\nest" -ErrorAction SilentlyContinue) {
    Write-Host "  ✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Backend dependencies not installed - run 'cd server && npm install'" -ForegroundColor Yellow
}

# Check 5: Build configuration
Write-Host ""
Write-Host "✓ Checking build configuration..." -ForegroundColor Yellow
$vercelJson = Get-Content "vercel.json" -ErrorAction SilentlyContinue | ConvertFrom-Json
if ($vercelJson.buildCommand) {
    Write-Host "  ✅ Build command configured" -ForegroundColor Green
} else {
    Write-Host "  ❌ Build command missing" -ForegroundColor Red
}

if ($vercelJson.outputDirectory) {
    Write-Host "  ✅ Output directory configured" -ForegroundColor Green
} else {
    Write-Host "  ❌ Output directory missing" -ForegroundColor Red
}

# Check 6: Environment variables
Write-Host ""
Write-Host "✓ Environment variables needed in Vercel Dashboard:" -ForegroundColor Yellow
Write-Host "  - JWT_SECRET (required)" -ForegroundColor Cyan
Write-Host "  - CORS_ORIGIN (required)" -ForegroundColor Cyan
Write-Host "  - NODE_ENV (optional, default: production)" -ForegroundColor Gray
Write-Host "  - DATABASE_TYPE (optional, for PostgreSQL)" -ForegroundColor Gray
Write-Host "  - DB_HOST (optional, for PostgreSQL)" -ForegroundColor Gray
Write-Host "  - DB_PORT (optional, for PostgreSQL)" -ForegroundColor Gray
Write-Host "  - DB_USER (optional, for PostgreSQL)" -ForegroundColor Gray
Write-Host "  - DB_PASSWORD (optional, for PostgreSQL)" -ForegroundColor Gray
Write-Host "  - DB_NAME (optional, for PostgreSQL)" -ForegroundColor Gray

# Check 7: Generate JWT Secret
Write-Host ""
Write-Host "🔐 Need a JWT Secret? Generate one:" -ForegroundColor Yellow
Write-Host "  [Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Minimum 0 -Maximum 256) }))" -ForegroundColor Cyan

# Check 8: Package.json scripts
Write-Host ""
Write-Host "✓ Checking package.json scripts..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" -ErrorAction SilentlyContinue | ConvertFrom-Json
$scripts = @("build", "build:vercel", "dev")
foreach ($script in $scripts) {
    if ($packageJson.scripts.$script) {
        Write-Host "  ✅ Script '$script' defined" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Script '$script' missing" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 Ready to deploy to Vercel!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Push to GitHub:" -ForegroundColor Yellow
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'feat: Vercel deployment'" -ForegroundColor Gray
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Go to https://vercel.com/new" -ForegroundColor Yellow
Write-Host "3. Import your repository" -ForegroundColor Yellow
Write-Host "4. Add environment variables (JWT_SECRET, CORS_ORIGIN)" -ForegroundColor Yellow
Write-Host "5. Click Deploy!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Questions? See VERCEL_DEPLOYMENT.md for detailed instructions" -ForegroundColor Gray
