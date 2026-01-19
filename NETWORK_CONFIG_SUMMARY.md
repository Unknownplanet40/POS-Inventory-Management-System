# Network Configuration Summary

## Changes Made

Your POS system has been successfully configured to be accessible from any device on your local network!

### Backend Changes

**File**: `server/src/main.ts`
- ✅ Changed backend to listen on `0.0.0.0:3000` (all network interfaces)
- ✅ Updated CORS to accept connections from any origin on local network
- ✅ Added health endpoint at `/api/health`

### Frontend Changes

**New File**: `src/config/api.config.ts`
- ✅ Created centralized API configuration
- ✅ Auto-detects hostname (localhost vs network IP)
- ✅ Provides helper functions for backend URLs

**Updated Files**:
- ✅ `src/lib/api.ts` - Uses centralized config
- ✅ `src/lib/auth.ts` - Uses dynamic backend URL
- ✅ `src/lib/utils.ts` - Uses dynamic backend URL
- ✅ `src/contexts/AuthContext.tsx` - Uses dynamic backend URL
- ✅ `src/hooks/use-session-monitor.ts` - Uses dynamic backend URL
- ✅ `src/components/BackendOffline.tsx` - Shows dynamic backend URL
- ✅ `src/components/pos/SetupWizard.tsx` - Uses dynamic backend URL
- ✅ `src/components/pos/ProductsPage.tsx` - Uses helper for image URLs
- ✅ `src/components/pos/CheckoutPage.tsx` - Uses helper for image URLs
- ✅ `src/components/pos/DashboardPage.tsx` - Uses helper for image URLs

### Helper Scripts

**Created Files**:
- ✅ `get-ip.bat` - Windows script to find your IP address
- ✅ `get-ip.sh` - Mac/Linux script to find your IP address
- ✅ `NETWORK_ACCESS_GUIDE.md` - Complete guide for network access

### Documentation Updates

- ✅ Updated `README.md` with network access instructions
- ✅ Created detailed network access guide

## How It Works

### Automatic Host Detection

The system now automatically detects which hostname is being used:

```typescript
const BACKEND_HOST = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
  ? window.location.hostname 
  : 'localhost';
```

- **When accessing via localhost**: Backend uses `http://localhost:3000`
- **When accessing via IP (e.g., 192.168.1.100)**: Backend uses `http://192.168.1.100:3000`

### Network Architecture

```
┌─────────────────────────────────────────┐
│         Your Computer (Host)            │
│  ┌────────────────────────────────────┐ │
│  │  Backend (NestJS)                  │ │
│  │  Port: 3000                        │ │
│  │  Binding: 0.0.0.0 (all interfaces) │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Frontend (Vite + React)           │ │
│  │  Port: 8080                        │ │
│  │  Binding: :: (all interfaces)      │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    │
                    │ Local Network
                    │
    ┌───────────────┼───────────────┐
    │               │               │
┌───▼───┐     ┌────▼────┐     ┌───▼───┐
│ Phone │     │ Tablet  │     │  PC   │
└───────┘     └─────────┘     └───────┘
```

## Quick Start

### 1. Find Your IP Address

**Windows**:
```bash
get-ip.bat
```

**Mac/Linux**:
```bash
chmod +x get-ip.sh
./get-ip.sh
```

### 2. Start Servers

```bash
# Terminal 1 - Backend
cd server
npm run start:dev

# Terminal 2 - Frontend
npm run dev
```

### 3. Access from Other Devices

Open browser on your phone/tablet:
```
http://[YOUR-IP]:8080
```

Example: `http://192.168.1.100:8080`

## Features

✅ **Automatic Backend Discovery** - Frontend auto-detects backend URL
✅ **Backend Health Monitoring** - Continuous connectivity checks
✅ **Offline Detection** - Shows offline page when backend is down
✅ **Auto-Reconnection** - Automatically reconnects when backend comes back
✅ **Image URL Resolution** - Product images load correctly from any device
✅ **Setup Wizard Integration** - Backend check included in initial setup
✅ **Cross-Device Sessions** - Login on one device, use on another

## Security Notes

⚠️ **Current Configuration**: Suitable for local network development

For production deployment:
- Use HTTPS with SSL certificates
- Restrict CORS to specific origins
- Implement rate limiting
- Use environment variables for sensitive config
- Consider using a reverse proxy (nginx/Apache)

## Troubleshooting

### Can't Access from Other Devices?

1. Check firewall settings (see [NETWORK_ACCESS_GUIDE.md](NETWORK_ACCESS_GUIDE.md))
2. Verify both devices are on the same network
3. Confirm both servers are running
4. Try pinging the host from the other device

### Backend Shows Offline?

1. Verify backend is running on port 3000
2. Check the backend URL in browser console
3. Ensure firewall allows port 3000

### Images Not Loading?

1. Clear browser cache
2. Check backend is accessible
3. Verify product images exist in `server/product image/`

## Testing

To test network access:

1. Start both servers on your computer
2. Find your IP address
3. On your phone, connect to the same WiFi
4. Open `http://[YOUR-IP]:8080` in your phone's browser
5. You should see the POS system loading!

## Configuration Files Reference

| File | Purpose |
|------|---------|
| `src/config/api.config.ts` | Central API configuration |
| `server/src/main.ts` | Backend server binding and CORS |
| `vite.config.ts` | Frontend server configuration |

## Support

For detailed setup instructions, see:
- [NETWORK_ACCESS_GUIDE.md](NETWORK_ACCESS_GUIDE.md) - Complete network setup guide
- [README.md](README.md) - General documentation
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Initial setup instructions
