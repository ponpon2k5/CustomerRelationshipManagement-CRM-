import { useEffect, useMemo, useState } from 'react'
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

  function submitSearch(value = searchInput) {
    const nextQuery = value.trim()
    setSearchInput(nextQuery)
    setSearchQuery(nextQuery)
    setActivePage('Search')
    cancelEditCustomer()
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
