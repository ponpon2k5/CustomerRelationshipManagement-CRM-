import { useMemo, useState } from 'react'
import AppLayout from '../components/AppLayout'
import CustomersPage from '../pages/CustomersPage'
import CustomerProfilePage from '../pages/CustomerProfilePage'
import LoginPage from '../pages/LoginPage'
import SearchPage from '../pages/SearchPage'

import {
  createCustomer,
  getCustomers,
} from '../services/customerApi'

import { searchCustomers } from '../services/api/customerApi'

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

  const [sort, setSort] = useState({
    key: 'createdAt',
    direction: 'desc',
  })

  const [page, setPage] = useState(1)

  const [errors, setErrors] = useState({})

  const [duplicateMatch, setDuplicateMatch] = useState(null)
  const [allowDuplicate, setAllowDuplicate] = useState(false)

  const [showCreateModal, setShowCreateModal] = useState(false)

  const activeUser = sessionUser
    ? {
        id: sessionUser.id,
        name: sessionUser.fullName || sessionUser.email || '',
        role: sessionUser.role || '',
      }
    : {
        id: null,
        name: '',
        role: '',
      }

  function mapCustomerFromApi(customer) {
    return {
      id: customer.id,
      name: customer.fullName,
      phone: customer.phone || '',
      normalizedPhone: normalizePhone(customer.phone || ''),
      email: customer.email || '',
      address: customer.address || '',
      companyName: customer.company || '',
      status: customer.isActive ? 'Active' : 'Inactive',
      createdAt: customer.createdAt,
      createdBy: customer.createdById
        ? `User #${customer.createdById}`
        : '-',
      updatedAt: customer.updatedAt,
      updatedBy: '-',
      deactivatedAt: customer.isActive
        ? ''
        : customer.updatedAt,
      deactivatedBy: customer.isActive
        ? ''
        : '-',
      notes: [],
      interactions: [],
    }
  }

  async function loadCustomers() {
    try {
      const data = await getCustomers()

      const nextCustomers = data.map(mapCustomerFromApi)

      setCustomers(nextCustomers)

      setSelectedId((currentId) => {
        if (
          nextCustomers.some(
            (customer) => customer.id === currentId,
          )
        ) {
          return currentId
        }

        return nextCustomers[0]?.id ?? null
      })
    } catch (err) {
      console.error('LOAD CUSTOMERS ERROR:', err)

      setCustomers([])
      setSelectedId(null)
    }
  }

  async function handleLogin(user) {
    setSessionUser(user)

    await loadCustomers()
  }

  async function submitSearch(value = searchInput) {
    const nextQuery = value.trim()

    setSearchInput(nextQuery)
    setSearchQuery(nextQuery)
    setActivePage('Search')

    if (!nextQuery) {
      await loadCustomers()
      return
    }

    try {
      const data = await searchCustomers(nextQuery)

      const mappedCustomers = data.map(mapCustomerFromApi)

      setCustomers(mappedCustomers)
    } catch (error) {
      console.error('SEARCH API ERROR:', error)

      alert('Cannot connect to backend API.')
    }
  }

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    setErrors((current) => ({
      ...current,
      [field]: '',
    }))

    setDuplicateMatch(null)
    setAllowDuplicate(false)
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

    if (!values.name.trim()) {
      nextErrors.name = 'Customer name is required.'
    }

    if (!normalizedPhone && !email) {
      nextErrors.contact =
        'Enter phone number or email.'
    }

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      nextErrors.email =
        'Email format is invalid.'
    }

    setErrorState(nextErrors)

    return {
      isValid:
        Object.keys(nextErrors).length === 0,
      normalizedPhone,
      email,
    }
  }

  function findDuplicateCustomer(
    normalizedPhone,
    email,
    ignoredCustomerId,
  ) {
    return customers.find((customer) => {
      if (customer.id === ignoredCustomerId) {
        return false
      }

      const samePhone =
        normalizedPhone &&
        customer.normalizedPhone ===
          normalizedPhone

      const sameEmail =
        email &&
        customer.email.toLowerCase() === email

      return samePhone || sameEmail
    })
  }

  async function handleSaveCustomer(event) {
    event.preventDefault()

    const {
      isValid,
      normalizedPhone,
      email,
    } = validateCustomer(form, setErrors)

    if (!isValid) return

    const duplicate = findDuplicateCustomer(
      normalizedPhone,
      email,
    )

    if (duplicate && !allowDuplicate) {
      setDuplicateMatch(duplicate)
      return
    }

    try {
      const savedCustomer =
        await createCustomer({
          fullName: form.name.trim(),
          email,
          phone: form.phone.trim(),
          company: form.companyName.trim(),
          address: form.address.trim(),
          isActive: true,
          createdById: activeUser.id,
        })

      const nextCustomer =
        mapCustomerFromApi(savedCustomer)

      setCustomers((current) => [
        nextCustomer,
        ...current.filter(
          (customer) =>
            customer.id !== nextCustomer.id,
        ),
      ])

      setSelectedId(nextCustomer.id)

      setActivePage('Customers')

      setForm(emptyForm)

      setDuplicateMatch(null)
      setAllowDuplicate(false)

      setShowCreateModal(false)

      setPage(1)
    } catch (err) {
      setErrors({
        contact:
          err.message ||
          'Failed to save customer.',
      })
    }
  }

  const visibleCustomers = useMemo(() => {
    return customers
      .filter(
        (customer) =>
          showInactive ||
          customer.status === 'Active',
      )
      .sort((a, b) => {
        const left =
          sort.key === 'name'
            ? a.name.toLowerCase()
            : a.createdAt

        const right =
          sort.key === 'name'
            ? b.name.toLowerCase()
            : b.createdAt

        const result =
          left.localeCompare(right)

        return sort.direction === 'asc'
          ? result
          : -result
      })
  }, [customers, showInactive, sort])

  const pageSize = 20

  const totalPages = Math.max(
    1,
    Math.ceil(
      visibleCustomers.length / pageSize,
    ),
  )

  const pageCustomers =
    visibleCustomers.slice(
      (page - 1) * pageSize,
      page * pageSize,
    )

  const selectedCustomer =
    customers.find(
      (customer) =>
        customer.id === selectedId,
    ) || visibleCustomers[0]

  const activeCount = customers.filter(
    (customer) =>
      customer.status === 'Active',
  ).length

  const inactiveCount =
    customers.length - activeCount

  const createdToday = customers.filter(
    (customer) =>
      formatDate(customer.createdAt) ===
      formatDate(new Date()),
  ).length

  function changeSort(key) {
    setSort((current) => ({
      key,

      direction:
        current.key === key &&
        current.direction === 'asc'
          ? 'desc'
          : 'asc',
    }))
  }

  function navigateTo(item) {
    if (
      item === 'Customers' ||
      item === 'Profile' ||
      item === 'Search'
    ) {
      setActivePage(item)
    }
  }

  function openProfile(customerId) {
    setSelectedId(customerId)

    setActivePage('Profile')
  }

  if (!sessionUser) {
    return (
      <LoginPage onLogin={handleLogin} />
    )
  }

  return (
    <AppLayout
      activePage={activePage}
      onLogout={() => setSessionUser(null)}
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
          onSelectCustomer={setSelectedId}
          onShowInactiveChange={(
            checked,
          ) => {
            setShowInactive(checked)

            setPage(1)
          }}
          onToggleDuplicate={
            setAllowDuplicate
          }
          onUpdateForm={updateForm}
          page={page}
          pageCustomers={pageCustomers}
          selectedCustomer={selectedCustomer}
          setPage={setPage}
          showCreateModal={
            showCreateModal
          }
          showInactive={showInactive}
          totalPages={totalPages}
          visibleCustomers={
            visibleCustomers
          }
        />
      ) : (
        <CustomerProfilePage
          selectedCustomer={
            selectedCustomer
          }
          user={activeUser}
        />
      )}
    </AppLayout>
  )
}

export default App