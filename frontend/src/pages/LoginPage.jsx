import { useEffect, useState } from 'react'
import { login, socialLogin } from '../services/authApi'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
  || '171585218856-fitg5j87i13pocbqetiod5hbjt15nee4.apps.googleusercontent.com'
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || '2455719344850331'

function loadExternalScript(src, id) {
  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(id)
    if (existingScript) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.id = id
    script.src = src
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

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
  const [socialLoading, setSocialLoading] = useState('')
  const [shake, setShake] = useState(false)

  useEffect(() => {
    loadExternalScript('https://accounts.google.com/gsi/client', 'google-identity-services').catch(() => {})
    loadExternalScript('https://connect.facebook.net/en_US/sdk.js', 'facebook-jssdk').catch(() => {})
  }, [])

  function validateLogin() {
    const nextErrors = {}

    if (!email.trim()) nextErrors.email = 'Email không được để trống.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Email không đúng định dạng.'

    if (!password) nextErrors.password = 'Mật khẩu không được để trống.'
    else if (password.length < 6) nextErrors.password = 'Mật khẩu tối thiểu 6 ký tự.'

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
      setErrors({ general: err.message || 'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.' })
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  async function handleSocialLogin(provider, getCredential) {
    setSocialLoading(provider)
    setErrors({})

    try {
      const credential = await getCredential()
      const user = await socialLogin({ provider, credential })
      onLogin(user)
    } catch (err) {
      setErrors({ general: err.message || 'Không thể đăng nhập bằng tài khoản mạng xã hội.' })
      triggerShake()
    } finally {
      setSocialLoading('')
    }
  }

  function requestGoogleAccessToken() {
    return new Promise((resolve, reject) => {
      loadExternalScript('https://accounts.google.com/gsi/client', 'google-identity-services')
        .then(() => {
          if (!window.google?.accounts?.oauth2) {
            reject(new Error('Không thể tải Google Login.'))
            return
          }

          const tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'openid email profile',
            callback: (response) => {
              if (response.error || !response.access_token) {
                reject(new Error('Google login bị hủy hoặc không hợp lệ.'))
                return
              }
              resolve(response.access_token)
            },
          })

          tokenClient.requestAccessToken()
        })
        .catch(() => reject(new Error('Không thể tải Google Login.')))
    })
  }

  function requestFacebookAccessToken() {
    return new Promise((resolve, reject) => {
      loadExternalScript('https://connect.facebook.net/en_US/sdk.js', 'facebook-jssdk')
        .then(() => {
          if (!window.FB) {
            reject(new Error('Không thể tải Facebook Login.'))
            return
          }

          window.FB.init({
            appId: FACEBOOK_APP_ID,
            cookie: true,
            version: 'v20.0',
          })

          window.FB.login((response) => {
            if (response.authResponse?.accessToken) {
              resolve(response.authResponse.accessToken)
              return
            }

            reject(new Error('Facebook login bị hủy hoặc không hợp lệ.'))
          }, { scope: 'email,public_profile', return_scopes: true })
        })
        .catch(() => reject(new Error('Không thể tải Facebook Login.')))
    })
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
            <p>Đăng nhập để tiếp tục quản lý khách hàng, tìm kiếm nhanh, ghi chú và lịch sử tương tác.</p>
          </div>
        </aside>

        <form className="auth-form" onSubmit={handleAuthSubmit}>
          <div>
            <p className="eyebrow">Customer Relationship Management</p>
            <h2>Đăng Nhập</h2>
          </div>

          <div className="social-row" aria-label="Social login options">
            <button
              disabled={Boolean(socialLoading)}
              type="button"
              onClick={() => handleSocialLogin('facebook', requestFacebookAccessToken)}
            >
              <IconFb />{socialLoading === 'facebook' ? 'Đang xử lý...' : 'Facebook'}
            </button>
            <button
              disabled={Boolean(socialLoading)}
              type="button"
              onClick={() => handleSocialLogin('google', requestGoogleAccessToken)}
            >
              <IconGoogle />{socialLoading === 'google' ? 'Đang xử lý...' : 'Google'}
            </button>
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

          <button className="forgot-link" type="button">
            Quên mật khẩu?
          </button>

          <button className="auth-submit" disabled={loading} type="submit">
            {loading && <span className="spinner" />}
            {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
          </button>

          <p className="demo-hint">
            Dùng tài khoản đã có trong bảng <code>users</code>
          </p>
        </form>
      </section>
    </main>
  )
}
