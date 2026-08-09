import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/my-listings", label: "My posts & transactions", icon: "🚗" },
  { to: "/wishlist", label: "My wishlist", icon: "❤️" },
  { to: "/friends", label: "My friends", icon: "👥" },
  { to: "/inbox", label: "Inbox", icon: "✉️" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-card">
        <div className="sidebar-user">
          <span className="name">{user.name}</span>
          <span style={{ fontSize: 13, color: "var(--color-steel)" }}>{user.email}</span>
          <span className="role-badge">{user.role === "DEALER" ? "Dealer" : "Customer"}</span>
        </div>
        <nav>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            >
              <span aria-hidden="true">{l.icon}</span> {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
