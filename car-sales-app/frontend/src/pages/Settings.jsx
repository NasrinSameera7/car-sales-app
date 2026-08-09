import { useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user, refreshUser, logout } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [city, setCity] = useState(user?.city || "");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");

  async function saveProfile(e) {
    e.preventDefault();
    setProfileErr(""); setProfileMsg("");
    try {
      await api.patch("/api/auth/profile", { name, city });
      await refreshUser();
      setProfileMsg("Profile updated.");
    } catch (err) {
      setProfileErr(err.message);
    }
  }

  async function resetPassword(e) {
    e.preventDefault();
    setPwErr(""); setPwMsg("");
    try {
      await api.post("/api/auth/reset-password", { currentPassword, newPassword });
      setPwMsg("Password updated.");
      setCurrentPassword(""); setNewPassword("");
    } catch (err) {
      setPwErr(err.message);
    }
  }

  return (
    <div>
      <div className="page-header"><h2>Settings</h2></div>

      <div className="form-card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Profile</h3>
        {profileErr && <div className="error-banner">{profileErr}</div>}
        {profileMsg && <div className="success-banner">{profileMsg}</div>}
        <form onSubmit={saveProfile}>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="city">City</label>
            <input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="field">
            <label>Email</label>
            <input value={user?.email || ""} disabled />
          </div>
          <button className="btn btn-primary">Save profile</button>
        </form>
      </div>

      <div className="form-card">
        <h3 style={{ marginBottom: 16 }}>Reset password</h3>
        {pwErr && <div className="error-banner">{pwErr}</div>}
        {pwMsg && <div className="success-banner">{pwMsg}</div>}
        <form onSubmit={resetPassword}>
          <div className="field">
            <label htmlFor="currentPassword">Current password</label>
            <input id="currentPassword" type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="newPassword">New password</label>
            <input id="newPassword" type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <button className="btn btn-primary">Update password</button>
        </form>
      </div>

      <button className="btn btn-secondary" style={{ marginTop: 24 }} onClick={logout}>Log out</button>
    </div>
  );
}
