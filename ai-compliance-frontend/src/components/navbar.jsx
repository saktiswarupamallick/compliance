import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Navbar() {
  const token = localStorage.getItem("token");
  let user = localStorage.getItem("user");
  if (user) {
    user = JSON.parse(user);
  }
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const logout = async () => {
    try {
      // Call logout endpoint
      await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local storage regardless of API call result
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'lawyer': return 'badge-primary';
      case 'admin': return 'badge-secondary';
      default: return 'badge-neutral';
    }
  };

  return (
    <div className="navbar bg-white border-b border-gray-200">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost text-xl font-bold">
          <span className="text-primary">⚖️</span> Compliance AI
        </Link>
      </div>
      
      <div className="flex-none">
        {!token ? (
          <div className="flex gap-2">
            <Link to="/signup" className="btn btn-sm btn-outline">
              Sign Up
            </Link>
            <Link to="/login" className="btn btn-sm btn-primary">
              Sign In
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {/* Navigation Links */}
            <div className="hidden md:flex gap-2">
              <Link to="/" className="btn btn-sm btn-ghost">
                Documents
              </Link>
              {user?.role === "lawyer" && (
                <Link to="/admin" className="btn btn-sm btn-ghost">
                  Dashboard
                </Link>
              )}
            </div>

            {/* User Dropdown */}
            <div className="dropdown dropdown-end">
              <div 
                tabIndex={0} 
                role="button" 
                className="btn btn-ghost btn-circle avatar"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                  <span className="text-sm font-bold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              
              {showDropdown && (
                <ul 
                  tabIndex={0} 
                  className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
                >
                  <li className="menu-title">
                    <span>{user?.name || 'User'}</span>
                    <span className={`badge badge-sm ${getRoleBadgeColor(user?.role)}`}>
                      {user?.role}
                    </span>
                  </li>
                  <li>
                    <Link to="/profile" className="justify-between">
                      Profile
                      <span className="badge">New</span>
                    </Link>
                  </li>
                  {user?.role === "lawyer" && (
                    <li>
                      <Link to="/admin">Dashboard</Link>
                    </li>
                  )}
                  <li>
                    <Link to="/settings">Settings</Link>
                  </li>
                  <div className="divider my-1"></div>
                  <li>
                    <button onClick={logout} className="text-error">
                      Logout
                    </button>
                  </li>
                </ul>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                className="btn btn-sm btn-ghost"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {token && showDropdown && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-base-100 shadow-lg z-50">
          <ul className="menu p-4">
            <li><Link to="/" onClick={() => setShowDropdown(false)}>Documents</Link></li>
            {user?.role === "lawyer" && (
              <li><Link to="/admin" onClick={() => setShowDropdown(false)}>Dashboard</Link></li>
            )}
            <li><Link to="/profile" onClick={() => setShowDropdown(false)}>Profile</Link></li>
            <li><Link to="/settings" onClick={() => setShowDropdown(false)}>Settings</Link></li>
            <div className="divider my-2"></div>
            <li><button onClick={logout} className="text-error">Logout</button></li>
          </ul>
        </div>
      )}
    </div>
  );
}
