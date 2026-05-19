import { useMemo } from 'react'
import { formatDate } from '../utils/customerUtils'

export default function SearchPage({ customers, query, searchInput, setSearchInput, onSearch, onOpenProfile }) {
  const quickSearches = [
    ...customers.slice(0, 3).map((customer) => customer.name).filter(Boolean),
    'inactive',
    'email',
  ]
  const normalizedQuery = query.trim().toLowerCase()

  const results = useMemo(() => {
    if (!normalizedQuery) return customers

    return customers.filter((customer) => {
      const noteText = customer.notes.map((note) => note.text).join(' ')
      const interactionText = customer.interactions.map((interaction) => `${interaction.type} ${interaction.text}`).join(' ')
      const haystack = [
        customer.name,
        customer.phone,
        customer.normalizedPhone,
        customer.email,
        customer.address,
        customer.companyName,
        customer.status,
        customer.createdBy,
        customer.updatedBy,
        noteText,
        interactionText,
      ].join(' ').toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [customers, normalizedQuery])

  return (
    <section className="search-page">
      <div className="search-hero">
        <div className="search-hero-shape coral" />
        <div className="search-hero-shape gold" />
        <div className="search-hero-content">
          <p className="eyebrow">CRM Search</p>
          <h2>Find customers, notes, and interaction history</h2>
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
              placeholder="Search by name, phone, email, company, notes..."
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
          <span>{query ? `Query: ${query}` : 'Showing all customers'}</span>
        </div>

        {results.length === 0 ? (
          <div className="empty-state">No customer matched this search.</div>
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
                    <span className={`status-pill ${customer.status.toLowerCase()}`}>{customer.status}</span>
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
