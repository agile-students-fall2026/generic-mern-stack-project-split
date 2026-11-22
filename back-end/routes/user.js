import { Router } from 'express'
import user from '../mock/user.json' with { type: 'json' }

const router = Router()

router.get('/', (req, res) => {
  res.json(user)
})

export default router
