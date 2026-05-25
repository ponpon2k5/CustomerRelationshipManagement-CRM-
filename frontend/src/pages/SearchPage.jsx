import { useMemo, useState } from 'react'
import { formatDate } from '../utils/customerUtils'
import { searchCustomers } from '../services/customerApi'

const CUSTOMER_STAGES = ['ALL', 'LEAD', 'POTENTIAL', 'OPPORTUNITY', 'CUSTOMER', 'INACTIVE', 'LOST']

export default function SearchPage({ customers, query, searchInput, setSearchInput, onSearch, onOpenProfile }) {
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [stageFilter, setStageFilter] = useState('ALL')

  const quickSearches = [
    ...customers.slice(0, 3).map((customer) => customer.name).filter(Boolean),
    ...customers.slice(0, 1).map((customer) => customer.phone).filter(Boolean),
    ...customers.slice(0, 1).map((customer) => customer.email).filter(Boolean),
  ]

  const normalizedQuery = query.trim().toLowerCase()
  const normalizedPhoneQuery = query.replace(/\D/g, '')

  async function handleSuggest(value) {
    setSearchInput(value)

    const keyword = value.trim()

    if (keyword.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      const data = await searchCustomers(keyword)

      const nextSuggestions = data.slice(0, 5).map((customer) => ({
        id: customer.id,
        name: customer.fullName || '',
        phone: customer.phone || '',
        email: customer.email || '',
      }))

      setSuggestions(nextSuggestions)
      setShowSuggestions(nextSuggestions.length > 0)
    } catch (error) {
      console.error('Suggestion error:', error)
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const results = useMemo(() => {
    const stageFiltered = stageFilter === 'ALL'
      ? customers
      : customers.filter((customer) => String(customer.customerStage || 'LEAD').toUpperCase() === stageFilter)

    if (!normalizedQuery) return stageFiltered

    return stageFiltered.filter((customer) => {
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
  }, [customers, normalizedPhoneQuery, normalizedQuery, stageFilter])

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
              setShowSuggestions(false)
              onSearch(searchInput)
            }}
          >
            <span className="search-hero-icon" aria-hidden="true" />

            <input
              value={searchInput}
              onChange={(event) => handleSuggest(event.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true)
              }}
              placeholder="Search by name, phone, or email..."
              type="search"
            />

            {searchInput && (
              <button
                className="clear-search"
                type="button"
                onClick={() => {
                  setSearchInput('')
                  setSuggestions([])
                  setShowSuggestions(false)
                  onSearch('')
                }}
              >
                x
              </button>
            )}

            <button className="hero-search-button" type="submit">Search</button>
          </form>

          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestion-box">
              {suggestions.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  className="suggestion-item"
                  onClick={() => {
                    setSearchInput(customer.name)
                    setShowSuggestions(false)
                    onSearch(customer.name)
                  }}
                >
                  <strong>{customer.name}</strong>
                  <span>{customer.phone || '-'} | {customer.email || '-'}</span>
                </button>
              ))}
            </div>
          )}

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

        <div className="customer-filters" aria-label="Search filters">
          <label>
            Customer stage
            <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}>
              {CUSTOMER_STAGES.map((stage) => (
                <option key={stage} value={stage}>{stage === 'ALL' ? 'All stages' : stage}</option>
              ))}
            </select>
          </label>
        </div>

        {results.length === 0 ? (
          <div className="empty-state">
            No customers match current search and stage filter.
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
                      <p>{customer.companyName || 'No company'} | {customer.status} | {customer.customerStage || 'LEAD'}</p>
                    </div>

                    <div className="result-badges">
                      <span className="match-pill">{getMatchedBy(customer)}</span>
                      <span className="match-pill">{customer.customerStage || 'LEAD'}</span>
                      <span className={`status-pill ${customer.status.toLowerCase()}`}>{customer.status}</span>
                    </div>
                  </div>

                  <div className="result-meta-grid">
                    <span>Phone<strong>{customer.phone || '-'}</strong></span>
                    <span>Email<strong>{customer.email || '-'}</strong></span>
                    <span>Created<strong>{formatDate(customer.createdAt)}</strong></span>
                    <span>Activity<strong>{customer.notes.length} notes | {customer.interactions.length} interactions</strong></span>
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
