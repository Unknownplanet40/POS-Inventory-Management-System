import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Resolve asset URLs (like /product-image/...) to the backend host in dev
// If the URL is already absolute (http, https, data:), return as-is.
// Otherwise, prefix with the backend origin (default http://localhost:3000).
export function resolveAssetUrl(url?: string): string | undefined {
  if (!url) return url;
  const lower = url.toLowerCase();
  if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('data:')) {
    return url;
  }
  const backendOrigin = 'http://localhost:3000';
  if (url.startsWith('/')) {
    return `${backendOrigin}${url}`;
  }
  return url;
}

// Convert image URL to base64 data URL for embedding in print documents
export async function imageToBase64(url?: string): Promise<string | undefined> {
  if (!url) return undefined;
  
  // If already a data URL, return as-is
  if (url.toLowerCase().startsWith('data:')) {
    return url;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        console.error('FileReader error');
        resolve(url); // Fallback to original URL
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to convert image to base64:', error);
    return url; // Fallback to original URL instead of undefined
  }
}
