import React from "react";

const STORAGE_KEY = "hideInFullscreen";

const Popup = () => {
  const [hideInFullscreen, setHideInFullscreen] = React.useState(true);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const value = result[STORAGE_KEY];
      setHideInFullscreen(typeof value === "boolean" ? value : true);
      setLoaded(true);
    });
  }, []);

  const handleToggle = () => {
    const next = !hideInFullscreen;
    setHideInFullscreen(next);
    chrome.storage.local.set({ [STORAGE_KEY]: next });
  };

  return (
    <div
      style={{
        width: "260px",
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

      <label
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          cursor: loaded ? "pointer" : "default",
          opacity: loaded ? 1 : 0.6,
        }}
      >
        <span style={{ fontSize: "14px", fontWeight: "500" }}>
          Hide button in fullscreen
        </span>
        <input
          type="checkbox"
          checked={hideInFullscreen}
          onChange={handleToggle}
          disabled={!loaded}
          style={{
            width: "18px",
            height: "18px",
            accentColor: "#ef4444",
            cursor: loaded ? "pointer" : "default",
          }}
        />
      </label>

      <p
        style={{
          margin: "12px 0 0 0",
          fontSize: "12px",
          color: "#6b7280",
          lineHeight: "1.4",
        }}
      >
        When enabled, the "Save to Clipsy" button is hidden while a video is
        in fullscreen mode.
      </p>
    </div>
  );
};

export default Popup;
