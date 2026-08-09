import { useEffect, useState, useCallback } from "react";
import { api } from "../api";

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.get("/api/friends");
      setFriends(data.friends);
      setIncoming(data.incomingRequests);
      setOutgoing(data.outgoingRequests);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function search(e) {
    e.preventDefault();
    if (!query.trim()) return setResults([]);
    try {
      const data = await api.get(`/api/friends/search?q=${encodeURIComponent(query)}`);
      setResults(data.users);
    } catch (err) {
      setError(err.message);
    }
  }

  async function sendRequest(userId) {
    try {
      await api.post(`/api/friends/request/${userId}`);
      setResults((r) => r.filter((u) => u.id !== userId));
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function accept(requestId) {
    try {
      await api.post(`/api/friends/accept/${requestId}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(requestId) {
    try {
      await api.del(`/api/friends/${requestId}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p style={{ color: "var(--color-steel)" }}>Loading friends...</p>;

  return (
    <div>
      <div className="page-header"><h2>My friends</h2></div>
      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={search} style={{ display: "flex", gap: 10, marginBottom: 24, maxWidth: 420 }}>
        <input
          placeholder="Search people by name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid var(--color-line)" }}
        />
        <button className="btn btn-secondary">Search</button>
      </form>

      {results.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>Search results</h3>
          {results.map((u) => (
            <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--color-line)" }}>
              <span>{u.name} {u.city && <span style={{ color: "var(--color-steel)", fontSize: 13 }}>· {u.city}</span>}</span>
              <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => sendRequest(u.id)}>Add friend</button>
            </div>
          ))}
        </div>
      )}

      {incoming.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>Requests to you</h3>
          {incoming.map((r) => (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--color-line)" }}>
              <span>{r.user.name}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => accept(r.id)}>Accept</button>
                <button className="btn btn-danger" style={{ fontSize: 12 }} onClick={() => remove(r.id)}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {outgoing.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>Requests you sent</h3>
          {outgoing.map((r) => (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--color-line)" }}>
              <span>{r.user.name}</span>
              <span style={{ fontSize: 12, color: "var(--color-steel)" }}>Pending</span>
            </div>
          ))}
        </div>
      )}

      <h3 style={{ fontSize: 15, marginBottom: 10 }}>Your friends ({friends.length})</h3>
      {friends.length === 0 ? (
        <div className="empty-state"><h3>No friends yet</h3><p>Search for buyers and sellers you've dealt with to add them.</p></div>
      ) : (
        friends.map((f) => (
          <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--color-line)" }}>
            <span>{f.name} {f.city && <span style={{ color: "var(--color-steel)", fontSize: 13 }}>· {f.city}</span>}</span>
            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--color-steel)" }}>{f.id}</span>
          </div>
        ))
      )}
    </div>
  );
}
