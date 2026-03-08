import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, type AuthResponse } from "../api-client.js";

interface Props {
  onLogin: (token: string, user: { id: string; email: string }) => void;
}

export function Register({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post<AuthResponse>("/auth/register", { email, password });
      onLogin(res.token, res.user);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>YMail MCP Cloud</h1>
        <p style={styles.subtitle}>Create your account</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="you@example.com"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={styles.input}
              placeholder="At least 8 characters"
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p style={styles.link}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
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
  },
  card: {
    background: "white",
    borderRadius: 12,
    padding: "40px 48px",
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  title: { margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: "#111" },
  subtitle: { margin: "0 0 32px", color: "#666", fontSize: 14 },
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
  error: { color: "#d32f2f", fontSize: 13, margin: 0 },
  button: {
    padding: "12px",
    borderRadius: 8,
    border: "none",
    backgroundColor: "#6c47ff",
    color: "white",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 8,
  },
  link: { textAlign: "center", marginTop: 20, fontSize: 14, color: "#555" },
};
