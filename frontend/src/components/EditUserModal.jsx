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

export default function EditUserModal({ error, loading, onClose, onSave, user }) {
  const [form, setForm] = useState({
    fullName: user.fullName || '',
    email: user.email || '',
    password: '',
    role: user.role || 'STAFF',
    isActive: Boolean(user.isActive),
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)

  const canSubmit = useMemo(() => {
    return form.fullName.trim() && form.email.trim() && form.role
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
    const password = form.password.trim()

    if (password && password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.'
    }
    if (!roles.includes(form.role)) nextErrors.role = 'Role is invalid.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      isActive: form.isActive,
    }

    const password = form.password.trim()
    if (password) payload.password = password

    onSave(payload)
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="panel create-modal user-modal" aria-labelledby="edit-user-title">
        <div className="panel-heading">
          <div>
            <h2 id="edit-user-title">Edit User Account</h2>
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
              New password
              <span className="password-input-wrap">
                <input
                  placeholder="Leave blank to keep current password"
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
