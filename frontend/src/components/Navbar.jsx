import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../context/store'

const NAV_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@300;400;500;600&display=swap');
  .cc-nav {
    font-family:'Jost',sans-serif;
    background:rgba(254,252,248,0.96);
    backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
    border-bottom:1px solid rgba(101,78,51,0.1);
    position:sticky;top:0;z-index:100;
    padding:0 32px;height:62px;
    display:flex;align-items:center;justify-content:space-between;
    transition:box-shadow 0.3s;
  }
  .cc-nav-brand{display:flex;align-items:center;gap:10px;text-decoration:none;}
  .cc-nav-icon{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,#4a7c59,#2d5a3d);display:flex;align-items:center;justify-content:center;font-size:16px;color:#e8d5b0;box-shadow:0 2px 8px rgba(45,90,61,0.25);}
  .cc-brand-text{font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-weight:700;color:#2d1f0e;letter-spacing:0.01em;}
  .cc-brand-text span{color:#4a7c59;}
  .cc-tabs{display:flex;gap:2px;}
  .cc-tab{padding:6px 16px;border-radius:9px;font-size:0.84rem;font-weight:500;color:#8a7a65;cursor:pointer;border:none;background:none;font-family:'Jost',sans-serif;transition:all 0.2s;text-decoration:none;display:inline-block;}
  .cc-tab:hover{background:rgba(74,124,89,0.07);color:#2d5a3d;}
  .cc-tab.active{background:rgba(74,124,89,0.1);color:#2d5a3d;font-weight:600;}
  .cc-tab.admin{background:transparent;color:#2563a8;}
  .cc-tab.admin:hover{background:rgba(37,99,168,0.08);}
  .cc-tab.admin.active{background:rgba(37,99,168,0.1);font-weight:600;}
  .cc-right{display:flex;align-items:center;gap:12px;}
  .cc-avatar{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:1rem;font-weight:700;color:#e8d5b0;}
  .cc-uname{font-size:0.83rem;color:#8a7a65;}
  .cc-abadge{font-size:0.68rem;background:rgba(37,99,168,0.1);color:#2563a8;border:1px solid rgba(37,99,168,0.2);border-radius:100px;padding:2px 8px;font-weight:600;letter-spacing:0.04em;}
  .cc-logout{padding:6px 14px;border-radius:9px;background:transparent;border:1px solid rgba(192,57,43,0.25);color:#c0392b;font-size:0.8rem;font-weight:500;cursor:pointer;font-family:'Jost',sans-serif;transition:all 0.2s;}
  .cc-logout:hover{background:rgba(192,57,43,0.07);}
  @media(max-width:768px){.cc-nav{padding:0 16px;}.cc-tab{padding:5px 10px;font-size:0.78rem;}.cc-uname{display:none;}}
`

export default function Navbar() {
  const { user, logout, isAdmin } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const hue = user?.name ? (user.name.charCodeAt(0) * 17) % 60 + 100 : 130

  // Citizen tabs — hidden for admin
  const citizenTabs = [
    { path: '/', label: 'Dashboard' },
    { path: '/map', label: 'Map View' },
    { path: '/report', label: 'Report Issue' },  // citizens only
  ]

  // Admin tabs — shown only for admin
  const adminTabs = [
    { path: '/', label: 'Dashboard' },
    { path: '/map', label: 'Map View' },
  ]

  const tabs = isAdmin() ? adminTabs : citizenTabs

  return (
    <>
      <style>{NAV_STYLE}</style>
      <nav className="cc-nav" style={{ boxShadow: scrolled ? '0 4px 24px rgba(50,35,15,0.08)' : '0 1px 8px rgba(50,35,15,0.03)' }}>
        <Link to="/" className="cc-nav-brand">
          <div className="cc-nav-icon">🏛️</div>
          <span className="cc-brand-text">Civic<span>Connect</span></span>
        </Link>

        <div className="cc-tabs">
          {/* Common + role-specific tabs */}
          {tabs.map(t => (
            <Link key={t.path} to={t.path} className={`cc-tab ${location.pathname === t.path ? 'active' : ''}`}>
              {t.label}
            </Link>
          ))}

          {/* Admin-only tabs */}
          {isAdmin() && (
            <>
              <Link to="/admin" className={`cc-tab admin ${location.pathname === '/admin' ? 'active' : ''}`}>Admin Panel</Link>
              <Link to="/admin/analytics" className={`cc-tab admin ${location.pathname === '/admin/analytics' ? 'active' : ''}`}>📊 Analytics</Link>
            </>
          )}
        </div>

        <div className="cc-right">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="cc-avatar" style={{ background: `linear-gradient(135deg,hsl(${hue},44%,38%),hsl(${hue},36%,26%))` }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span className="cc-uname">{user?.name}</span>
            {isAdmin() && <span className="cc-abadge">Admin</span>}
          </div>
          <button className="cc-logout" onClick={() => { logout(); navigate('/login') }}>Logout</button>
        </div>
      </nav>
    </>
  )
}