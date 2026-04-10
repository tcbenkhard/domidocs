import { useEffect, useState } from "react";
import { EncryptionMode } from "@domidocs/contracts";
import { fetchMe } from "../data/api";
import { getAccessToken } from "../data/session-store";

export function HomePage() {
  const [me, setMe] = useState<{ userId: string; email: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) return;
    fetchMe()
      .then(setMe)
      .catch(() => setErr("Session expired or web API not running."));
  }, []);

  return (
    <div className="card">
      <h1>Domidocs</h1>
      <p className="muted">
        Encrypted document storage with <strong>{EncryptionMode.Client}</strong>{" "}
        or <strong>{EncryptionMode.Backend}</strong> modes (API wiring in
        progress).
      </p>
      {err && <p className="error">{err}</p>}
      {me && (
        <pre>
          {JSON.stringify(me, null, 2)}
        </pre>
      )}
      {!me && !err && getAccessToken() && <p className="muted">Loading profile…</p>}
      {!getAccessToken() && (
        <p className="muted">Log in to see your profile from the web API.</p>
      )}
    </div>
  );
}
