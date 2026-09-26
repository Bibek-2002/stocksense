import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function errorMessage(error) {
  return error.response?.data?.message || error.response?.data?.error || 'Unable to sign in. Check your details and try again.'
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <Link className="brand-lockup" to="/login" aria-label="StockSense home">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span className="brand-name">StockSense</span>
        </Link>
        <div className="auth-message">
          <p className="eyebrow">Inventory, in good order</p>
          <h1>Know what’s on your shelves.</h1>
          <p>One clear view of products, places, and every stock movement.</p>
        </div>
        <p className="auth-meta">Warehouse operations · Stock control</p>
      </aside>
      <section className="auth-panel" aria-labelledby="login-heading">
        <div className="auth-form-wrap">
          <Link className="brand-lockup" to="/login" aria-label="StockSense home">
            <span className="brand-mark" aria-hidden="true">S</span>
            <span className="brand-name">StockSense</span>
          </Link>
          <h2 id="login-heading">Welcome back</h2>
          <p className="form-intro">Sign in to continue to your inventory.</p>
          <form className="auth-form" onSubmit={handleSubmit} aria-busy={isSubmitting}>
            <div className="field">
              <label htmlFor="login-email">Email address</label>
              <input id="login-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={isSubmitting} />
            </div>
            <div className="field">
              <label htmlFor="login-password">Password</label>
              <input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} disabled={isSubmitting} />
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="submit-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="auth-switch">New to StockSense? <Link className="text-link" to="/signup">Create an account</Link></p>
        </div>
      </section>
    </main>
  )
}