export const STORAGE_KEYS = {
  hideInFullscreen: "hideInFullscreen",
  devMode: "devMode",
} as const;

export const PROD_WEB_APP_URL = "https://clipsy-web-sepia.vercel.app";
export const LOCAL_WEB_APP_URL = "http://localhost:3000";

export function getWebAppUrl(devMode: boolean): string {
  return devMode ? LOCAL_WEB_APP_URL : PROD_WEB_APP_URL;
}

export function formatTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}
