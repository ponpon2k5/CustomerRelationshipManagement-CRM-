import { useMemo, useState } from 'react'

const roles = ['STAFF', 'MANAGER', 'ADMIN']

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

const emptyUserForm = {
  fullName: '',
  email: '',
  password: '',
  role: 'STAFF',
  isActive: true,
}

export default function CreateUserModal({ error, loading, onClose, onCreate }) {
  const [form, setForm] = useState(emptyUserForm)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)

  const canSubmit = useMemo(() => {
    return form.fullName.trim() && form.email.trim() && form.password && form.role
  }, [form])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  function validate() {
    const nextErrors = {}
    const email = form.email.trim().toLowerCase()

    if (!form.fullName.trim()) nextErrors.fullName = 'Full name is required.'
    if (!email) nextErrors.email = 'Email is required.'
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Email format is invalid.'
    }
    if (!form.password) nextErrors.password = 'Password is required.'
    if (form.password && form.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.'
    }
    if (!roles.includes(form.role)) nextErrors.role = 'Role is invalid.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return

    onCreate({
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
      isActive: form.isActive,
    })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="panel create-modal user-modal" aria-labelledby="create-user-title">
        <div className="panel-heading">
          <div>
            <h2 id="create-user-title">Create User Account</h2>
          </div>
          <button className="secondary-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="customer-form" onSubmit={handleSubmit}>
          {error && <div className="field-error form-message">{error}</div>}

          <label>
            Full name
            <input
              autoFocus
              value={form.fullName}
              onChange={(event) => updateField('fullName', event.target.value)}
            />
            {errors.fullName && <span className="field-error">{errors.fullName}</span>}
          </label>

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </label>

          <div className="form-row">
            <label>
              Password
              <span className="password-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                />
                <button
                  className="password-toggle"
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </span>
              {errors.password && <span className="field-error">{errors.password}</span>}
            </label>

            <label>
              Role
              <select
                className="role-select"
                value={form.role}
                onChange={(event) => updateField('role', event.target.value)}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              {errors.role && <span className="field-error">{errors.role}</span>}
            </label>
          </div>

          <div className="account-status-card">
            <div>
              <strong>Account status</strong>
              <span>{form.isActive ? 'User can sign in and use the CRM.' : 'User is disabled and cannot sign in.'}</span>
            </div>
            <label className="status-switch">
              <input
                checked={form.isActive}
                type="checkbox"
                onChange={(event) => updateField('isActive', event.target.checked)}
              />
              <span aria-hidden="true" />
              <strong className={`status-pill ${form.isActive ? '' : 'inactive'}`}>
                {form.isActive ? 'ACTIVE' : 'INACTIVE'}
              </strong>
            </label>
          </div>

          <div className="form-actions">
            <button className="secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-button" disabled={!canSubmit || loading} type="submit">
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
