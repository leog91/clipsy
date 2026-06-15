import React from "react";
import { STORAGE_KEYS, getWebAppUrl } from "~/utils";

export const getStyle = () => {
  return {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: 99999,
  };
};

export const config = {
  matches: ["*://*.youtube.com/watch*"],
};

const SaveButton = () => {
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState("");
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [hideInFullscreen, setHideInFullscreen] = React.useState(true);
  const [devMode, setDevMode] = React.useState(false);

  React.useEffect(() => {
    const updateFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    updateFullscreen();

    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => document.removeEventListener("fullscreenchange", updateFullscreen);
  }, []);

  React.useEffect(() => {
    const listener = (request: { type: string }, _sender: chrome.runtime.MessageSender, sendResponse: (response: { currentTime: number; fullscreen: boolean }) => void) => {
      if (request.type === "GET_VIDEO_STATE") {
        const video = document.querySelector("video");
        sendResponse({
          currentTime: video?.currentTime ?? 0,
          fullscreen: Boolean(document.fullscreenElement),
        });
      }
      return true;
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  React.useEffect(() => {
    chrome.storage.local.get([STORAGE_KEYS.hideInFullscreen, STORAGE_KEYS.devMode], (result) => {
      if (typeof result[STORAGE_KEYS.hideInFullscreen] === "boolean") {
        setHideInFullscreen(result[STORAGE_KEYS.hideInFullscreen]);
      }
      if (typeof result[STORAGE_KEYS.devMode] === "boolean") {
        setDevMode(result[STORAGE_KEYS.devMode]);
      }
    });

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[STORAGE_KEYS.hideInFullscreen] && typeof changes[STORAGE_KEYS.hideInFullscreen].newValue === "boolean") {
        setHideInFullscreen(changes[STORAGE_KEYS.hideInFullscreen].newValue);
      }
      if (changes[STORAGE_KEYS.devMode] && typeof changes[STORAGE_KEYS.devMode].newValue === "boolean") {
        setDevMode(changes[STORAGE_KEYS.devMode].newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const url = window.location.href;

      if (!url.includes("youtube.com/watch")) {
        setError("Not a YouTube video page");
        return;
      }

      const video = document.querySelector("video");
      const currentTime = video?.currentTime ?? 0;
      const urlWithTimestamp = currentTime >= 10 ? `${url}&t=${Math.floor(currentTime)}s` : url;

      const webAppUrlBase = getWebAppUrl(devMode);
      const webAppUrl = `${webAppUrlBase}/?url=${encodeURIComponent(urlWithTimestamp)}`;
      window.open(webAppUrl, "_blank");

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open Clipsy");
    } finally {
      setSaving(false);
    }
  };

  const hidden = isFullscreen && hideInFullscreen;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 99999,
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: hidden ? "none" : "flex",
        flexDirection: "column",
        alignItems: "flex-end",
      }}
    >
      <button
        onClick={handleSave}
        disabled={saving || saved}
        style={{
          padding: "12px 24px",
          backgroundColor: saved ? "#10b981" : "#ef4444",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: saving || saved ? "not-allowed" : "pointer",
          fontSize: "14px",
          fontWeight: "600",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        }}
      >
        {saving ? "Saving..." : saved ? "Saved!" : "Save to Clipsy"}
      </button>
      {error && (
        <div
          style={{
            marginTop: "8px",
            padding: "8px 12px",
            backgroundColor: "#fee2e2",
            color: "#dc2626",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default SaveButton;
