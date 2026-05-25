import { navItems } from '../data/customers'
import doubleDnLogo from '../assets/images/doubledn-pvd-logo.png'

export default function AppLayout({
  activePage,
  children,
  onLogout,
  onNavigate,
  onSearch,
  searchInput,
  sessionUser,
  setSearchInput,
}) {
  const displayName = typeof sessionUser === 'string'
    ? sessionUser
    : sessionUser?.fullName || sessionUser?.email || 'user'
  const role = typeof sessionUser === 'string' ? '' : sessionUser?.role
  const normalizedRole = String(role || '').toUpperCase()
  const visibleNavItems = normalizedRole === 'ADMIN'
    ? [...navItems, 'User Management']
    : navItems

  return (
    <main className="crm-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <button
          className="brand"
          type="button"
          aria-label="Go to dashboard"
          onClick={() => onNavigate('Dashboard')}
        >
          <img className="brand-logo" src={doubleDnLogo} alt="DoubleDN-PVD" />
        </button>
        <nav className="nav-list">
          {visibleNavItems.map((item) => (
            <button
              className={`nav-item ${item === activePage ? 'active' : ''}`}
              key={item}
              type="button"
              onClick={() => onNavigate(item)}
            >
              <span className="nav-icon" aria-hidden="true">{item.charAt(0)}</span>
              <span>{item}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>
              {activePage === 'Profile'
                ? 'Customer Profile'
                : activePage === 'Search'
                  ? 'Search Customers'
                  : activePage === 'Issues'
                    ? 'Interaction Issues'
                    : activePage === 'User Management'
                      ? 'User Management'
                      : activePage === 'Customers'
                        ? 'Customer List'
                        : 'Dashboard Report'}
            </h1>
          </div>
          <form
            className="search-field"
            onSubmit={(event) => {
              event.preventDefault()
              onSearch()
            }}
          >
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search name, phone, or email..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <button type="submit">Search</button>
          </form>
          <div className="user-chip">
            {role && <span>{role}</span>}
            <strong>Welcome, {displayName}</strong>
            <button type="button" onClick={onLogout}>Đăng xuất</button>
          </div>
        </header>

        {children}
      </section>
    </main>
  )
}
