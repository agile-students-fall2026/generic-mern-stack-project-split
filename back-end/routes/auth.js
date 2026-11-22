import { Router } from 'express'
import user from '../mock/user.json' with { type: 'json' }

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

export default router
