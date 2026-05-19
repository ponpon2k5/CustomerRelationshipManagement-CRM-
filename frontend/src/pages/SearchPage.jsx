import { useMemo } from 'react'
import { formatDate } from '../utils/customerUtils'

export default function SearchPage({ customers, query, searchInput, setSearchInput, onSearch, onOpenProfile }) {
  const quickSearches = [
    ...customers.slice(0, 3).map((customer) => customer.name).filter(Boolean),
    ...customers.slice(0, 1).map((customer) => customer.phone).filter(Boolean),
    ...customers.slice(0, 1).map((customer) => customer.email).filter(Boolean),
  ]
  const normalizedQuery = query.trim().toLowerCase()
  const normalizedPhoneQuery = query.replace(/\D/g, '')

  const results = useMemo(() => {
    if (!normalizedQuery) return customers

    return customers.filter((customer) => {
      const name = customer.name.toLowerCase()
      const phone = customer.phone.toLowerCase()
      const email = customer.email.toLowerCase()
      const normalizedPhone = customer.normalizedPhone || ''

      return (
        name.includes(normalizedQuery) ||
        phone.includes(normalizedQuery) ||
        email.includes(normalizedQuery) ||
        (normalizedPhoneQuery && normalizedPhone.includes(normalizedPhoneQuery))
      )
    })
  }, [customers, normalizedPhoneQuery, normalizedQuery])

  function getMatchedBy(customer) {
    if (!normalizedQuery) return 'All customers'
    if (customer.name.toLowerCase().includes(normalizedQuery)) return 'Name match'
    if (customer.email.toLowerCase().includes(normalizedQuery)) return 'Email match'
    if (customer.phone.toLowerCase().includes(normalizedQuery)) return 'Phone match'
    if (normalizedPhoneQuery && customer.normalizedPhone?.includes(normalizedPhoneQuery)) return 'Phone match'
    return 'Customer match'
  }

  return (
    <section className="search-page">
      <div className="search-hero">
        <div className="search-hero-shape coral" />
        <div className="search-hero-shape gold" />
        <div className="search-hero-content">
          <p className="eyebrow">CRM Search</p>
          <h2>Find customers by name, phone number, or email</h2>
          <form
            className="search-hero-form"
            onSubmit={(event) => {
              event.preventDefault()
              onSearch(searchInput)
            }}
          >
            <span aria-hidden="true">⌕</span>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by name, phone, or email..."
              type="search"
            />
            {searchInput && (
              <button className="clear-search" type="button" onClick={() => {
                setSearchInput('')
                onSearch('')
              }}>
                ×
              </button>
            )}
            <button className="hero-search-button" type="submit">Search</button>
          </form>
          <div className="search-scope" aria-label="Search fields">
            <span>Name</span>
            <span>Phone number</span>
            <span>Email</span>
          </div>
          <div className="quick-searches">
            {quickSearches.map((item) => (
              <button key={item} type="button" onClick={() => onSearch(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="search-results">
        <div className="search-summary">
          <div>
            <p className="eyebrow">Results</p>
            <h2>{results.length} matching customer{results.length === 1 ? '' : 's'}</h2>
          </div>
          <span>{query ? `Query: ${query}` : 'Enter a name, phone number, or email to search'}</span>
        </div>

        {results.length === 0 ? (
          <div className="empty-state">
            No matches found for "{query}". Try another customer name, phone number, or email.
          </div>
        ) : (
          <div className="search-result-list">
            {results.map((customer) => (
              <article className="search-result-card" key={customer.id}>
                <div className="result-avatar" aria-hidden="true">
                  {customer.name.charAt(0)}
                </div>
                <div className="result-body">
                  <div className="result-title-row">
                    <div>
                      <h3>{customer.name}</h3>
                      <p>{customer.companyName || 'No company'} · {customer.status}</p>
                    </div>
                    <div className="result-badges">
                      <span className="match-pill">{getMatchedBy(customer)}</span>
                      <span className={`status-pill ${customer.status.toLowerCase()}`}>{customer.status}</span>
                    </div>
                  </div>
                  <div className="result-meta-grid">
                    <span>Phone<strong>{customer.phone || '-'}</strong></span>
                    <span>Email<strong>{customer.email || '-'}</strong></span>
                    <span>Created<strong>{formatDate(customer.createdAt)}</strong></span>
                    <span>Activity<strong>{customer.notes.length} notes · {customer.interactions.length} interactions</strong></span>
                  </div>
                </div>
                <button className="primary-button" type="button" onClick={() => onOpenProfile(customer.id)}>
                  Open Profile
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
