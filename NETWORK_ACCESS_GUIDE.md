# Network Access Guide

This guide explains how to access your POS system from other devices on the same network (phones, tablets, other computers).

## Quick Setup

### 1. Find Your Computer's Local IP Address

#### On Windows:
```bash
ipconfig
```
Look for **IPv4 Address** under your active network adapter (usually something like `192.168.1.100` or `10.0.0.5`)

#### On Mac/Linux:
```bash
ifconfig
# or
ip addr
```
Look for **inet** address (usually starts with 192.168 or 10.0)

### 2. Start the Backend Server

The backend is already configured to accept connections from all network interfaces.

```bash
cd server
npm run start:dev
```

The backend will listen on `http://0.0.0.0:3000`, making it accessible from any device on your network.

### 3. Start the Frontend

The frontend is configured to listen on all network interfaces.

```bash
npm run dev
```

The frontend will be available at `http://[YOUR-IP]:8080`

### 4. Access from Other Devices

On your phone, tablet, or another computer on the same network:

1. Open a web browser
2. Navigate to: `http://[YOUR-IP]:8080`
   
   Example: If your IP is `192.168.1.100`, visit:
   ```
   http://192.168.1.100:8080
   ```

## How It Works

The system automatically detects the hostname you're using and configures the API endpoints accordingly:

- **On localhost**: Uses `http://localhost:3000` for backend
- **On network IP**: Uses `http://[YOUR-IP]:3000` for backend

This is configured in `src/config/api.config.ts`.

## Firewall Configuration

If you can't connect from other devices, you may need to allow the ports through your firewall:

### Windows Firewall

1. Open **Windows Defender Firewall**
2. Click **Advanced settings**
3. Click **Inbound Rules** → **New Rule**
4. Select **Port** → **Next**
5. Enter ports: `3000, 8080` → **Next**
6. Select **Allow the connection** → **Next**
7. Apply to all networks → **Next**
8. Name it "POS System" → **Finish**

### macOS Firewall

```bash
# Allow Node.js to accept incoming connections
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
```

## Security Considerations

⚠️ **Important**: This configuration allows access from any device on your local network.

For production or public networks:

1. **Update CORS settings** in `server/src/main.ts` to restrict origins
2. **Use HTTPS** with SSL certificates
3. **Implement proper authentication** and rate limiting
4. **Use environment variables** for sensitive configuration

## Troubleshooting

### Can't connect from other devices?

1. **Verify your IP address** hasn't changed (some routers use DHCP)
2. **Check firewall** settings on the host computer
3. **Ensure both devices** are on the same network (not guest network)
4. **Try pinging** the host computer from the device:
   ```bash
   ping [YOUR-IP]
   ```

### Backend shows as offline?

1. **Check backend is running** on port 3000
2. **Verify the URL** in browser matches your IP
3. **Check browser console** for any CORS errors

### Images not loading?

The system automatically resolves image URLs based on the hostname. If images don't load:

1. Clear browser cache
2. Check the backend is accessible at `http://[YOUR-IP]:3000`
3. Verify product images are in the `server/product image/` directory

## Development vs Production

### Development (Current Setup)
- Backend: `http://0.0.0.0:3000`
- Frontend: `http://[YOUR-IP]:8080`
- Auto-detects hostname for API calls

### Production Recommendations
- Use a reverse proxy (nginx/Apache)
- Implement SSL/TLS (HTTPS)
- Use environment variables for configuration
- Set specific CORS origins
- Use a static IP or domain name

## Configuration Files

Key files for network configuration:

- `src/config/api.config.ts` - Frontend API configuration
- `server/src/main.ts` - Backend CORS and binding
- `vite.config.ts` - Frontend server configuration

## Need Help?

If you encounter issues:

1. Check the browser console for errors
2. Check the backend terminal for connection logs
3. Verify both frontend and backend are running
4. Ensure firewall isn't blocking connections
