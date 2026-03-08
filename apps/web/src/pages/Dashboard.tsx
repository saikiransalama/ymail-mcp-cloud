import { useNavigate } from "react-router-dom";
import { useConnections } from "../hooks/useConnections.js";

interface Props {
  user: { id: string; email: string };
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: Props) {
  const navigate = useNavigate();
  const { connections, loading, error, deleteConnection, refresh } =
    useConnections(true);

  const token = localStorage.getItem("ymail_token") ?? "";

  const handleDelete = async (id: string) => {
    if (!confirm("Disconnect this Yahoo account? Your credentials will be deleted.")) return;
    await deleteConnection(id);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.brand}>YMail MCP Cloud</h1>
          <p style={styles.email}>{user.email}</p>
        </div>
        <button onClick={onLogout} style={styles.logoutBtn}>
          Sign out
        </button>
      </header>

      <main style={styles.main}>
        {/* Connection Status */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Yahoo Mail Connections</h2>
            <button
              onClick={() => navigate("/connect")}
              style={styles.addBtn}
            >
              + Connect Yahoo
            </button>
          </div>

          {loading && <p style={styles.muted}>Loading connections…</p>}
          {error && <p style={styles.errorText}>{error}</p>}

          {!loading && connections.length === 0 && (
            <div style={styles.emptyState}>
              <p>No Yahoo accounts connected yet.</p>
              <p style={styles.muted}>
                Connect your Yahoo account to start using MCP tools.
              </p>
              <button
                onClick={() => navigate("/connect")}
                style={styles.addBtn}
              >
                Connect Yahoo Mail
              </button>
            </div>
          )}

          {connections.map((conn) => (
            <div key={conn.id} style={styles.connectionCard}>
              <div>
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor:
                      conn.status === "active" ? "#e6f4ea" : "#fce8e6",
                    color: conn.status === "active" ? "#1e7e34" : "#d32f2f",
                  }}
                >
                  {conn.status}
                </span>
                <span style={styles.provider}>{conn.provider} · {conn.authMode}</span>
                <p style={styles.connDate}>
                  Connected {new Date(conn.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(conn.id)}
                style={styles.deleteBtn}
              >
                Disconnect
              </button>
            </div>
          ))}
        </section>

        {/* MCP Setup */}
        {connections.some((c) => c.status === "active") && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>MCP Client Setup</h2>
            <p style={styles.muted}>
              Use this token in your MCP client configuration:
            </p>
            <div style={styles.tokenBox}>
              <code style={styles.token}>{token}</code>
            </div>

            <h3 style={styles.subTitle}>Claude Desktop Config</h3>
            <pre style={styles.codeBlock}>{JSON.stringify({
              mcpServers: {
                "ymail-mcp": {
                  url: "http://localhost:3001/mcp",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              },
            }, null, 2)}</pre>
          </section>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    fontFamily: "system-ui, sans-serif",
  },
  header: {
    backgroundColor: "white",
    borderBottom: "1px solid #eee",
    padding: "16px 32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: { margin: 0, fontSize: 20, fontWeight: 700, color: "#111" },
  email: { margin: "4px 0 0", fontSize: 13, color: "#666" },
  logoutBtn: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid #ddd",
    background: "transparent",
    cursor: "pointer",
    fontSize: 14,
    color: "#555",
  },
  main: { maxWidth: 720, margin: "0 auto", padding: "32px 16px" },
  section: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { margin: 0, fontSize: 17, fontWeight: 600, color: "#111" },
  subTitle: { fontSize: 15, fontWeight: 600, color: "#333", marginTop: 20 },
  addBtn: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "none",
    backgroundColor: "#6c47ff",
    color: "white",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  muted: { color: "#888", fontSize: 13 },
  errorText: { color: "#d32f2f", fontSize: 13 },
  emptyState: {
    textAlign: "center",
    padding: "32px 16px",
    color: "#555",
  },
  connectionCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderRadius: 8,
    border: "1px solid #eee",
    marginBottom: 8,
  },
  statusBadge: {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    marginRight: 8,
  },
  provider: { fontSize: 13, color: "#555" },
  connDate: { margin: "4px 0 0", fontSize: 12, color: "#888" },
  deleteBtn: {
    padding: "6px 14px",
    borderRadius: 8,
    border: "1px solid #f44336",
    background: "transparent",
    color: "#f44336",
    cursor: "pointer",
    fontSize: 13,
  },
  tokenBox: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: "12px 16px",
    marginTop: 8,
    overflow: "auto",
  },
  token: { fontSize: 11, wordBreak: "break-all", color: "#333" },
  codeBlock: {
    backgroundColor: "#1e1e1e",
    color: "#d4d4d4",
    borderRadius: 8,
    padding: "16px",
    fontSize: 12,
    overflow: "auto",
    marginTop: 8,
  },
};
