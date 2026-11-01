import Layout from '../components/Layout.jsx'
import { Link } from 'react-router-dom'
import { useState } from 'react'

import api from '../api.js'
import './Register.css'

function Register() {
  const [message, setMessage] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    const email = event.target.email.value
    const password = event.target.password.value

    if (email === '') {
      setMessage('Please enter your email.')
      return
    }

    if (password === '') {
      setMessage('Please enter your password.')
      return
    }

    api.get('/user.json').then(function (resp) {
      if (email === resp.data.email) {
        setMessage('Account register with this email already exists.')
        return
      }
      setMessage('Form checked. No account has been created.')
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
          <input id="password" name="password" type="password" />
        </p>

        <button type="submit">Create account</button>
        <p>{message}</p>
      </form>
      <p>
        Already have an account? <Link to="/sign-in">Sign in</Link>
      </p>
    </Layout>
  )
}

export default Register
