import { expect, use } from 'chai'
import chaiHttp, { request } from 'chai-http'
import app from '../app.js'

process.env.NODE_ENV = 'test'
use(chaiHttp)

function markPaid(eventId, body) {
  return request
    .execute(app)
    .post(`/api/events/${eventId}/payments/mark-paid`)
    .send(body)
}

describe('POST /api/events/:eventId/payments/mark-paid', () => {
  it('responds with 200 and the transfer as pending', async () => {
    const res = await markPaid('evt_lisbon', {
      fromId: 'p_maya',
      toId: 'p_alex',
    })
    expect(res).to.have.status(200)
    expect(res).to.be.json
    expect(res.body).to.deep.equal({
      fromId: 'p_maya',
      toId: 'p_alex',
      amountCents: 2100,
      status: 'pending',
    })
  })

  it('looks in the fewest transfers plan when asked', async () => {
    const pair = { fromId: 'p_sam', toId: 'p_alex' }
    const all = await markPaid('evt_lisbon', pair)
    const fewest = await markPaid('evt_lisbon', { ...pair, plan: 'fewest' })
    expect(all.body.amountCents).to.equal(3000)
    expect(fewest.body.amountCents).to.equal(8100)
  })

  it('does not change the mock data', async () => {
    await markPaid('evt_lisbon', { fromId: 'p_maya', toId: 'p_alex' })
    const res = await request.execute(app).get('/api/events/evt_lisbon')
    expect(res.body.settlement.all[0].status).to.equal('unpaid')
  })

  it('responds with 404 for an unknown event', async () => {
    const res = await markPaid('evt_nope', { fromId: 'p_maya', toId: 'p_alex' })
    expect(res).to.have.status(404)
    expect(res.body.error).to.equal('Event not found.')
  })

  for (const [label, body] of [
    ['nobody owes', { fromId: 'p_alex', toId: 'p_maya' }],
    ['with no payer or receiver', {}],
    ['in an unknown plan', { fromId: 'p_maya', toId: 'p_alex', plan: 'x' }],
  ]) {
    it(`responds with 404 for a transfer ${label}`, async () => {
      const res = await markPaid('evt_lisbon', body)
      expect(res).to.have.status(404)
      expect(res.body.error).to.equal('Payment not found.')
    })
  }

  it('responds with 404 when no body is sent', async () => {
    const res = await request
      .execute(app)
      .post('/api/events/evt_lisbon/payments/mark-paid')
    expect(res).to.have.status(404)
    expect(res.body.error).to.equal('Payment not found.')
  })

  it('responds with 409 when the transfer is not unpaid', async () => {
    const res = await markPaid('evt_lisbon_settling', {
      fromId: 'p_maya',
      toId: 'p_alex',
    })
    expect(res).to.have.status(409)
    expect(res.body.error).to.be.a('string').that.is.not.empty
  })
})
