/**
 * API Configuration
 * 
 * To access the backend from other devices on the same network:
 * 1. Find your computer's local IP address:
 *    - Windows: Run 'ipconfig' in Command Prompt, look for IPv4 Address
 *    - Mac/Linux: Run 'ifconfig' or 'ip addr', look for inet address
 * 2. Update BACKEND_HOST below with your IP (e.g., '192.168.1.100')
 * 3. Restart both frontend and backend servers
 * 
 * Example: If your IP is 192.168.1.100
 * const BACKEND_HOST = '192.168.1.100';
 */

// Change this to your computer's local IP address to access from other devices
// Use 'localhost' for local development only
const BACKEND_HOST = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
  ? window.location.hostname 
  : 'localhost';

const BACKEND_PORT = '3000';

export const API_BASE_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}/api`;
export const BACKEND_BASE_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;

// Helper to get full backend URL for assets
export function getBackendUrl(path: string): string {
  if (path.startsWith('http')) {
    return path;
  }
  return `${BACKEND_BASE_URL}${path}`;
}
