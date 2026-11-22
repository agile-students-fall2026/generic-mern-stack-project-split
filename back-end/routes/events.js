import { Router } from 'express'
import events from '../mock/events.json' with { type: 'json' }
import newEvent from '../mock/create-event.json' with { type: 'json' }

const router = Router()

router.get('/', (req, res) => {
  res.json(events)
})

router.post('/', (req, res) => {
  // req.body is undefined when the request has no JSON body
  const name = req.body?.name
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Enter a name for your event.' })
  }
  res.status(201).json({ ...newEvent, name: name.trim() })
})

export default router
