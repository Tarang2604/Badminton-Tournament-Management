// src/components/layout/Navbar.jsx
import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FiMenu, FiX, FiUser, FiLogOut, FiSettings, FiShield, FiHome, FiAward, FiGrid } from 'react-icons/fi';
import { selectUser, selectIsAuthenticated, selectIsAdmin, logout } from '../../store/slices/authSlice';
import './Navbar.css';

function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    setDropdownOpen(false);
    navigate('/');
  };

  const getInitials = (name) => name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <div className="logo-icon">🏸</div>
            <span className="logo-text">Shuttle<span>Pro</span></span>
          </Link>

          {/* Desktop Nav Links */}
          <ul className="navbar-links">
            <li><NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Home</NavLink></li>
            <li><NavLink to="/tournaments" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Tournaments</NavLink></li>
            {isAuthenticated && (
              <li><NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink></li>
            )}
            {isAdmin && (
              <li><NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Admin</NavLink></li>
            )}
          </ul>

          {/* Desktop Actions */}
          <div className="navbar-actions">
            {isAuthenticated ? (
              <div className="user-menu" ref={dropdownRef}>
                <button className="user-avatar-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                  <div className="avatar-circle">{getInitials(user?.name)}</div>
                  <span className="user-name">{user?.name?.split(' ')[0]}</span>
                </button>

                {dropdownOpen && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <div className="dropdown-name">{user?.name}</div>
                      <div className="dropdown-role">{user?.role}</div>
                    </div>
                    <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <FiUser size={15} /> My Profile
                    </Link>
                    <Link to="/dashboard" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <FiGrid size={15} /> Dashboard
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <FiShield size={15} /> Admin Panel
                      </Link>
                    )}
                    <button className="dropdown-item danger" onClick={handleLogout}>
                      <FiLogOut size={15} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
              </>
            )}

            {/* Hamburger */}
            <button className="hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <FiX size={22} color="var(--text-primary)" /> : (
                <>
                  <span /><span /><span />
                </>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Nav */}
      <div className={`mobile-nav ${mobileOpen ? 'open' : ''}`}>
        <Link to="/" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>🏠 Home</Link>
        <Link to="/tournaments" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>🏆 Tournaments</Link>
        {isAuthenticated && (
          <>
            <Link to="/dashboard" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>📊 Dashboard</Link>
            <Link to="/profile" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>👤 Profile</Link>
            {isAdmin && <Link to="/admin" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>🛡️ Admin</Link>}
            <button className="mobile-nav-link" style={{ border: 'none', background: 'none', color: 'var(--error)', cursor: 'pointer', textAlign: 'left' }} onClick={() => { handleLogout(); setMobileOpen(false); }}>
              🚪 Logout
            </button>
          </>
        )}
        {!isAuthenticated && (
          <>
            <Link to="/login" className="btn btn-ghost" onClick={() => setMobileOpen(false)}>Login</Link>
            <Link to="/register" className="btn btn-primary" onClick={() => setMobileOpen(false)}>Sign Up</Link>
          </>
        )}
      </div>
    </>
  );
}

export default Navbar;
