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

router.post('/:eventId/participants/merge', (req, res) => {
  const event = eventDetails.find(item => item.id === req.params.eventId)
  if (!event) {
    return res.status(404).json({ error: 'Event not found.' })
  }

  const { sourceId, targetId } = req.body ?? {}
  if (
    typeof sourceId !== 'string' ||
    !sourceId.trim() ||
    typeof targetId !== 'string' ||
    !targetId.trim()
  ) {
    return res.status(400).json({ error: 'Provide sourceId and targetId.' })
  }

  const source = event.participants.find(item => item.id === sourceId)
  const target = event.participants.find(item => item.id === targetId)
  if (!source || !target) {
    return res.status(404).json({ error: 'Participant not found.' })
  }
  if (sourceId === targetId) {
    return res.status(400).json({ error: 'Choose two different participants.' })
  }
  if (source.role === 'organizer') {
    return res.status(400).json({ error: 'Cannot merge away the organizer.' })
  }

  // Return the remaining participants without changing the shared mock data.
  // Receipt reassignment and persistence belong to the database stage.
  const participants = event.participants.filter(item => item.id !== sourceId)
  res.json({ participants })
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

// the receiver confirms the money arrived (#137): a pending payment becomes
// confirmed. Like mark paid, it replies with the new state and saves nothing
router.post('/:eventId/payments/confirm', (req, res) => {
  const event = eventDetails.find(item => item.id === req.params.eventId)
  if (!event) {
    return res.status(404).json({ error: 'Event not found.' })
  }
  // fromId pays and toId receives; plan picks the all or fewest transfers list
  const { fromId, toId, plan = 'all' } = req.body ?? {}
  const transfer =
    Object.hasOwn(event.settlement, plan) &&
    event.settlement[plan].find(
      item => item.fromId === fromId && item.toId === toId,
    )
  if (!transfer) {
    return res.status(404).json({ error: 'Payment not found.' })
  }
  // only a payment the payer marked as paid can be confirmed, and only once
  if (transfer.status !== 'pending') {
    return res
      .status(409)
      .json({ error: 'Only a payment marked as paid can be confirmed.' })
  }
  res.json({ ...transfer, status: 'confirmed' })
})

router.post('/:eventId/receipts', (req, res) => {
  const eventId = req.params.eventId
  let event = null

  for (const item of eventDetails) {
    if (item.id === eventId) {
      event = item
      break
    }
  }

  if (!event) {
    return res.status(404).json({ error: 'Event not found.' })
  }

  const receipt = req.body
  if (!receipt) {
    return res.status(400).json({ error: 'Enter a positive total in cents.' })
  }

  const totalCents = receipt.totalCents
  if (!Number.isSafeInteger(totalCents) || totalCents <= 0) {
    return res.status(400).json({ error: 'Enter a positive total in cents.' })
  }

  let payerFound = false
  for (const person of event.participants) {
    if (person.id === receipt.payerId) {
      payerFound = true
    }
  }

  if (!payerFound) {
    return res.status(400).json({ error: 'Choose a participant who paid.' })
  }

  const shares = receipt.shares
  if (!Array.isArray(shares) || shares.length === 0) {
    return res.status(400).json({ error: 'Choose at least one participant.' })
  }

  let split = 'equal'
  if (receipt.split === 'percent') {
    split = 'percent'
  }

  let sum = 0
  let percentSum = 0

  for (const share of shares) {
    if (!share) {
      return res
        .status(400)
        .json({ error: 'Enter valid share amounts in cents.' })
    }

    const amountCents = share.amountCents
    if (!Number.isSafeInteger(amountCents) || amountCents < 0) {
      return res
        .status(400)
        .json({ error: 'Enter valid share amounts in cents.' })
    }

    sum = sum + amountCents

    if (split === 'percent') {
      const percent = share.percent
      if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        return res
          .status(400)
          .json({ error: 'Enter a percentage from 0 to 100.' })
      }

      percentSum = percentSum + percent
    }
  }

  if (split === 'percent') {
    if (percentSum < 99.999999 || percentSum > 100.000001) {
      return res.status(400).json({ error: 'Percentages must add up to 100.' })
    }
  }

  if (sum !== totalCents) {
    return res.status(400).json({ error: 'Shares must add up to the total.' })
  }

  const mockReceipt = lisbon.receipts[0]
  let photoUrl = mockReceipt.photoUrl
  if (receipt.photoUrl !== undefined) {
    photoUrl = receipt.photoUrl
  }

  res.status(201).json({
    ...mockReceipt,
    id: randomUUID(),
    eventId: eventId,
    merchant: receipt.merchant,
    date: receipt.date,
    totalCents: totalCents,
    payerId: receipt.payerId,
    split: split,
    photoUrl: photoUrl,
    shares: shares,
  })
})

// the organizer renames someone in the event (#129). Like the payment routes,
// it replies with the new state and saves nothing
router.post('/:eventId/participants/:participantId/rename', (req, res) => {
  const event = eventDetails.find(item => item.id === req.params.eventId)
  if (!event) {
    return res.status(404).json({ error: 'Event not found.' })
  }
  const participant = event.participants.find(
    person => person.id === req.params.participantId,
  )
  if (!participant) {
    return res.status(404).json({ error: 'Participant not found.' })
  }
  // req.body is undefined when the request has no JSON body
  const name = req.body?.name
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Enter a name.' })
  }
  res.json({ ...participant, name: name.trim() })
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
