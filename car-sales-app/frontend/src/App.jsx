import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import PostCar from "./pages/PostCar";
import CarDetail from "./pages/CarDetail";
import MyListings from "./pages/MyListings";
import Inbox from "./pages/Inbox";
import Wishlist from "./pages/Wishlist";
import Friends from "./pages/Friends";
import Settings from "./pages/Settings";

function Layout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="main-area">
        <Sidebar />
        <div className="content-area">{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/cars/:id" element={<Layout><CarDetail /></Layout>} />

      <Route path="/post-car" element={<Layout><ProtectedRoute><PostCar /></ProtectedRoute></Layout>} />
      <Route path="/my-listings" element={<Layout><ProtectedRoute><MyListings /></ProtectedRoute></Layout>} />
      <Route path="/inbox" element={<Layout><ProtectedRoute><Inbox /></ProtectedRoute></Layout>} />
      <Route path="/inbox/:conversationId" element={<Layout><ProtectedRoute><Inbox /></ProtectedRoute></Layout>} />
      <Route path="/wishlist" element={<Layout><ProtectedRoute><Wishlist /></ProtectedRoute></Layout>} />
      <Route path="/friends" element={<Layout><ProtectedRoute><Friends /></ProtectedRoute></Layout>} />
      <Route path="/settings" element={<Layout><ProtectedRoute><Settings /></ProtectedRoute></Layout>} />

      <Route path="*" element={<Layout><div className="empty-state"><h3>Page not found</h3></div></Layout>} />
    </Routes>
  );
}
