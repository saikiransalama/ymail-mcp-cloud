import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api-client.js";

export function Connect() {
  const [yahooEmail, setYahooEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/connections/yahoo", { yahooEmail, appPassword }, true);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Connect Yahoo Mail</h2>
        <p style={styles.subtitle}>
          Enter your Yahoo email and App Password. Your credentials are encrypted
          and never stored in plain text.
        </p>

        <div style={styles.infoBox}>
          <strong>How to get an App Password:</strong>
          <ol style={{ margin: "8px 0 0", paddingLeft: 20, fontSize: 13 }}>
            <li>Go to Yahoo Account Security settings</li>
            <li>Enable two-step verification</li>
            <li>Go to "Generate app password"</li>
            <li>Select "Other app" and create the password</li>
            <li>Copy the generated password and paste it below</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Yahoo Email</label>
            <input
              type="email"
              value={yahooEmail}
              onChange={(e) => setYahooEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="yourname@yahoo.com"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>App Password</label>
            <input
              type="password"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="xxxx xxxx xxxx xxxx"
              autoComplete="off"
            />
            <small style={styles.hint}>
              Use the app password generated in Yahoo Account Security, not your account password.
            </small>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          {loading && (
            <p style={styles.connecting}>
              Connecting to Yahoo IMAP… this may take a few seconds.
            </p>
          )}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Verifying connection…" : "Connect Yahoo Mail"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            style={styles.cancelButton}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    fontFamily: "system-ui, sans-serif",
    padding: 16,
  },
  card: {
    background: "white",
    borderRadius: 12,
    padding: "40px 48px",
    width: "100%",
    maxWidth: 480,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  title: { margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: "#111" },
  subtitle: { margin: "0 0 20px", color: "#555", fontSize: 14, lineHeight: 1.5 },
  infoBox: {
    backgroundColor: "#f0f0ff",
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: "12px 16px",
    marginBottom: 24,
    fontSize: 13,
    color: "#333",
  },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#333" },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 15,
    outline: "none",
  },
  hint: { fontSize: 12, color: "#888" },
  error: { color: "#d32f2f", fontSize: 13, margin: 0 },
  connecting: { color: "#666", fontSize: 13, margin: 0, fontStyle: "italic" },
  button: {
    padding: "12px",
    borderRadius: 8,
    border: "none",
    backgroundColor: "#6c47ff",
    color: "white",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  cancelButton: {
    padding: "12px",
    borderRadius: 8,
    border: "1px solid #ddd",
    backgroundColor: "transparent",
    fontSize: 15,
    cursor: "pointer",
    color: "#555",
  },
};
