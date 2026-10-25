"use client";

import { useEffect, useState } from "react";

type Connection = { id: string; clientOrigin: string; expiresAt: number };
export function ShelfyConnections() {
  const [connections, setConnections] = useState<Connection[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    void fetch("/api/integrations/shelfy/connections", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((body) => {
        if (!controller.signal.aborted) setConnections(body.connections);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("Could not load Shelfy connections.");
      });
    return () => controller.abort();
  }, [attempt]);
  return (
    <section className="mt-8 space-y-3" aria-label="Shelfy connections">
      <h2 className="text-xl font-semibold">Shelfy connections</h2>
      <p className="text-gray-400">
        Read-only access to your library counts. Disconnecting never deletes
        videos.
      </p>
      {connections === null && !error && (
        <p role="status">Loading connections…</p>
      )}
      {connections?.length === 0 && <p>No Shelfy connections.</p>}
      {connections?.map((connection) => (
        <div key={connection.id} className="rounded border border-gray-700 p-3">
          <p>{connection.clientOrigin}</p>
          <p>
            {connection.expiresAt <= Date.now()
              ? "Expired"
              : `Expires ${new Date(connection.expiresAt).toLocaleDateString()}`}
          </p>
          <button
            type="button"
            disabled={busy}
            className="min-h-11 rounded border px-4"
            onClick={async () => {
              setBusy(true);
              setError("");
              setNotice("");
              try {
                const response = await fetch(
                  "/api/integrations/shelfy/disconnect",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: connection.id }),
                  },
                );
                if (!response.ok) throw new Error();
                setConnections(
                  (current) =>
                    current?.filter((value) => value.id !== connection.id) ??
                    null,
                );
                setNotice("Shelfy access revoked.");
              } catch {
                setError("Could not revoke access. Try again.");
              } finally {
                setBusy(false);
              }
            }}
          >
            Disconnect Shelfy
          </button>
        </div>
      ))}
      {notice && <p role="status">{notice}</p>}
      {error && (
        <>
          <p role="alert">{error}</p>
          <button
            type="button"
            className="min-h-11 rounded border px-4"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Retry connections
          </button>
        </>
      )}
    </section>
  );
}
