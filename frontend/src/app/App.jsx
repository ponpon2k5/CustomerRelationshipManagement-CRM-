import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { createCustomer, deactivateCustomer as deactivateCustomerApi, getCustomerById, getCustomers, updateCustomer } from '../services/customerApi'
import { login, register } from '../services/authApi'

const currentUser = {
  name: 'Amelia Burrows',
  role: 'Admin',
}

const DEFAULT_CREATED_BY_ID = Number(import.meta.env.VITE_CREATED_BY_ID || 1)

const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)

const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const IconEyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

const IconFb = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
)

const IconGoogle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

const IconLinkedIn = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

const initialCustomers = [
  {
    id: 1,
    name: 'Skinder Pharma',
    phone: '+1 415 555 0137',
    normalizedPhone: '14155550137',
    email: 'procurement@skinderpharma.com',
    address: '204 Market Street, San Francisco',
    companyName: 'Skinder Pharma',
    status: 'Active',
    createdAt: '2026-05-19T08:15:00',
    createdBy: 'Amelia Burrows',
    updatedAt: '2026-05-19T08:15:00',
    updatedBy: 'Amelia Burrows',
    deactivatedAt: '',
    deactivatedBy: '',
    notes: [
      { id: 101, text: 'Requested pricing for annual CRM support.', date: '2026-05-19T10:40:00' },
      { id: 102, text: 'Prefers email follow-up after demos.', date: '2026-05-18T14:10:00' },
    ],
    interactions: [
      { id: 201, type: 'Call', text: 'Qualification call completed.', date: '2026-05-19T09:20:00' },
      { id: 202, type: 'Email', text: 'Sent onboarding checklist.', date: '2026-05-18T16:30:00' },
    ],
  },
  {
    id: 2,
    name: 'Morlong Associates',
    phone: '+1 212 555 0199',
    normalizedPhone: '12125550199',
    email: 'hello@morlong.co',
    address: '82 Hudson Avenue, New York',
    companyName: 'Morlong Associates',
    status: 'Active',
    createdAt: '2026-05-18T13:45:00',
    createdBy: 'Raghav Rao',
    updatedAt: '2026-05-18T13:45:00',
    updatedBy: 'Raghav Rao',
    deactivatedAt: '',
    deactivatedBy: '',
    notes: [],
    interactions: [
      { id: 203, type: 'Meeting', text: 'Reviewed migration timeline.', date: '2026-05-18T15:00:00' },
    ],
  },
  {
    id: 3,
    name: 'Viva Health',
    phone: '+1 650 555 0144',
    normalizedPhone: '16505550144',
    email: 'care@vivahealth.com',
    address: '499 Castro Street, Mountain View',
    companyName: 'Viva Health',
    status: 'Active',
    createdAt: '2026-05-17T11:30:00',
    createdBy: 'Joane Lee',
    updatedAt: '2026-05-18T09:05:00',
    updatedBy: 'Amelia Burrows',
    deactivatedAt: '',
    deactivatedBy: '',
    notes: [
      { id: 103, text: 'Needs inactive-customer archive access for compliance.', date: '2026-05-18T11:12:00' },
    ],
    interactions: [],
  },
  {
    id: 4,
    name: 'BrekWire Inc.',
    phone: '+1 408 555 0171',
    normalizedPhone: '14085550171',
    email: 'ops@brekwire.com',
    address: '17 First Avenue, San Jose',
    companyName: 'BrekWire Inc.',
    status: 'Inactive',
    createdAt: '2026-05-15T16:20:00',
    createdBy: 'Amelia Burrows',
    updatedAt: '2026-05-18T17:10:00',
    updatedBy: 'Amelia Burrows',
    deactivatedAt: '2026-05-18T17:10:00',
    deactivatedBy: 'Amelia Burrows',
    notes: [
      { id: 104, text: 'Archived after duplicate buying team was confirmed.', date: '2026-05-17T10:20:00' },
    ],
    interactions: [
      { id: 204, type: 'Email', text: 'Confirmed account deactivation.', date: '2026-05-18T17:05:00' },
    ],
  },
]

const navItems = ['Customers', 'Search', 'Profile']

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  companyName: '',
}

function mapApiCustomerToUi(customer) {
  return {
    id: customer.id,
    name: customer.fullName || '',
    phone: customer.phone || '',
    normalizedPhone: normalizePhone(customer.phone || ''),
    email: customer.email || '',
    address: customer.address || '',
    companyName: customer.company || '',
    status: customer.isActive ? 'Active' : 'Inactive',
    createdAt: customer.createdAt || '',
    createdBy: customer.createdById ? `User #${customer.createdById}` : '-',
    createdById: customer.createdById || DEFAULT_CREATED_BY_ID,
    updatedAt: customer.updatedAt || '',
    updatedBy: customer.createdById ? `User #${customer.createdById}` : '-',
    deactivatedAt: '',
    deactivatedBy: '',
    notes: [],
    interactions: [],
  }
}

function mapUiFormToCreatePayload(form) {
  return {
    fullName: form.name.trim(),
    phone: form.phone.trim(),
    email: form.email.trim().toLowerCase(),
    address: form.address.trim(),
    company: form.companyName.trim(),
    isActive: true,
    createdById: DEFAULT_CREATED_BY_ID,
  }
}

function mapUiFormToUpdatePayload(form, customer) {
  return {
    fullName: form.name.trim(),
    phone: form.phone.trim(),
    email: form.email.trim().toLowerCase(),
    address: form.address.trim(),
    company: form.companyName.trim(),
    isActive: customer.status === 'Active',
  }
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '')
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatDate(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function CRMLogin({ onLogin }) {
  const [page, setPage] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  const isLogin = page === 'login'

  function validateLogin() {
    const nextErrors = {}

    if (!email.trim()) nextErrors.email = 'Email không được để trống.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Email không đúng định dạng.'

    if (!password) nextErrors.password = 'Mật khẩu không được để trống.'
    else if (password.length < 6) nextErrors.password = 'Mật khẩu tối thiểu 6 ký tự.'

    if (!isLogin && !name.trim()) nextErrors.name = 'Họ tên không được để trống.'

    return nextErrors
  }

  function triggerShake() {
    setShake(true)
    window.setTimeout(() => setShake(false), 450)
  }

  function updateAuthField(field, value) {
    const setters = {
      email: setEmail,
      password: setPassword,
      name: setName,
    }

    setters[field](value)
    setErrors((current) => ({ ...current, [field]: '', general: '' }))
  }

  function switchMode() {
    setPage(isLogin ? 'signup' : 'login')
    setErrors({})
    setPassword('')
    setName('')
  }

  async function handleAuthSubmit(event) {
    event.preventDefault()

    const nextErrors = validateLogin()
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      triggerShake()
      return
    }

    setLoading(true)
    setErrors({})
    await new Promise((resolve) => {
      window.setTimeout(resolve, 700)
    })

    if (!isLogin) {
      try {
        await register({
          fullName: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        })
        setPage('login')
        setPassword('')
        setName('')
        setErrors({ general: 'Account created. Please sign in.' })
      } catch (error) {
        setErrors({ general: error.message || 'Sign-up failed.' })
        triggerShake()
      } finally {
        setLoading(false)
      }
      return
    }

    try {
      const loginResponse = await login({
        email: email.trim().toLowerCase(),
        password,
      })
      onLogin(loginResponse.fullName || loginResponse.email)
    } catch (error) {
      setErrors({ general: error.message || 'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.' })
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-shape coral" />
      <div className="login-shape gold" />
      <div className="login-shape teal" />

      <section className={`login-card ${shake ? 'shake' : ''}`} aria-label="CRM authentication">
        <aside className="login-panel">
          <div className="panel-diamond one" />
          <div className="panel-diamond two" />
          <div className="panel-diamond three" />

          <div className="login-brand">
            <span className="login-logo">D</span>
            <strong>Diprella CRM</strong>
          </div>

          <div className="login-copy">
            <h1>{isLogin ? 'Welcome Back!' : 'Join Diprella!'}</h1>
            <p>
              {isLogin
                ? 'Đăng nhập để tiếp tục quản lý khách hàng, ghi chú và lịch sử tương tác.'
                : 'Tạo tài khoản để bắt đầu theo dõi khách hàng trong dashboard CRM.'}
            </p>
            <button type="button" onClick={switchMode}>
              {isLogin ? 'Đăng ký' : 'Đăng nhập'}
            </button>
          </div>
        </aside>

        <form className="auth-form" onSubmit={handleAuthSubmit}>
          <div>
            <p className="eyebrow">Customer Relationship Management</p>
            <h2>{isLogin ? 'Đăng Nhập' : 'Tạo Tài Khoản'}</h2>
          </div>

          <div className="social-row" aria-label="Social login options">
            <button type="button"><IconFb />Facebook</button>
            <button type="button"><IconGoogle />Google</button>
            <button type="button"><IconLinkedIn />LinkedIn</button>
          </div>

          <div className="divider">
            <span />
            <small>hoặc dùng email</small>
            <span />
          </div>

          {errors.general && (
            <div className={`auth-message ${errors.general.includes('Tài khoản') ? 'success' : ''}`}>
              {errors.general}
            </div>
          )}

          <div className="auth-fields">
            {!isLogin && (
              <AuthField
                error={errors.name}
                icon={<IconUser />}
                label="Họ và tên"
                onChange={(value) => updateAuthField('name', value)}
                placeholder="Họ và tên"
                value={name}
              />
            )}
            <AuthField
              error={errors.email}
              icon={<IconMail />}
              label="Email"
              onChange={(value) => updateAuthField('email', value)}
              placeholder="Email"
              type="email"
              value={email}
            />
            <AuthField
              error={errors.password}
              icon={<IconLock />}
              label="Mật khẩu"
              onChange={(value) => updateAuthField('password', value)}
              placeholder="Mật khẩu"
              rightControl={
                <button
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              }
              type={showPassword ? 'text' : 'password'}
              value={password}
            />
          </div>

          {isLogin && (
            <button className="forgot-link" type="button">
              Quên mật khẩu?
            </button>
          )}

          <button className="auth-submit" disabled={loading} type="submit">
            {loading && <span className="spinner" />}
            {loading ? 'Đang xử lý...' : isLogin ? 'Đăng Nhập' : 'Đăng Ký'}
          </button>

          {isLogin && (
            <p className="demo-hint">
              Use an existing backend user account.
            </p>
          )}
        </form>
      </section>
    </main>
  )
}

function AuthField({ error, icon, label, onChange, placeholder, rightControl, type = 'text', value }) {
  return (
    <label className={`auth-field ${error ? 'has-error' : ''}`}>
      <span className="sr-only">{label}</span>
      <span className="field-icon">{icon}</span>
      <input
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {rightControl}
      {error && <span className="auth-error">{error}</span>}
    </label>
  )
}

function CustomerDashboard({ onLogout, sessionUser }) {
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
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const [apiError, setApiError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function loadCustomers() {
    setIsLoadingCustomers(true)
    setApiError('')
    try {
      const response = await getCustomers()
      const mappedCustomers = response.map(mapApiCustomerToUi)
      setCustomers(mappedCustomers)
      setSelectedId((current) => {
        if (!mappedCustomers.length) return null
        if (current && mappedCustomers.some((customer) => customer.id === current)) return current
        return mappedCustomers[0].id
      })
    } catch (error) {
      setApiError(error.message || 'Failed to load customers.')
    } finally {
      setIsLoadingCustomers(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

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
    const phoneRaw = String(values.phone || '').trim()
    const normalizedPhone = normalizePhone(phoneRaw)
    const email = values.email.trim().toLowerCase()

    if (!values.name.trim()) nextErrors.name = 'Customer name is required.'
    if (!normalizedPhone) nextErrors.phone = 'Phone number is required.'
    else if (!/^[+\d\s().-]+$/.test(phoneRaw)) nextErrors.phone = 'Phone number contains invalid characters.'
    else if (normalizedPhone.length < 8 || normalizedPhone.length > 15) nextErrors.phone = 'Phone number must be 8-15 digits.'
    if (!email) nextErrors.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Email format is invalid.'

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

    setIsSaving(true)
    setApiError('')
    try {
      const createdCustomer = await createCustomer(mapUiFormToCreatePayload(form))
      const mappedCustomer = mapApiCustomerToUi(createdCustomer)
      setCustomers((current) => [mappedCustomer, ...current])
      setSelectedId(mappedCustomer.id)
      setActivePage('Customers')
      setForm(emptyForm)
      setDuplicateMatch(null)
      setAllowDuplicate(false)
      setShowCreateModal(false)
      setPage(1)
    } catch (error) {
      setApiError(error.message || 'Failed to create customer.')
    } finally {
      setIsSaving(false)
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
    setEditErrors((current) => ({ ...current, [field]: '' }))
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

    setIsSaving(true)
    setApiError('')
    try {
      const updatedCustomer = await updateCustomer(
        selectedCustomer.id,
        mapUiFormToUpdatePayload(editForm, selectedCustomer),
      )
      const mappedCustomer = mapApiCustomerToUi(updatedCustomer)
      setCustomers((current) =>
        current.map((customer) =>
          customer.id === selectedCustomer.id
            ? {
                ...customer,
                ...mappedCustomer,
                notes: customer.notes,
                interactions: customer.interactions,
              }
            : customer,
        ),
      )
      cancelEditCustomer()
    } catch (error) {
      setApiError(error.message || 'Failed to update customer.')
    } finally {
      setIsSaving(false)
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

    setIsSaving(true)
    setApiError('')
    try {
      const updatedCustomer = await deactivateCustomerApi(customerId)
      const mappedCustomer = mapApiCustomerToUi(updatedCustomer)
      const now = new Date().toISOString()
      const actor = sessionUser || currentUser.name

      setCustomers((current) =>
        current.map((customer) =>
          customer.id === customerId
            ? {
                ...customer,
                ...mappedCustomer,
                deactivatedAt: customer.deactivatedAt || now,
                deactivatedBy: customer.deactivatedBy || actor,
                updatedBy: actor,
                notes: customer.notes,
                interactions: customer.interactions,
              }
            : customer,
        ),
      )
      cancelEditCustomer()
    } catch (error) {
      setApiError(error.message || 'Failed to deactivate customer.')
    } finally {
      setIsSaving(false)
    }
  }

  async function openProfile(customerId) {
    setSelectedId(customerId)
    setActivePage('Profile')
    cancelEditCustomer()
    setApiError('')

    try {
      const customerDetail = await getCustomerById(customerId)
      const mappedCustomer = mapApiCustomerToUi(customerDetail)
      setCustomers((current) =>
        current.map((customer) =>
          customer.id === customerId
            ? {
                ...customer,
                ...mappedCustomer,
                notes: customer.notes,
                interactions: customer.interactions,
              }
            : customer,
        ),
      )
    } catch (error) {
      setApiError(error.message || 'Failed to load customer details.')
    }
  }

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
              onClick={() => {
                if (item === 'Customers' || item === 'Profile' || item === 'Search') {
                  setActivePage(item)
                  cancelEditCustomer()
                }
              }}
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

        {apiError && (
          <div className="api-banner">
            <span>{apiError}</span>
            <button type="button" onClick={() => setApiError('')}>Dismiss</button>
          </div>
        )}

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

            {isLoadingCustomers ? (
              <div className="empty-state">Loading customers...</div>
            ) : visibleCustomers.length === 0 ? (
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
                                openProfile(customer.id)
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
                    {errors.phone && <span className="field-error">{errors.phone}</span>}
                  </label>
                  <label>
                    Email
                    <input value={form.email} onChange={(event) => updateForm('email', event.target.value)} />
                    {errors.email && <span className="field-error">{errors.email}</span>}
                  </label>
                </div>
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
                  <button className="primary-button" disabled={isSaving} type="submit">
                    {isSaving ? 'Saving...' : 'Save Customer'}
                  </button>
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
                  <button
                    className="danger-button"
                    disabled={isSaving}
                    type="button"
                    onClick={() => deactivateCustomer(selectedCustomer.id)}
                  >
                    {isSaving ? 'Deactivating...' : 'Deactivate'}
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
                    {editErrors.phone && <span className="field-error">{editErrors.phone}</span>}
                  </label>
                  <label>
                    Email
                    <input value={editForm.email} onChange={(event) => updateEditForm('email', event.target.value)} />
                    {editErrors.email && <span className="field-error">{editErrors.email}</span>}
                  </label>
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
                    <button className="primary-button" disabled={isSaving} type="submit">
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
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
  const quickSearches = ['Skinder', 'Viva Health', 'inactive', 'email', 'onboarding', 'migration']
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

function App() {
  const [sessionUser, setSessionUser] = useState('')

  if (!sessionUser) {
    return <CRMLogin onLogin={setSessionUser} />
  }

  return (
    <CustomerDashboard
      sessionUser={sessionUser}
      onLogout={() => setSessionUser('')}
    />
  )
}

export default App

