import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const destinations = [
  { label: 'Dashboard', path: '/dashboard', symbol: '⌂' },
  { label: 'Products', path: '/products', symbol: '▤' },
  { label: 'Categories', path: '/categories', symbol: '◫' },
  { label: 'Locations', path: '/locations', symbol: '⌖' },
  { label: 'Receipts', path: '/receipts', symbol: '↓' },
  { label: 'Deliveries', path: '/deliveries', symbol: '↑' },
  { label: 'Internal Transfers', path: '/transfers', symbol: '⇄' },
  { label: 'Adjustments', path: '/adjustments', symbol: '±' },
  { label: 'Move History', path: '/ledger', symbol: '≡' },
]

function displayName(user) {
  return user?.name || user?.user?.name || user?.email || 'StockSense user'
}

function displayRole(user) {
  return user?.role || user?.user?.role || 'Inventory team'
}

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('')
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const name = displayName(user)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="operations">
      <aside className="sidebar">
        <div className="sidebar-top">
          <Link className="brand-lockup" to="/dashboard" aria-label="StockSense dashboard">
            <span className="brand-mark" aria-hidden="true">S</span>
            <span className="brand-name">StockSense</span>
          </Link>
          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? '×' : '☰'}
          </button>
        </div>
        <p className="nav-caption">Inventory</p>
        <nav id="primary-navigation" className={`primary-nav${menuOpen ? ' is-open' : ''}`} aria-label="Primary navigation">
          {destinations.map(({ label, path, symbol }) => (
            <NavLink
              key={path}
              to={path}
              end
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="nav-symbol" aria-hidden="true">{symbol}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-block">
            <span className="user-avatar" aria-hidden="true">{initials(name)}</span>
            <div className="user-copy">
              <div className="user-name">{name}</div>
              <div className="user-role">{displayRole(user)}</div>
            </div>
          </div>
          <button className="logout-button" type="button" onClick={handleLogout}>Sign out</button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <p className="topbar-label"><strong>Warehouse operations</strong> / Stock control</p>
          <span className="status-mark">Workspace active</span>
        </header>
        <Outlet />
      </div>
    </div>
  )
}