import { authAPI, setAuthToken as setAPIToken, clearAuthToken } from './api';

const SESSION_KEY = 'pos-session';

// Initialize auth token from localStorage on module load
function initializeAuthToken() {
  const sessionData = localStorage.getItem(SESSION_KEY);
  if (sessionData) {
    try {
      const session = JSON.parse(sessionData) as { token?: string };
      if (session.token) {
        setAPIToken(session.token);
      }
    } catch {
      // Invalid session data
    }
  }
}

// Call on module load
initializeAuthToken();

export interface Session {
  userId: string;
  username: string;
  role: 'admin' | 'cashier';
  loginAt: string;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'cashier';
  createdAt: Date;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export async function registerUser(
  username: string,
  password: string,
  role: 'admin' | 'cashier'
): Promise<User> {
  try {
    const user = await authAPI.register(username, password, role);
    return {
      ...user,
      createdAt: new Date(user.createdAt),
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to register user');
  }
}

export async function login(username: string, password: string): Promise<Session> {
  try {
    const response = await authAPI.login(username, password);
    const session = response.user;
    setAPIToken(response.token);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, token: response.token }));
    return session;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Login failed');
  }
}

export async function logout(): Promise<void> {
  try {
    // Call backend to invalidate session
    const token = localStorage.getItem(SESSION_KEY);
    if (token) {
      const sessionData = JSON.parse(token);
      if (sessionData.token) {
        await fetch('http://localhost:3000/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionData.token}`,
          },
        }).catch(() => {
          // Ignore errors, still logout locally
        });
      }
    }
  } catch {
    // Ignore errors
  } finally {
    localStorage.removeItem(SESSION_KEY);
    clearAuthToken();
  }
}

export function getSession(): Session | null {
  const sessionData = localStorage.getItem(SESSION_KEY);
  if (!sessionData) return null;
  
  try {
    const session = JSON.parse(sessionData) as Session & { token?: string };
    // Always restore the token when getting session
    if (session.token) {
      setAPIToken(session.token);
    }
    return {
      userId: session.userId,
      username: session.username,
      role: session.role,
      loginAt: session.loginAt,
    };
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

export function isAdmin(): boolean {
  const session = getSession();
  return session?.role === 'admin';
}
