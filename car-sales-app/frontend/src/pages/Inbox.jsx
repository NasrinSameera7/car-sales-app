import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Inbox() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [thread, setThread] = useState(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  const loadList = useCallback(async () => {
    try {
      const data = await api.get("/api/messages");
      setConversations(data.conversations);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadThread = useCallback(async (id) => {
    try {
      const data = await api.get(`/api/messages/${id}`);
      setThread(data.conversation);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => {
    if (conversationId) loadThread(conversationId);
    else setThread(null);
  }, [conversationId, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim() || !conversationId) return;
    try {
      await api.post(`/api/messages/${conversationId}`, { text });
      setText("");
      loadThread(conversationId);
      loadList();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p style={{ color: "var(--color-steel)" }}>Loading inbox...</p>;

  return (
    <div>
      <div className="page-header"><h2>Inbox</h2></div>
      {error && <div className="error-banner">{error}</div>}

      <div className="inbox-layout">
        <div className="conversation-list">
          {conversations.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}>
              <p>No conversations yet. Message a seller from a car's page to start one.</p>
            </div>
          ) : conversations.map((c) => {
            const thumb = c.car?.photos?.[0] ? api.fileUrl(c.car.photos[0].url) : null;
            return (
              <div
                key={c.id}
                className={`conversation-item ${c.id === conversationId ? "active" : ""}`}
                onClick={() => navigate(`/inbox/${c.id}`)}
                style={{ cursor: "pointer" }}
              >
                {thumb ? <img className="conversation-thumb" src={thumb} alt="" /> : <div className="conversation-thumb" />}
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{c.otherUser.name}</p>
                  {c.car && <p style={{ fontSize: 12, color: "var(--color-steel)" }}>{c.car.year} {c.car.variant}</p>}
                  <p style={{ fontSize: 12, color: "var(--color-steel)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.lastMessage ? c.lastMessage.text : "No messages yet"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="thread">
          {!thread ? (
            <div className="empty-state"><h3>Select a conversation</h3><p>Pick a conversation on the left to see the full thread.</p></div>
          ) : (
            <>
              <div className="thread-header">
                {thread.otherUser.name}
                {thread.car && <span style={{ fontWeight: 400, color: "var(--color-steel)" }}> — {thread.car.year} {thread.car.variant}</span>}
              </div>
              <div className="thread-messages">
                {thread.messages.map((m) => (
                  <div key={m.id} className={`bubble ${m.senderId === user.id ? "mine" : "theirs"}`}>
                    {m.text}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form className="thread-composer" onSubmit={send}>
                <input placeholder="Type a message..." value={text} onChange={(e) => setText(e.target.value)} />
                <button className="btn btn-primary">Send</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
