export const RESTRICTED_STATES = [
  "telangana",
  "andhra pradesh",
  "assam",
  "odisha",
  "nagaland"
];

export function isStateRestricted(stateName: string): boolean {
  if (!stateName) return false;
  const normalized = stateName.toLowerCase().trim();
  return RESTRICTED_STATES.some(restricted => normalized.includes(restricted));
}

export function parseUserAgent(uaString: string | null): string {
  if (!uaString) return "Chrome / Windows 11";
  let os = "Unknown OS";
  let browser = "Unknown Browser";
  
  // Parse OS
  if (uaString.includes("Windows NT")) {
    os = "Windows 11";
  } else if (uaString.includes("Macintosh") || uaString.includes("Mac OS X")) {
    os = "macOS";
  } else if (uaString.includes("iPhone") || uaString.includes("iPad")) {
    os = "iOS";
  } else if (uaString.includes("Android")) {
    os = "Android";
  } else if (uaString.includes("Linux")) {
    os = "Linux";
  }
  
  // Parse Browser
  if (uaString.includes("Edg/")) {
    browser = "Edge";
  } else if (uaString.includes("Chrome") && !uaString.includes("Chromium")) {
    browser = "Chrome";
  } else if (uaString.includes("Safari") && !uaString.includes("Chrome")) {
    browser = "Safari";
  } else if (uaString.includes("Firefox")) {
    browser = "Firefox";
  }
  
  return `${browser} / ${os}`;
}

export function getClientIP(request: Request): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const parts = xForwardedFor.split(',');
    return parts[0].trim();
  }
  const xRealIP = request.headers.get('x-real-ip');
  if (xRealIP) {
    return xRealIP;
  }
  return '103.88.11.44'; // Default Indian IP for local development
}

export async function getIPLocation(ipAddress: string): Promise<{ state: string; countryCode: string }> {
  const defaultLocation = { state: "Maharashtra", countryCode: "IN" };
  
  // Local or test IP fallback
  if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
    // Return a random Indian city to make local testing dynamic and realistic
    const cities = ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Gujarat"];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    return { state: randomCity, countryCode: "IN" };
  }

  try {
    const res = await fetch(`https://ipapi.co/${ipAddress}/json/`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.region && data.country_code) {
        return {
          state: data.region,
          countryCode: data.country_code
        };
      }
    }
  } catch (e) {
    console.error("IP lookup failed, using fallback:", e);
  }
  
  return defaultLocation;
}
