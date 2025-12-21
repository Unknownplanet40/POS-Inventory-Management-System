# Session Detection Testing Guide

## How to Test Multi-Browser Session Detection

### Test Steps:

1. **Browser 1 - Login:**
   - Open the app in Chrome: `http://localhost:5173`
   - Login with your credentials
   - Keep the browser open

2. **Browser 2 - Login (Same User):**
   - Open the app in Firefox or Incognito mode: `http://localhost:5173`
   - Login with the SAME credentials
   - This will invalidate Browser 1's session

3. **Browser 1 - Verify Detection:**
   - Wait 30 seconds (or refresh the page)
   - You should see a toast message: "You have been logged in from another device"
   - You'll be automatically logged out

4. **Browser 2 - Still Active:**
   - Browser 2 remains logged in
   - Browser 2 is now the active session

### Manual Test (Browser Console):

**In Browser 1 (after logging in from Browser 2):**
```javascript
// Check current token
const session = JSON.parse(localStorage.getItem('pos-session'));
console.log('My token:', session.token.substring(0, 30));

// Manually validate session
fetch('http://localhost:3000/api/auth/validate-session', {
  headers: { 'Authorization': `Bearer ${session.token}` }
}).then(r => r.json()).then(d => console.log('Valid:', d.valid));
// Should return: { valid: false }
```

**In Browser 2 (the new login):**
```javascript
// Check current token
const session = JSON.parse(localStorage.getItem('pos-session'));
console.log('My token:', session.token.substring(0, 30));

// Manually validate session
fetch('http://localhost:3000/api/auth/validate-session', {
  headers: { 'Authorization': `Bearer ${session.token}` }
}).then(r => r.json()).then(d => console.log('Valid:', d.valid));
// Should return: { valid: true }
```

### Backend Logs:

Watch the backend terminal for logs:
```
[LOGIN] User admin logged in. Token: eyJhbGciOiJIUzI1NiIs...
[SESSION] Token mismatch for user admin
  Stored: eyJhbGciOiJIUzI1NiIs... (new token)
  Provided: eyJhbGciOiJIUzI1Ni... (old token)
[SESSION] Valid session for user admin
```

### Features:

✅ **Automatic Check** - Every 30 seconds while logged in
✅ **Toast Notification** - Shows "Session Expired" message
✅ **Auto Logout** - Logs out and clears token
✅ **Backend Validation** - Server tracks active session token
✅ **Works with Incognito** - Detects even in private browsing

### Troubleshooting:

**If not detecting:**
1. Check backend is running: `http://localhost:3000`
2. Check browser console for errors (F12)
3. Check backend logs for session validation
4. Wait 30 seconds after second login
5. Try refreshing Browser 1

**Backend Schema:**
- User table has `activeSessionToken` and `lastLoginAt` columns
- TypeORM auto-creates these with `synchronize: true`

### Test Scenarios:

1. **Same user, different browsers** ✅ Works
2. **Same user, incognito mode** ✅ Works
3. **Same user, different devices** ✅ Works
4. **Different users** ✅ No conflict (each has own token)
5. **Multiple tabs, same browser** ✅ Same token (no conflict)

### API Endpoints:

- `POST /api/auth/login` - Creates session, stores token
- `GET /api/auth/validate-session` - Checks if token matches stored
- `POST /api/auth/logout` - Clears stored token
