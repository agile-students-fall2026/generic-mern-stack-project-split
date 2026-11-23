import { Router } from 'express'
import returnLinks from '../mock/return-links.json' with { type: 'json' }

const router = Router()

router.get('/:token', (req, res) => {
  const token = req.params.token

  for (let i = 0; i < returnLinks.length; i++) {
    const link = returnLinks[i]

    if (link.token === token) {
      res.json(link)
      return
    }
  }

  res.status(404).json({ error: 'Return link not found.' })
})

export default router
