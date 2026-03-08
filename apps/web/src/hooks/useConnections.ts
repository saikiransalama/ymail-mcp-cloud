import { useState, useEffect } from "react";
import { api, type Connection } from "../api-client.js";

export function useConnections(isAuthenticated: boolean) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    if (!isAuthenticated) return;
    setLoading(true);
    api
      .get<{ connections: Connection[] }>("/connections")
      .then(({ connections }) => {
        setConnections(connections);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, [isAuthenticated]);

  const deleteConnection = async (id: string) => {
    await api.delete(`/connections/yahoo/${id}`);
    refresh();
  };

  return { connections, loading, error, refresh, deleteConnection };
}
