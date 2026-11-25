import { Router } from 'express'
import user from '../mock/user.json' with { type: 'json' }
import newAccount from '../mock/register.json' with { type: 'json' }

const router = Router()

router.post('/sign-in', (req, res) => {
  const body = req.body

  if (!body) {
    res.status(400).json({ error: 'Enter your email and password.' })
    return
  }

  const email = body.email
  const password = body.password

  if (typeof email !== 'string' || email.trim() === '') {
    res.status(400).json({ error: 'Enter your email.' })
    return
  }

  if (typeof password !== 'string' || password.trim() === '') {
    res.status(400).json({ error: 'Enter your password.' })
    return
  }

  if (email.trim().toLowerCase() !== user.email.toLowerCase()) {
    res.status(401).json({ error: 'Incorrect email or password.' })
    return
  }

  res.status(200).json(user)
})

router.post('/sign-out', (req, res) => {
  res.status(200).json({ success: true })
})

// creates an account (#106). The mock only knows one account, so an email that
// matches it is already in use. Like the other routes, it saves nothing
router.post('/register', (req, res) => {
  const body = req.body

  if (!body) {
    res.status(400).json({ error: 'Enter your email and password.' })
    return
  }

  const email = body.email
  const password = body.password

  if (typeof email !== 'string' || email.trim() === '') {
    res.status(400).json({ error: 'Enter your email.' })
    return
  }

  if (typeof password !== 'string' || password.trim() === '') {
    res.status(400).json({ error: 'Enter your password.' })
    return
  }

  if (email.trim().toLowerCase() === user.email.toLowerCase()) {
    res
      .status(409)
      .json({ error: 'An account with this email already exists.' })
    return
  }

  // the reply never includes the password
  res.status(201).json({ ...newAccount, email: email.trim() })
})

export default router
