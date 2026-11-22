import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { backend } from '../api.js'

import Layout from '../components/Layout.jsx'
import TextField from '../components/TextField.jsx'
import Button from '../components/Button.jsx'

function SignIn() {
  const navigate = useNavigate()
  const emailRef = useRef(null)
  const passwordRef = useRef(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [signingIn, setSigningIn] = useState(false)
  const requestRef = useRef(null)

  // leaving the page mid request must not navigate afterwards
  useEffect(() => () => requestRef.current?.abort(), [])

  function handleSubmit(event) {
    event.preventDefault()
    const typedEmail = email.trim()
    setSubmitError('')

    if (!typedEmail) {
      setEmailError('Enter your email.')
      emailRef.current.focus()
      return
    }
    if (!password) {
      setPasswordError('Enter your password.')
      passwordRef.current.focus()
      return
    }

    setSigningIn(true)
    requestRef.current = new AbortController()

    backend
      .post(
        '/api/auth/sign-in',
        { email: typedEmail, password: password },
        { signal: requestRef.current.signal },
      )
      .then(() => {
        navigate('/', { replace: true })
      })
      .catch(error => {
        if (error.name === 'CanceledError') {
          return
        }

        if (
          error.response &&
          error.response.data &&
          error.response.data.error
        ) {
          setSubmitError(error.response.data.error)
        } else {
          setSubmitError('Could not sign in. Try again.')
        }

        setSigningIn(false)
      })
  }

  return (
    <Layout title="Split">
      <h1 className="text-heading font-bold">Sign in</h1>
      <p className="mt-2 text-body text-muted">
        Organizers sign in to create and manage events.
      </p>
      <form noValidate onSubmit={handleSubmit} className="mt-4">
        <TextField
          ref={emailRef}
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={event => {
            setEmail(event.target.value)
            setEmailError('')
            setPasswordError('')
          }}
          error={emailError}
        />
        <TextField
          ref={passwordRef}
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={event => {
            setPassword(event.target.value)
            setPasswordError('')
          }}
          error={passwordError}
          className="mt-4"
        />
        {submitError && (
          <p role="alert" className="mt-4 text-sm font-semibold">
            {submitError}
          </p>
        )}
        <Button type="submit" disabled={signingIn} className="mt-4">
          {signingIn ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <Button variant="text" to="/register" className="mt-3">
        New here? Create an account
      </Button>
    </Layout>
  )
}

export default SignIn
