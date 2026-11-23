import { Router } from 'express'
import multer from 'multer'
import scan from '../mock/scan-receipt.json' with { type: 'json' }

const router = Router()

// kept in memory and not stored: the mock reader only looks at the file name
const uploadPhoto = multer({
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
}).single('photo')

router.post('/scan', (req, res, next) => {
  uploadPhoto(req, res, error => {
    if (error && !(error instanceof multer.MulterError)) return next(error)
    if (error || !req.file) {
      return res.status(400).json({ error: 'Send one photo up to 10 MB.' })
    }
    // a file name with "blurry" in it stands in for a photo that cannot be read
    const result = /blurry/i.test(req.file.originalname) ? 'failed' : 'read'
    // the mock photoUrl is left out: the photo is the one that was just sent
    const { merchant, totalCents } = scan[result]
    res.json({ merchant, totalCents })
  })
})

export default router
