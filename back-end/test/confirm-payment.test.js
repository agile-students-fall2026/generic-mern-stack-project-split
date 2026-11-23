import { expect, use } from 'chai'
import chaiHttp, { request } from 'chai-http'
import app from '../app.js'

process.env.NODE_ENV = 'test'
use(chaiHttp)

function confirm(eventId, body) {
  return request
    .execute(app)
    .post(`/api/events/${eventId}/payments/confirm`)
    .send(body)
}

// in evt_lisbon_settling, Maya has marked her $21.00 to Alex as paid
const pending = { fromId: 'p_maya', toId: 'p_alex' }

describe('POST /api/events/:eventId/payments/confirm', () => {
  it('responds with 200 and the transfer as confirmed', async () => {
    const res = await confirm('evt_lisbon_settling', pending)

    expect(res).to.have.status(200)
    expect(res).to.be.json
    expect(res.body).to.deep.equal({
      fromId: 'p_maya',
      toId: 'p_alex',
      amountCents: 2100,
      status: 'confirmed',
    })
  })

  it('confirms in the fewest transfers plan when asked', async () => {
    const res = await confirm('evt_lisbon_settling', {
      ...pending,
      plan: 'fewest',
    })

    expect(res).to.have.status(200)
    expect(res.body.status).to.equal('confirmed')
  })

  it('does not change the mock data', async () => {
    await confirm('evt_lisbon_settling', pending)
    const res = await request
      .execute(app)
      .get('/api/events/evt_lisbon_settling')

    expect(res.body.settlement.all[0].status).to.equal('pending')
  })

  it('responds with 404 for an unknown event', async () => {
    const res = await confirm('evt_nope', pending)

    expect(res).to.have.status(404)
    expect(res.body.error).to.equal('Event not found.')
  })

  for (const [label, body] of [
    ['nobody owes', { fromId: 'p_alex', toId: 'p_maya' }],
    ['with no payer or receiver', {}],
    ['in an unknown plan', { ...pending, plan: 'x' }],
  ]) {
    it(`responds with 404 for a transfer ${label}`, async () => {
      const res = await confirm('evt_lisbon_settling', body)

      expect(res).to.have.status(404)
      expect(res.body.error).to.equal('Payment not found.')
    })
  }

  it('responds with 404 when no body is sent', async () => {
    const res = await request
      .execute(app)
      .post('/api/events/evt_lisbon_settling/payments/confirm')

    expect(res).to.have.status(404)
    expect(res.body.error).to.equal('Payment not found.')
  })

  it('responds with 409 for a payment not yet marked as paid', async () => {
    const res = await confirm('evt_lisbon', pending)

    expect(res).to.have.status(409)
    expect(res.body.error).to.be.a('string').that.is.not.empty
  })

  it('responds with 409 for a payment already confirmed', async () => {
    const res = await confirm('evt_lisbon_settling', {
      fromId: 'p_sam',
      toId: 'p_maya',
    })

    expect(res).to.have.status(409)
    expect(res.body.error).to.be.a('string').that.is.not.empty
  })
})
