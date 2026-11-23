import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { Router } from 'express'
import multer from 'multer'
import newEvent from '../mock/create-event.json' with { type: 'json' }

import events from '../mock/events.json' with { type: 'json' }

import lisbon from '../mock/events/evt_lisbon.json' with { type: 'json' }
import cabin from '../mock/events/evt_cabin.json' with { type: 'json' }
import created from '../mock/events/evt_7hq2xm.json' with { type: 'json' }
import settling from '../mock/events/evt_lisbon_settling.json' with { type: 'json' }

import returnLinks from '../mock/return-links.json' with { type: 'json' }

const router = Router()

// receipt photos are stored here, and app.js serves them at /uploads
export const uploadsDir = path.join(import.meta.dirname, '../uploads')

// the stored file gets its extension from this list, never from the name the client sent
const photoTypes = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

const uploadPhoto = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) =>
      cb(null, randomUUID() + photoTypes[file.mimetype]),
  }),
  fileFilter: (req, file, cb) =>
    cb(null, Object.hasOwn(photoTypes, file.mimetype)),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
}).single('photo')

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

router.post('/:eventId/payments/mark-paid', (req, res) => {
  const event = eventDetails.find(item => item.id === req.params.eventId)
  if (!event) {
    return res.status(404).json({ error: 'Event not found.' })
  }
  // the same two people can owe different amounts in the two plans
  const { fromId, toId, plan = 'all' } = req.body ?? {}
  const transfer =
    Object.hasOwn(event.settlement, plan) &&
    event.settlement[plan].find(
      item => item.fromId === fromId && item.toId === toId,
    )
  if (!transfer) {
    return res.status(404).json({ error: 'Payment not found.' })
  }
  if (transfer.status !== 'unpaid') {
    return res
      .status(409)
      .json({ error: 'This payment is already marked paid.' })
  }
  res.json({ ...transfer, status: 'pending' })
})

router.post('/:eventId/receipts/photo', (req, res, next) => {
  if (!eventDetails.some(item => item.id === req.params.eventId)) {
    return res.status(404).json({ error: 'Event not found.' })
  }
  // called here and not as middleware, so a photo that is too large gets a JSON reply
  uploadPhoto(req, res, error => {
    if (error && !(error instanceof multer.MulterError)) return next(error)
    if (error || !req.file) {
      return res
        .status(400)
        .json({ error: 'Send one JPEG, PNG, WebP, or GIF photo up to 10 MB.' })
    }
    const host = `${req.protocol}://${req.get('host')}`
    res.status(201).json({ photoUrl: `${host}/uploads/${req.file.filename}` })
  })
})

router.get('/:eventId/participants/:participantId/return-link', (req, res) => {
  const eventId = req.params.eventId
  const participantId = req.params.participantId

  for (let i = 0; i < returnLinks.length; i++) {
    const link = returnLinks[i]

    if (link.eventId === eventId && link.participantId === participantId) {
      res.json(link)
      return
    }
  }

  res.status(404).json({ error: 'Return link not found.' })
})

export default router
