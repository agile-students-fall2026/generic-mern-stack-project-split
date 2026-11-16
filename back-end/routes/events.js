import { Router } from 'express'
import events from '../mock/events.json' with { type: 'json' }

const router = Router()

router.get('/', (req, res) => {
  res.json(events)
})

export default router
