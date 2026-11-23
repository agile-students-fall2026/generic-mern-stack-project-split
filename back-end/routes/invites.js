import { Router } from 'express'
import invites from '../mock/invites.json' with { type: 'json' }

import joinEvent from '../mock/join-event.json' with { type: 'json' }

const router = Router()

router.get('/:code', (req, res) => {
  const code = req.params.code

  for (let i = 0; i < invites.length; i++) {
    const invite = invites[i]

    if (invite.code === code) {
      res.json(invite)
      return
    }
  }

  res.status(404).json({ error: 'Invite not found.' })
})

router.post('/:code/join', (req, res) => {
  const body = req.body

  if (!body) {
    res.status(400).json({ error: 'enter your name.' })
    return
  }

  const name = body.name

  if (typeof name !== 'string' || name.trim() === '') {
    res.status(400).json({ error: 'enter your name.' })
    return
  }

  const code = req.params.code

  for (let i = 0; i < invites.length; i++) {
    const invite = invites[i]

    if (invite.code === code) {
      res.status(201).json({
        ...joinEvent,
        eventId: invite.eventId,
        name: name.trim(),
      })
      return
    }
  }

  res.status(404).json({ error: 'Invite not found.' })
})

export default router
