import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");

  function onSearch(e) {
    e.preventDefault();
    navigate(`/?q=${encodeURIComponent(query)}`);
  }

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="plate-badge" aria-label="PlateSwap home">
          PLATE<span style={{ color: "#d9901f" }}>SWAP</span>
          <span className="plate-strip">IND</span>
        </Link>

        <form className="nav-search" onSubmit={onSearch}>
          <input
            type="search"
            placeholder="Search by model, color, city..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search cars"
          />
        </form>

        <nav className="nav-links">
          <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>Home</Link>
          <Link to="/inbox" className={`nav-link ${isActive("/inbox") ? "active" : ""}`}>Inbox</Link>
          {user ? (
            <>
              <Link to="/post-car" className="nav-link nav-cta">+ Post a car</Link>
              <button className="nav-link" onClick={() => { logout(); navigate("/"); }}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Log in</Link>
              <Link to="/signup" className="nav-link nav-cta">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
