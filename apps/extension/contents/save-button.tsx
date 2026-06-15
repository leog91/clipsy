import React from "react";

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

const STORAGE_KEY = "hideInFullscreen";

const SaveButton = () => {
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState("");
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [hideInFullscreen, setHideInFullscreen] = React.useState(true);

  React.useEffect(() => {
    const updateFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    updateFullscreen();

    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => document.removeEventListener("fullscreenchange", updateFullscreen);
  }, []);

  React.useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      if (typeof result[STORAGE_KEY] === "boolean") {
        setHideInFullscreen(result[STORAGE_KEY]);
      }
    });

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[STORAGE_KEY] && typeof changes[STORAGE_KEY].newValue === "boolean") {
        setHideInFullscreen(changes[STORAGE_KEY].newValue);
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

      const webAppUrlBase = process.env.PLASMO_PUBLIC_WEB_APP_URL || "https://clipsy-web-sepia.vercel.app";
      const webAppUrl = `${webAppUrlBase}/?url=${encodeURIComponent(url)}`;
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
