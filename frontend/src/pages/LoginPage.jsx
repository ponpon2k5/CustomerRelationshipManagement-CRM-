import { useState } from 'react'
import { login } from '../services/authApi'

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

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  function validateLogin() {
    const nextErrors = {}

    if (!email.trim()) nextErrors.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Email format is invalid.'

    if (!password) nextErrors.password = 'Password is required.'
    else if (password.length < 6) nextErrors.password = 'Password must be at least 6 characters.'

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
    }

    setters[field](value)
    setErrors((current) => ({ ...current, [field]: '', general: '' }))
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

    try {
      const user = await login({
        email: email.trim(),
        password,
      })
      onLogin(user)
    } catch (err) {
      setErrors({ general: err.message || 'Email or password is incorrect. Please try again.' })
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
            <h1>Welcome Back!</h1>
            <p>Sign in to continue managing customers and interaction history.</p>
          </div>
        </aside>

        <form className="auth-form" onSubmit={handleAuthSubmit}>
          <div>
            <p className="eyebrow">Customer Relationship Management</p>
            <h2>Login</h2>
          </div>

          {errors.general && (
            <div className={`auth-message ${errors.general.includes('Tài khoản') ? 'success' : ''}`}>
              {errors.general}
            </div>
          )}

          <div className="auth-fields">
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
              label="Password"
              onChange={(value) => updateAuthField('password', value)}
              placeholder="Password"
              rightControl={
                <button
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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

          <button className="forgot-link" type="button">
            Forgot password?
          </button>

          <button className="auth-submit" disabled={loading} type="submit">
            {loading && <span className="spinner" />}
            {loading ? 'Processing...' : 'Login'}
          </button>

        </form>
      </section>
    </main>
  )
}
