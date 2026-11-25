import Layout from '../components/Layout.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

import { backend } from '../api.js'
import './Register.css'

function Register() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()

    const email = event.target.email.value
    const password = event.target.password.value

    if (submitting) return

    if (email === '') {
      setMessage('Please enter your email.')
      return
    }

    if (password === '') {
      setMessage('Please enter your password.')
      return
    }

    // the back-end creates the account, or says the email is in use (#107)
    setSubmitting(true)
    setMessage('')
    backend
      .post('/api/auth/register', { email, password })
      .then(() => {
        // the new account is signed in, so go to My Events like sign-in does
        navigate('/', { replace: true })
      })
      .catch(error => {
        // the server explains a 400 or 409; otherwise the request never got there
        setMessage(
          error.response?.data?.error ||
            'Could not create your account. Try again.',
        )
        setSubmitting(false)
      })
  }

  return (
    <Layout title="Split">
      <h1 className="text-heading font-bold">Register</h1>
      <form className="register-form" onSubmit={handleSubmit}>
        <p>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" name="email" />
        </p>

        <p>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" minLength={8} />
        </p>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
        <p role="alert">{message}</p>
      </form>
      <p>
        Already have an account? <Link to="/sign-in">Sign in</Link>
      </p>
    </Layout>
  )
}

export default Register