export interface BrowserIdentity {
  browser: string;
  browserVersion: string;
  engine: string;
  os: string;
}

interface NavigatorUAData {
  brands?: { brand: string; version: string }[];
  platform?: string;
  mobile?: boolean;
}

function readUaData(): NavigatorUAData | undefined {
  return (navigator as Navigator & { userAgentData?: NavigatorUAData }).userAgentData;
}

/**
 * Best-effort browser / engine / OS detection from the user agent string.
 * There is no fully reliable API for this; we combine `userAgentData`
 * (Chromium) with UA sniffing heuristics as a fallback everywhere else.
 */
export function detectBrowserIdentity(): BrowserIdentity {
  const ua = navigator.userAgent;
  const uaData = readUaData();

  let browser = "Unknown";
  let browserVersion = "";
  let engine = "Unknown";

  const brand = uaData?.brands?.find(
    (b) => !/Not.A.Brand|Chromium/i.test(b.brand) || uaData.brands!.length === 1,
  );

  if (brand) {
    browser = brand.brand;
    browserVersion = brand.version;
  } else if (/Edg\//.test(ua)) {
    browser = "Edge";
    browserVersion = ua.match(/Edg\/([\d.]+)/)?.[1] ?? "";
  } else if (/OPR\//.test(ua)) {
    browser = "Opera";
    browserVersion = ua.match(/OPR\/([\d.]+)/)?.[1] ?? "";
  } else if (/Firefox\//.test(ua)) {
    browser = "Firefox";
    browserVersion = ua.match(/Firefox\/([\d.]+)/)?.[1] ?? "";
  } else if (/CriOS\//.test(ua)) {
    browser = "Chrome (iOS)";
    browserVersion = ua.match(/CriOS\/([\d.]+)/)?.[1] ?? "";
  } else if (/Chrome\//.test(ua)) {
    browser = "Chrome";
    browserVersion = ua.match(/Chrome\/([\d.]+)/)?.[1] ?? "";
  } else if (/Version\/.*Safari\//.test(ua)) {
    browser = "Safari";
    browserVersion = ua.match(/Version\/([\d.]+)/)?.[1] ?? "";
  } else if (/Safari\//.test(ua)) {
    browser = "Safari";
  }

  if (/Gecko\/\d/.test(ua) && /Firefox/.test(ua)) {
    engine = "Gecko";
  } else if (/AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg/.test(ua)) {
    engine = "WebKit";
  } else if (/AppleWebKit/.test(ua) || /Chrome|Chromium|Edg/.test(ua)) {
    engine = "Blink";
  }

  const os = detectOs(ua, uaData);

  return { browser, browserVersion, engine, os };
}

function detectOs(ua: string, uaData?: NavigatorUAData): string {
  if (uaData?.platform) {
    return uaData.platform;
  }
  if (/Windows/.test(ua)) return "Windows";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Android/.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/CrOS/.test(ua)) return "Chrome OS";
  if (/Linux/.test(ua)) return "Linux";
  return "Unknown";
}
