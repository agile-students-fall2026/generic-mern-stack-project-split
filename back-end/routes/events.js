import { Router } from 'express'
import newEvent from '../mock/create-event.json' with { type: 'json' }

import events from '../mock/events.json' with { type: 'json' }

import lisbon from '../mock/events/evt_lisbon.json' with { type: 'json' }
import cabin from '../mock/events/evt_cabin.json' with { type: 'json' }
import created from '../mock/events/evt_7hq2xm.json' with { type: 'json' }
import settling from '../mock/events/evt_lisbon_settling.json' with { type: 'json' }

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

const eventDetails = [lisbon, cabin, created, settling]

router.get('/:eventId', (req, res) => {
  const eventId = req.params.eventId

  for (let i = 0; i < eventDetails.length; i++) {
    const event = eventDetails[i]

    if (event.id === eventId) {
      res.json(event)
      return
    }
  }

  res.status(404).json({ error: 'Event not found.' })
})

export default router
