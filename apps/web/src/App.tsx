import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth.js";
import { Login } from "./pages/Login.js";
import { Register } from "./pages/Register.js";
import { Dashboard } from "./pages/Dashboard.js";
import { Connect } from "./pages/Connect.js";

export function App() {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "system-ui" }}>
        Loading…
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={login} />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register onLogin={login} />} />
        <Route
          path="/"
          element={
            user ? <Dashboard user={user} onLogout={logout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/connect"
          element={
            user ? <Connect /> : <Navigate to="/login" />
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
