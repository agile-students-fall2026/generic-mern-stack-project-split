import { expect, use } from 'chai'
import chaiHttp, { request } from 'chai-http'
import app from '../app.js'

process.env.NODE_ENV = 'test'
use(chaiHttp)

// Settle up reads settlement.all from the event reply (#133)
describe('GET /api/events/:eventId settle up transfers', () => {
  it('lists every transfer for the Lisbon trip', async () => {
    const res = await request.execute(app).get('/api/events/evt_lisbon')

    expect(res).to.have.status(200)
    expect(res.body.settlement.all).to.be.an('array').with.lengthOf(5)
    expect(res.body.settlement.all[0]).to.deep.equal({
      fromId: 'p_maya',
      toId: 'p_alex',
      amountCents: 2100,
      status: 'unpaid',
    })
  })

  it('gives each transfer a payer, a receiver, an amount, and a status', async () => {
    const res = await request.execute(app).get('/api/events/evt_lisbon')

    for (const transfer of res.body.settlement.all) {
      expect(transfer).to.have.all.keys(
        'fromId',
        'toId',
        'amountCents',
        'status',
      )
      expect(transfer.amountCents).to.be.a('number').above(0)
      expect(['unpaid', 'pending', 'confirmed']).to.include(transfer.status)
    }
  })

  it('only names people who are in the event', async () => {
    const res = await request.execute(app).get('/api/events/evt_lisbon')
    const ids = res.body.participants.map(person => person.id)

    for (const transfer of res.body.settlement.all) {
      expect(ids).to.include(transfer.fromId)
      expect(ids).to.include(transfer.toId)
      expect(transfer.fromId).to.not.equal(transfer.toId)
    }
  })

  it('shows payment progress on the later Lisbon trip', async () => {
    const res = await request
      .execute(app)
      .get('/api/events/evt_lisbon_settling')
    const statuses = res.body.settlement.all.map(transfer => transfer.status)

    expect(statuses.filter(status => status === 'pending')).to.have.lengthOf(1)
    expect(statuses.filter(status => status === 'confirmed')).to.have.lengthOf(
      4,
    )
  })

  it('has no transfers for an event with no receipts', async () => {
    const res = await request.execute(app).get('/api/events/evt_7hq2xm')

    expect(res).to.have.status(200)
    expect(res.body.settlement.all).to.deep.equal([])
  })
})
