import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function errorMessage(error) {
  return error.response?.data?.message || error.response?.data?.error || 'Unable to create your account. Review your details and try again.'
}

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await signup(name, email, password)
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
        <Link className="brand-lockup" to="/signup" aria-label="StockSense home">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span className="brand-name">StockSense</span>
        </Link>
        <div className="auth-message">
          <p className="eyebrow">A clearer stock picture</p>
          <h1>Make every movement count.</h1>
          <p>Set up your workspace to keep incoming, outgoing, and on-hand stock connected.</p>
        </div>
        <p className="auth-meta">Warehouse operations · Stock control</p>
      </aside>
      <section className="auth-panel" aria-labelledby="signup-heading">
        <div className="auth-form-wrap">
          <Link className="brand-lockup" to="/signup" aria-label="StockSense home">
            <span className="brand-mark" aria-hidden="true">S</span>
            <span className="brand-name">StockSense</span>
          </Link>
          <h2 id="signup-heading">Create your account</h2>
          <p className="form-intro">Start organizing your inventory operations.</p>
          <form className="auth-form" onSubmit={handleSubmit} aria-busy={isSubmitting}>
            <div className="field">
              <label htmlFor="signup-name">Full name</label>
              <input id="signup-name" type="text" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} disabled={isSubmitting} />
            </div>
            <div className="field">
              <label htmlFor="signup-email">Email address</label>
              <input id="signup-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={isSubmitting} />
            </div>
            <div className="field">
              <label htmlFor="signup-password">Password</label>
              <input id="signup-password" type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} disabled={isSubmitting} />
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="submit-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <p className="auth-switch">Already have an account? <Link className="text-link" to="/login">Sign in</Link></p>
        </div>
      </section>
    </main>
  )
}