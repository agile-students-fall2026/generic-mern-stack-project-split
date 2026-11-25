import { expect, use } from 'chai'
import chaiHttp, { request } from 'chai-http'
import app from '../app.js'
import created from '../mock/events/evt_7hq2xm.json' with { type: 'json' }
import lisbon from '../mock/events/evt_lisbon.json' with { type: 'json' }
import cabin from '../mock/events/evt_cabin.json' with { type: 'json' }

process.env.NODE_ENV = 'test'
use(chaiHttp)

function close(eventId) {
  return request.execute(app).post(`/api/events/${eventId}/close`)
}

describe('POST /api/events/:eventId/close', () => {
  it('closes an active event without requiring a request body', async () => {
    const before = Date.now()
    const res = await close(created.id)
    const after = Date.now()

    expect(res).to.have.status(200)
    expect(res).to.be.json
    expect(res.body).to.deep.equal({
      ...created,
      status: 'closed',
      closedAt: res.body.closedAt,
    })
    expect(res.body.closedAt).to.be.a('string')
    const closedAt = Date.parse(res.body.closedAt)
    expect(closedAt).to.be.within(before, after)
    expect(new Date(closedAt).toISOString()).to.equal(res.body.closedAt)
  })

  it('preserves receipts, balances and settlement records in the mock response', async () => {
    const before = structuredClone(lisbon)
    const res = await close(lisbon.id)

    expect(res).to.have.status(200)
    expect(res.body).to.deep.equal({
      ...before,
      status: 'closed',
      closedAt: res.body.closedAt,
    })
    expect(res.body.closedAt).to.be.a('string')
    expect(lisbon).to.deep.equal(before)
  })

  it('keeps the original closing date of an already closed event', async () => {
    const res = await close(cabin.id)

    expect(res).to.have.status(200)
    expect(res.body).to.deep.equal(cabin)
  })

  it('returns 404 and a JSON error for an unknown event', async () => {
    const res = await close('evt_missing')

    expect(res).to.have.status(404)
    expect(res).to.be.json
    expect(res.body).to.deep.equal({ error: 'Event not found.' })
  })

  it('does not persist closure in the event details or event list', async () => {
    const before = structuredClone(created)
    const listBefore = await request.execute(app).get('/api/events')
    const closed = await close(created.id)
    const details = await request.execute(app).get(`/api/events/${created.id}`)
    const listAfter = await request.execute(app).get('/api/events')

    expect(closed).to.have.status(200)
    expect(details).to.have.status(200)
    expect(details.body).to.deep.equal(before)
    expect(created).to.deep.equal(before)
    expect(listBefore).to.have.status(200)
    expect(listAfter).to.have.status(200)
    expect(listAfter.body).to.deep.equal(listBefore.body)
  })

  it('allows repeated mock close requests without changing the source event', async () => {
    const before = structuredClone(created)
    const first = await close(created.id)
    const second = await close(created.id)

    for (const res of [first, second]) {
      expect(res).to.have.status(200)
      expect(res.body.status).to.equal('closed')
      expect(res.body.id).to.equal(created.id)
      expect(Number.isNaN(Date.parse(res.body.closedAt))).to.equal(false)
    }
    expect(created).to.deep.equal(before)
  })
})
