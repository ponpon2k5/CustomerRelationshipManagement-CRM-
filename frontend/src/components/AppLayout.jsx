import { navItems } from '../data/customers'

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

  return (
    <main className="crm-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <span className="brand-mark">V</span>
          <span>Bigin</span>
        </div>
        <nav className="nav-list">
          {navItems.map((item) => (
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
                  : 'Customer Dashboard'}
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
