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

// Auto-detect environment and configure API URL
// For Vercel: Use relative /api path
// For local development: Use localhost:3000
// For network access: Use local IP address
const isVercelDeployment = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

let API_BASE_URL: string;
let BACKEND_BASE_URL: string;

if (isVercelDeployment) {
  // Vercel deployment: use relative API routes
  API_BASE_URL = '/api';
  BACKEND_BASE_URL = '';
} else if (isLocalhost || typeof window === 'undefined') {
  // Local development
  API_BASE_URL = 'http://localhost:3000/api';
  BACKEND_BASE_URL = 'http://localhost:3000';
} else {
  // Network access: use current hostname
  const BACKEND_HOST = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const BACKEND_PORT = '3000';
  API_BASE_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}/api`;
  BACKEND_BASE_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;
}

export { API_BASE_URL, BACKEND_BASE_URL };

// Helper to get full backend URL for assets
export function getBackendUrl(path: string): string {
  if (path.startsWith('http')) {
    return path;
  }
  return `${BACKEND_BASE_URL}${path}`;
}
