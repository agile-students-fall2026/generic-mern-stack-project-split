import { expect, use } from 'chai'
import chaiHttp, { request } from 'chai-http'
import app from '../app.js'
import lisbon from '../mock/events/evt_lisbon.json' with { type: 'json' }

process.env.NODE_ENV = 'test'
use(chaiHttp)

const mergeBody = { sourceId: 'p_sam_k', targetId: 'p_sam' }

function merge(eventId, body) {
  return request
    .execute(app)
    .post(`/api/events/${eventId}/participants/merge`)
    .send(body)
}

describe('POST /api/events/:eventId/participants/merge', () => {
  it('removes only the source and preserves the other participants and their order', async () => {
    const before = structuredClone(lisbon.participants)
    const res = await merge('evt_lisbon', mergeBody)

    expect(res).to.have.status(200)
    expect(res).to.be.json
    expect(res.body).to.deep.equal({
      participants: before.filter(item => item.id !== 'p_sam_k'),
    })
    expect(res.body.participants.map(item => item.id)).to.deep.equal([
      'p_alex',
      'p_maya',
      'p_sam',
      'p_jordan',
    ])
    expect(lisbon.participants).to.deep.equal(before)
  })

  it('allows the organizer to be the participant kept', async () => {
    const res = await merge('evt_lisbon', {
      ...mergeBody,
      targetId: 'p_alex',
    })

    expect(res).to.have.status(200)
    expect(res.body.participants).to.have.lengthOf(4)
    expect(
      res.body.participants.find(item => item.id === 'p_alex'),
    ).to.deep.equal(lisbon.participants[0])
  })

  it('returns the same result on repeated requests and leaves GET data unchanged', async () => {
    const before = structuredClone(lisbon)
    const first = await merge('evt_lisbon', mergeBody)
    const second = await merge('evt_lisbon', mergeBody)
    const event = await request.execute(app).get('/api/events/evt_lisbon')

    expect(first).to.have.status(200)
    expect(second).to.have.status(200)
    expect(second.body).to.deep.equal(first.body)
    expect(event).to.have.status(200)
    expect(event.body).to.deep.equal(before)
  })

  for (const [label, eventId, body, status, error] of [
    ['unknown event', 'evt_missing', mergeBody, 404, 'Event not found.'],
    [
      'unknown source',
      'evt_lisbon',
      { ...mergeBody, sourceId: 'p_missing' },
      404,
      'Participant not found.',
    ],
    [
      'unknown target',
      'evt_lisbon',
      { ...mergeBody, targetId: 'p_missing' },
      404,
      'Participant not found.',
    ],
    [
      'participant from another event',
      'evt_lisbon',
      { ...mergeBody, targetId: 'p_porto_alex' },
      404,
      'Participant not found.',
    ],
    [
      'same participant',
      'evt_lisbon',
      { ...mergeBody, sourceId: 'p_sam' },
      400,
      'Choose two different participants.',
    ],
    [
      'organizer source',
      'evt_lisbon',
      { ...mergeBody, sourceId: 'p_alex' },
      400,
      'Cannot merge away the organizer.',
    ],
  ]) {
    it(`rejects ${label}`, async () => {
      const res = await merge(eventId, body)

      expect(res).to.have.status(status)
      expect(res).to.be.json
      expect(res.body).to.deep.equal({ error })
    })
  }

  for (const [label, body] of [
    ['empty body', {}],
    ['missing source', { targetId: 'p_sam' }],
    ['missing target', { sourceId: 'p_sam_k' }],
    ['empty source', { ...mergeBody, sourceId: '' }],
    ['blank target', { ...mergeBody, targetId: '   ' }],
    ['numeric source', { ...mergeBody, sourceId: 123 }],
    ['null target', { ...mergeBody, targetId: null }],
    ['array source', { ...mergeBody, sourceId: ['p_sam_k'] }],
    ['object target', { ...mergeBody, targetId: { id: 'p_sam' } }],
  ]) {
    it(`rejects ${label} with 400`, async () => {
      const res = await merge('evt_lisbon', body)

      expect(res).to.have.status(400)
      expect(res.body).to.deep.equal({
        error: 'Provide sourceId and targetId.',
      })
    })
  }

  it('returns 400 when no request body is sent', async () => {
    const res = await request
      .execute(app)
      .post('/api/events/evt_lisbon/participants/merge')

    expect(res).to.have.status(400)
    expect(res.body).to.deep.equal({ error: 'Provide sourceId and targetId.' })
  })
})
