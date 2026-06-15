import React from "react";
import { STORAGE_KEYS, getWebAppUrl, formatTimestamp, LOCAL_WEB_APP_URL, PROD_WEB_APP_URL } from "~/utils";

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  description?: string;
}

const ToggleRow = ({ label, checked, onChange, disabled, description }: ToggleRowProps) => (
  <label
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.6 : 1,
    }}
  >
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ fontSize: "14px", fontWeight: "500" }}>{label}</span>
      {description && <span style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>{description}</span>}
    </div>
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      style={{
        width: "18px",
        height: "18px",
        accentColor: "#ef4444",
        cursor: disabled ? "default" : "pointer",
        flexShrink: 0,
      }}
    />
  </label>
);

const Popup = () => {
  const [hideInFullscreen, setHideInFullscreen] = React.useState(true);
  const [devMode, setDevMode] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [tabInfo, setTabInfo] = React.useState<{
    url?: string;
    currentTime?: number;
    isYouTube?: boolean;
  }>({});

  React.useEffect(() => {
    chrome.storage.local.get([STORAGE_KEYS.hideInFullscreen, STORAGE_KEYS.devMode], (result) => {
      const hideValue = result[STORAGE_KEYS.hideInFullscreen];
      const devValue = result[STORAGE_KEYS.devMode];
      setHideInFullscreen(typeof hideValue === "boolean" ? hideValue : true);
      setDevMode(typeof devValue === "boolean" ? devValue : false);
      setLoaded(true);
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id || !tab.url) return;

      const isYouTube = tab.url.includes("youtube.com/watch");
      setTabInfo({ url: tab.url, isYouTube });

      if (!isYouTube) return;

      chrome.tabs.sendMessage(tab.id, { type: "GET_VIDEO_STATE" }, (response) => {
        if (chrome.runtime.lastError) return;
        if (response && typeof response.currentTime === "number") {
          setTabInfo((prev) => ({
            ...prev,
            currentTime: response.currentTime,
          }));
        }
      });
    });
  }, []);

  const handleToggle = (key: keyof typeof STORAGE_KEYS, value: boolean) => {
    chrome.storage.local.set({ [STORAGE_KEYS[key]]: value });
  };

  const targetUrl = getWebAppUrl(devMode);

  return (
    <div
      style={{
        width: "280px",
        padding: "16px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#1f2937",
      }}
    >
      <h1
        style={{
          margin: "0 0 16px 0",
          fontSize: "18px",
          fontWeight: "700",
          color: "#ef4444",
        }}
      >
        Clipsy
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <ToggleRow
          label="Hide button in fullscreen"
          description="Hides Save to Clipsy while a video is fullscreen"
          checked={hideInFullscreen}
          onChange={() => {
            const next = !hideInFullscreen;
            setHideInFullscreen(next);
            handleToggle("hideInFullscreen", next);
          }}
          disabled={!loaded}
        />

        <ToggleRow
          label="Dev mode (localhost)"
          description={`Saves to ${LOCAL_WEB_APP_URL} instead of production`}
          checked={devMode}
          onChange={() => {
            const next = !devMode;
            setDevMode(next);
            handleToggle("devMode", next);
          }}
          disabled={!loaded}
        />
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "12px",
          backgroundColor: "#f3f4f6",
          borderRadius: "8px",
          fontSize: "12px",
          color: "#4b5563",
        }}
      >
        <div style={{ fontWeight: "600", marginBottom: "6px", color: "#374151" }}>Debug info</div>
        <div style={{ marginBottom: "4px" }}>
          <span style={{ color: "#6b7280" }}>Target: </span>
          <span style={{ fontWeight: "500" }}>{targetUrl}</span>
        </div>
        <div style={{ marginBottom: "4px" }}>
          <span style={{ color: "#6b7280" }}>Tab: </span>
          <span style={{ fontWeight: "500" }}>
            {tabInfo.isYouTube ? "YouTube video" : tabInfo.url ? "Not a YouTube video" : "Unknown"}
          </span>
        </div>
        {typeof tabInfo.currentTime === "number" && (
          <div>
            <span style={{ color: "#6b7280" }}>Current time: </span>
            <span style={{ fontWeight: "500" }}>
              {formatTimestamp(tabInfo.currentTime)}
              {tabInfo.currentTime >= 10 ? " (will save with timestamp)" : " (no timestamp)"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Popup;
