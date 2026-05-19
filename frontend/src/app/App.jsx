import { useEffect,useMemo, useState } from 'react'
import { searchCustomers } from "../services/api/customerApi";
import AppLayout from '../components/AppLayout'
import CustomersPage from '../pages/CustomersPage'
import CustomerProfilePage from '../pages/CustomerProfilePage'
import LoginPage from '../pages/LoginPage'
import SearchPage from '../pages/SearchPage'
import {
  createCustomer,
  deactivateCustomer as deactivateCustomerRequest,
  getCustomers,
  updateCustomer,
} from '../services/customerApi'
import { emptyForm } from '../data/customers'
import { formatDate, normalizePhone } from '../utils/customerUtils'
import './App.css'

function App() {
  const [sessionUser, setSessionUser] = useState(null)
  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [selectedId, setSelectedId] = useState(null)
  const [activePage, setActivePage] = useState('Customers')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [sort, setSort] = useState({ key: 'createdAt', direction: 'desc' })
  const [page, setPage] = useState(1)
  const [errors, setErrors] = useState({})
  const [duplicateMatch, setDuplicateMatch] = useState(null)
  const [allowDuplicate, setAllowDuplicate] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editErrors, setEditErrors] = useState({})
  const [editDuplicateMatch, setEditDuplicateMatch] = useState(null)
  const [allowDuplicateUpdate, setAllowDuplicateUpdate] = useState(false)
  const [customerLoadError, setCustomerLoadError] = useState('')

  const activeUser = sessionUser
    ? {
        id: sessionUser.id,
        name: sessionUser.fullName || sessionUser.email || '',
        role: sessionUser.role || '',
      }
    : { id: null, name: '', role: '' }

  const visibleCustomers = useMemo(() => {
    return customers
      .filter((customer) => showInactive || customer.status === 'Active')
      .sort((a, b) => {
        const left = sort.key === 'name' ? a.name.toLowerCase() : a.createdAt
        const right = sort.key === 'name' ? b.name.toLowerCase() : b.createdAt
        const result = left.localeCompare(right)
        return sort.direction === 'asc' ? result : -result
      })
  }, [customers, showInactive, sort])

  const pageSize = 20
  const totalPages = Math.max(1, Math.ceil(visibleCustomers.length / pageSize))
  const pageCustomers = visibleCustomers.slice((page - 1) * pageSize, page * pageSize)
  const selectedCustomer = customers.find((customer) => customer.id === selectedId) || visibleCustomers[0]

  const activeCount = customers.filter((customer) => customer.status === 'Active').length
  const inactiveCount = customers.length - activeCount
  const createdToday = customers.filter((customer) => formatDate(customer.createdAt) === formatDate(new Date())).length

  function mapCustomerFromApi(customer) {
    return {
      id: customer.id,
      name: customer.fullName,
      phone: customer.phone,
      normalizedPhone: normalizePhone(customer.phone || ''),
      email: customer.email || '',
      address: customer.address || '',
      companyName: customer.company || '',
      status: customer.isActive ? 'Active' : 'Inactive',
      createdAt: customer.createdAt,
      createdBy: customer.createdById ? `User #${customer.createdById}` : '-',
      updatedAt: customer.updatedAt,
      updatedBy: '-',
      deactivatedAt: customer.isActive ? '' : customer.updatedAt,
      deactivatedBy: customer.isActive ? '' : '-',
      notes: [],
      interactions: [],
    }
  }

  async function loadCustomers() {
    setCustomerLoadError('')

    try {
      const data = await getCustomers()
      const nextCustomers = data.map(mapCustomerFromApi)
      setCustomers(nextCustomers)
      setSelectedId((currentId) => {
        if (nextCustomers.some((customer) => customer.id === currentId)) return currentId
        return nextCustomers[0]?.id ?? null
      })
    } catch (err) {
      setCustomerLoadError(err.message || 'Failed to load customers from Supabase.')
      setCustomers([])
      setSelectedId(null)
    }
  }

  useEffect(() => {
    if (sessionUser) {
      loadCustomers()
    }
  }, [sessionUser])

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setDuplicateMatch(null)
    setAllowDuplicate(false)
  }

 async function submitSearch(value = searchInput) {
  const nextQuery = value.trim()

  setSearchInput(nextQuery)
  setSearchQuery(nextQuery)
  setActivePage('Search')

  if (!nextQuery) {
    setCustomers([])
    return
  }

  try {
    const data = await searchCustomers(nextQuery)

    const mappedCustomers = data.map((customer) => ({
      id: customer.id,
      name: customer.fullName,
      phone: customer.phone || '',
      normalizedPhone: (customer.phone || '').replace(/\D/g, ''),
      email: customer.email || '',
      address: customer.address || '',
      companyName: customer.company || '',
      status: customer.isActive ? 'Active' : 'Inactive',
      createdAt: customer.createdAt,
      createdBy: 'System',
      updatedAt: customer.updatedAt,
      updatedBy: 'System',
      deactivatedAt: '',
      deactivatedBy: '',
      notes: [],
      interactions: [],
    }))

    setCustomers(mappedCustomers)
  } catch (error) {
    console.error('API ERROR:', error)
    alert('Cannot connect to backend API.')
  }
}

  function openCreateModal() {
    setForm(emptyForm)
    setErrors({})
    setDuplicateMatch(null)
    setAllowDuplicate(false)
    setShowCreateModal(true)
  }

  function closeCreateModal() {
    setShowCreateModal(false)
    setErrors({})
    setDuplicateMatch(null)
    setAllowDuplicate(false)
  }

  function validateCustomer(values, setErrorState) {
    const nextErrors = {}
    const normalizedPhone = normalizePhone(values.phone)
    const email = values.email.trim().toLowerCase()

    if (!values.name.trim()) nextErrors.name = 'Customer name is required.'
    if (!normalizedPhone && !email) nextErrors.contact = 'Enter phone number or email.'
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Email format is invalid.'

    setErrorState(nextErrors)
    return { isValid: Object.keys(nextErrors).length === 0, normalizedPhone, email }
  }

  function findDuplicateCustomer(normalizedPhone, email, ignoredCustomerId) {
    return customers.find((customer) => {
      if (customer.id === ignoredCustomerId) return false

      const samePhone = normalizedPhone && customer.normalizedPhone === normalizedPhone
      const sameEmail = email && customer.email.toLowerCase() === email
      return samePhone || sameEmail
    })
  }

  async function handleSaveCustomer(event) {
    event.preventDefault()

    const { isValid, normalizedPhone, email } = validateCustomer(form, setErrors)
    if (!isValid) return

    const duplicate = findDuplicateCustomer(normalizedPhone, email)

    if (duplicate && !allowDuplicate) {
      setDuplicateMatch(duplicate)
      return
    }

    try {
      const savedCustomer = await createCustomer({
        fullName: form.name.trim(),
        email,
        phone: form.phone.trim(),
        company: form.companyName.trim(),
        address: form.address.trim(),
        isActive: true,
        createdById: activeUser.id,
      })

      const nextCustomer = mapCustomerFromApi(savedCustomer)
      setCustomers((current) => [nextCustomer, ...current.filter((customer) => customer.id !== nextCustomer.id)])
      setSelectedId(nextCustomer.id)
      setActivePage('Customers')
      setForm(emptyForm)
      setDuplicateMatch(null)
      setAllowDuplicate(false)
      setShowCreateModal(false)
      setPage(1)
    } catch (err) {
      setErrors({ contact: err.message || 'Failed to save customer.' })
    }
  }

  function startEditCustomer(customer) {
    setEditForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      companyName: customer.companyName,
    })
    setEditErrors({})
    setEditDuplicateMatch(null)
    setAllowDuplicateUpdate(false)
    setIsEditing(true)
  }

  function updateEditForm(field, value) {
    setEditForm((current) => ({ ...current, [field]: value }))
    setEditErrors((current) => ({ ...current, [field]: '', contact: '' }))
    setEditDuplicateMatch(null)
    setAllowDuplicateUpdate(false)
  }

  function cancelEditCustomer() {
    setIsEditing(false)
    setEditErrors({})
    setEditDuplicateMatch(null)
    setAllowDuplicateUpdate(false)
  }

  async function handleUpdateCustomer(event) {
    event.preventDefault()

    if (!selectedCustomer) return

    const { isValid, normalizedPhone, email } = validateCustomer(editForm, setEditErrors)
    if (!isValid) return

    const duplicate = findDuplicateCustomer(normalizedPhone, email, selectedCustomer.id)

    if (duplicate && !allowDuplicateUpdate) {
      setEditDuplicateMatch(duplicate)
      return
    }

    try {
      const savedCustomer = await updateCustomer(selectedCustomer.id, {
        fullName: editForm.name.trim(),
        email,
        phone: editForm.phone.trim(),
        company: editForm.companyName.trim(),
        address: editForm.address.trim(),
        isActive: selectedCustomer.status === 'Active',
      })

      const nextCustomer = mapCustomerFromApi(savedCustomer)
      setCustomers((current) =>
        current.map((customer) => (customer.id === selectedCustomer.id ? nextCustomer : customer)),
      )
      cancelEditCustomer()
    } catch (err) {
      setEditErrors({ contact: err.message || 'Failed to update customer.' })
    }
  }

  function changeSort(key) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  async function deactivateCustomer(customerId) {
    const confirmed = window.confirm('Deactivate this customer?')
    if (!confirmed) return

    setIsEditing(false)

    try {
      const savedCustomer = await deactivateCustomerRequest(customerId)
      const nextCustomer = mapCustomerFromApi(savedCustomer)
      setCustomers((current) =>
        current.map((customer) => (customer.id === customerId ? nextCustomer : customer)),
      )
    } catch (err) {
      setCustomerLoadError(err.message || 'Failed to deactivate customer.')
    }
  }

  function navigateTo(item) {
    if (item === 'Customers' || item === 'Profile' || item === 'Search') {
      setActivePage(item)
      cancelEditCustomer()
    }
  }

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Epic 1 - Customer Management</p>
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
              submitSearch()
            }}
          >
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search customers, email, notes..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <button type="submit">Search</button>
          </form>
          <div className="user-chip">
            <span>{currentUser.role}</span>
            <strong>{sessionUser || currentUser.name}</strong>
            <button type="button" onClick={onLogout}>Đăng xuất</button>
          </div>
        </header>

        {activePage === 'Search' ? (
          <SearchPage
            customers={customers}
            query={searchQuery}
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            onSearch={submitSearch}
            onOpenProfile={(customerId) => {
              setSelectedId(customerId)
              setActivePage('Profile')
              cancelEditCustomer()
            }}
          />
        ) : activePage === 'Customers' ? (
          <>
        <section className="metrics" aria-label="Customer metrics">
          <article>
            <span>Active Customers</span>
            <strong>{activeCount}</strong>
          </article>
          <article>
            <span>Inactive Archive</span>
            <strong>{inactiveCount}</strong>
          </article>
          <article>
            <span>Created Today</span>
            <strong>{createdToday}</strong>
          </article>
          <article>
            <span>Default Page Size</span>
            <strong>20</strong>
          </article>
        </section>

        <div className="content-grid">
          <section className="panel table-panel" aria-labelledby="list-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Customer List</p>
                <h2 id="list-title">20 Customers Per Page</h2>
              </div>
              <div className="list-actions">
                <button className="primary-button" type="button" onClick={openCreateModal}>
                  Create Customer
                </button>
                <label className="toggle-line">
                  <input
                    checked={showInactive}
                    type="checkbox"
                    onChange={(event) => {
                      setShowInactive(event.target.checked)
                      setPage(1)
                    }}
                  />
                  Show inactive
                </label>
              </div>
            </div>

            {visibleCustomers.length === 0 ? (
              <div className="empty-state">No customers found.</div>
            ) : (
              <>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>
                          <button type="button" onClick={() => changeSort('name')}>Customer Name</button>
                        </th>
                        <th>Phone Number</th>
                        <th>Email</th>
                        <th>Company Name</th>
                        <th>
                          <button type="button" onClick={() => changeSort('createdAt')}>Created Date</button>
                        </th>
                        <th>Profile</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageCustomers.map((customer) => (
                        <tr
                          className={selectedCustomer?.id === customer.id ? 'selected-row' : ''}
                          key={customer.id}
                          onClick={() => {
                            setSelectedId(customer.id)
                            cancelEditCustomer()
                          }}
                        >
                          <td>
                            <strong>{customer.name}</strong>
                            <span className={`status-pill ${customer.status.toLowerCase()}`}>{customer.status}</span>
                          </td>
                          <td>{customer.phone || '-'}</td>
                          <td>{customer.email || '-'}</td>
                          <td>{customer.companyName || '-'}</td>
                          <td>{formatDate(customer.createdAt)}</td>
                          <td>
                            <button
                              className="table-action"
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                setSelectedId(customer.id)
                                cancelEditCustomer()
                                setActivePage('Profile')
                              }}
                            >
                              Detail Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="pagination">
                  <button disabled={page === 1} type="button" onClick={() => setPage((current) => current - 1)}>
                    Previous
                  </button>
                  <span>Page {page} of {totalPages}</span>
                  <button
                    disabled={page === totalPages}
                    type="button"
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </section>
        </div>

        {showCreateModal && (
          <div className="modal-backdrop" role="presentation" onMouseDown={closeCreateModal}>
            <section
              className="panel create-modal"
              aria-labelledby="create-title"
              role="dialog"
              aria-modal="true"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Create New Customer</p>
                  <h2 id="create-title">Basic Contact Information</h2>
                </div>
                <button className="secondary-button" type="button" onClick={closeCreateModal}>
                  Close
                </button>
              </div>

              <form className="customer-form" onSubmit={handleSaveCustomer}>
                <label>
                  Customer name
                  <input value={form.name} onChange={(event) => updateForm('name', event.target.value)} />
                  {errors.name && <span className="field-error">{errors.name}</span>}
                </label>
                <div className="form-row">
                  <label>
                    Phone number
                    <input value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} />
                  </label>
                  <label>
                    Email
                    <input value={form.email} onChange={(event) => updateForm('email', event.target.value)} />
                    {errors.email && <span className="field-error">{errors.email}</span>}
                  </label>
                </div>
                {errors.contact && <span className="field-error">{errors.contact}</span>}
                <label>
                  Address
                  <input value={form.address} onChange={(event) => updateForm('address', event.target.value)} />
                </label>
                <label>
                  Company name
                  <input value={form.companyName} onChange={(event) => updateForm('companyName', event.target.value)} />
                </label>

                {duplicateMatch && (
                  <div className="duplicate-alert">
                    <strong>This customer may already exist.</strong>
                    <span>Matched with {duplicateMatch.name}. Confirm to save anyway.</span>
                    <label className="confirm-line">
                      <input
                        checked={allowDuplicate}
                        type="checkbox"
                        onChange={(event) => setAllowDuplicate(event.target.checked)}
                      />
                      I confirm this is not a duplicate
                    </label>
                  </div>
                )}

                <div className="form-actions">
                  <button className="primary-button" type="submit">Save Customer</button>
                  <button className="secondary-button" type="button" onClick={closeCreateModal}>Cancel</button>
                </div>
              </form>
            </section>
          </div>
        )}

          </>
        ) : selectedCustomer ? (
          <>
          <section className="panel detail-panel" aria-labelledby="detail-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Customer Profile</p>
                <h2 id="detail-title">{selectedCustomer.name}</h2>
              </div>
              <div className="detail-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    setActivePage('Customers')
                    cancelEditCustomer()
                  }}
                >
                  Back to List
                </button>
                {!isEditing && (
                  <button className="secondary-button" type="button" onClick={() => startEditCustomer(selectedCustomer)}>
                    Edit
                  </button>
                )}
                {currentUser.role === 'Admin' && selectedCustomer.status === 'Active' && !isEditing && (
                  <button className="danger-button" type="button" onClick={() => deactivateCustomer(selectedCustomer.id)}>
                    Deactivate
                  </button>
                )}
              </div>
            </div>

            <div className="detail-grid">
              {isEditing ? (
                <form className="edit-customer-form" onSubmit={handleUpdateCustomer}>
                  <label>
                    Customer name
                    <input value={editForm.name} onChange={(event) => updateEditForm('name', event.target.value)} />
                    {editErrors.name && <span className="field-error">{editErrors.name}</span>}
                  </label>
                  <label>
                    Phone number
                    <input value={editForm.phone} onChange={(event) => updateEditForm('phone', event.target.value)} />
                  </label>
                  <label>
                    Email
                    <input value={editForm.email} onChange={(event) => updateEditForm('email', event.target.value)} />
                    {editErrors.email && <span className="field-error">{editErrors.email}</span>}
                  </label>
                  {editErrors.contact && <span className="field-error">{editErrors.contact}</span>}
                  <label>
                    Address
                    <input value={editForm.address} onChange={(event) => updateEditForm('address', event.target.value)} />
                  </label>
                  <label>
                    Company name
                    <input
                      value={editForm.companyName}
                      onChange={(event) => updateEditForm('companyName', event.target.value)}
                    />
                  </label>

                  {editDuplicateMatch && (
                    <div className="duplicate-alert">
                      <strong>This customer may already exist.</strong>
                      <span>Matched with {editDuplicateMatch.name}. Confirm to update anyway.</span>
                      <label className="confirm-line">
                        <input
                          checked={allowDuplicateUpdate}
                          type="checkbox"
                          onChange={(event) => setAllowDuplicateUpdate(event.target.checked)}
                        />
                        I confirm this is not a duplicate
                      </label>
                    </div>
                  )}

                  <div className="locked-meta">
                    <span>Created date and created by are locked.</span>
                    <strong>{formatDateTime(selectedCustomer.createdAt)} · {selectedCustomer.createdBy}</strong>
                  </div>

                  <div className="form-actions">
                    <button className="primary-button" type="submit">Save Changes</button>
                    <button className="secondary-button" type="button" onClick={cancelEditCustomer}>Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="info-list">
                  <span>Phone</span><strong>{selectedCustomer.phone || '-'}</strong>
                  <span>Email</span><strong>{selectedCustomer.email || '-'}</strong>
                  <span>Address</span><strong>{selectedCustomer.address || '-'}</strong>
                  <span>Company</span><strong>{selectedCustomer.companyName || '-'}</strong>
                  <span>Created</span><strong>{formatDateTime(selectedCustomer.createdAt)}</strong>
                  <span>Created By</span><strong>{selectedCustomer.createdBy}</strong>
                  <span>Updated</span><strong>{formatDateTime(selectedCustomer.updatedAt)}</strong>
                  <span>Updated By</span><strong>{selectedCustomer.updatedBy}</strong>
                  {selectedCustomer.status === 'Inactive' && (
                    <>
                      <span>Deactivated</span><strong>{formatDateTime(selectedCustomer.deactivatedAt)}</strong>
                      <span>Deactivated By</span><strong>{selectedCustomer.deactivatedBy}</strong>
                    </>
                  )}
                </div>
              )}
            </div>
          </section>
          <section className="profile-history-grid" aria-label="Customer notes and interaction history">
            <div className="panel history-panel">
              <Timeline title="Notes" items={selectedCustomer.notes} emptyText="No notes for this customer." />
            </div>
            <div className="panel history-panel">
              <Timeline
                title="Interaction History"
                items={selectedCustomer.interactions}
                emptyText="No interactions for this customer."
              />
            </div>
          </section>
          </>
        ) : (
          <section className="panel detail-panel empty-profile">
            <div className="empty-state">Select a customer from the customer list first.</div>
          </section>
        )}
      </section>
    </main>
  )
}

function Timeline({ title, items, emptyText }) {
  const sortedItems = [...items].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="timeline">
      <h3>{title}</h3>
      {sortedItems.length === 0 ? (
        <div className="empty-inline">{emptyText}</div>
      ) : (
        sortedItems.map((item) => (
          <article key={item.id}>
            <span>{formatDateTime(item.date)}</span>
            <strong>{item.type ? `${item.type}: ` : ''}{item.text}</strong>
          </article>
        ))
      )}
    </div>
  )
}

function SearchPage({ customers, query, searchInput, setSearchInput, onSearch, onOpenProfile }) {
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const quickSearches = ['Skinder', 'Viva Health', 'inactive', 'email', 'onboarding', 'migration']
  const normalizedQuery = query.trim().toLowerCase()

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

      const mappedSuggestions = data.map((customer) => ({
        id: customer.id,
        name: customer.fullName,
        phone: customer.phone || '',
        email: customer.email || '',
        companyName: customer.company || '',
        status: customer.isActive ? 'Active' : 'Inactive',
      }))

      setSuggestions(mappedSuggestions.slice(0, 5))
      setShowSuggestions(true)
    } catch (error) {
      console.error('Suggestion API error:', error)
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

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
              setShowSuggestions(false)
              onSearch(searchInput)
            }}
          >
            <span aria-hidden="true">⌕</span>
            <input
              value={searchInput}
              onChange={(event) => handleSuggest(event.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true)
              }}
              placeholder="Search by name, phone, email..."
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
                ×
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
                  <span>{customer.phone || '-'} · {customer.email || '-'}</span>
                </button>
              ))}
            </div>
          )}

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

function App() {
  const [sessionUser, setSessionUser] = useState('')
  function openProfile(customerId) {
    setSelectedId(customerId)
    setActivePage('Profile')
    cancelEditCustomer()
  }

  if (!sessionUser) {
    return <LoginPage onLogin={setSessionUser} />
  }

  return (
    <AppLayout
      activePage={activePage}
      onLogout={() => setSessionUser('')}
      onNavigate={navigateTo}
      onSearch={submitSearch}
      searchInput={searchInput}
      sessionUser={sessionUser}
      setSearchInput={setSearchInput}
    >
      {activePage === 'Search' ? (
        <SearchPage
          customers={customers}
          query={searchQuery}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          onSearch={submitSearch}
          onOpenProfile={openProfile}
        />
      ) : activePage === 'Customers' ? (
        <CustomersPage
          activeCount={activeCount}
          allowDuplicate={allowDuplicate}
          createdToday={createdToday}
          duplicateMatch={duplicateMatch}
          errors={errors}
          form={form}
          inactiveCount={inactiveCount}
          onChangeSort={changeSort}
          onCloseCreate={closeCreateModal}
          onOpenCreate={openCreateModal}
          onOpenProfile={openProfile}
          onSaveCustomer={handleSaveCustomer}
          onSelectCustomer={(customerId) => {
            setSelectedId(customerId)
            cancelEditCustomer()
          }}
          onShowInactiveChange={(checked) => {
            setShowInactive(checked)
            setPage(1)
          }}
          onToggleDuplicate={setAllowDuplicate}
          onUpdateForm={updateForm}
          page={page}
          pageCustomers={pageCustomers}
          selectedCustomer={selectedCustomer}
          setPage={setPage}
          showCreateModal={showCreateModal}
          showInactive={showInactive}
          totalPages={totalPages}
          visibleCustomers={visibleCustomers}
        />
      ) : (
        <CustomerProfilePage
          allowDuplicateUpdate={allowDuplicateUpdate}
          editDuplicateMatch={editDuplicateMatch}
          editErrors={editErrors}
          editForm={editForm}
          isEditing={isEditing}
          onBackToList={() => {
            setActivePage('Customers')
            cancelEditCustomer()
          }}
          onCancelEdit={cancelEditCustomer}
          onDeactivate={deactivateCustomer}
          onSave={handleUpdateCustomer}
          onStartEdit={startEditCustomer}
          onToggleDuplicate={setAllowDuplicateUpdate}
          onUpdateForm={updateEditForm}
          selectedCustomer={selectedCustomer}
          user={activeUser}
        />
      )}
    </AppLayout>
  )
}

export default App