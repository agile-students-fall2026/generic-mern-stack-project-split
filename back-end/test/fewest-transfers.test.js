import { expect, use } from 'chai'
import chaiHttp, { request } from 'chai-http'
import app from '../app.js'

process.env.NODE_ENV = 'test'
use(chaiHttp)

function getEvent(eventId) {
  return request.execute(app).get(`/api/events/${eventId}`)
}

// how much each person ends up paying (negative) or getting (positive).
// People who come out even are left out, since a plan may skip them entirely
function netAmounts(transfers) {
  const net = {}
  for (const transfer of transfers) {
    net[transfer.fromId] = (net[transfer.fromId] || 0) - transfer.amountCents
    net[transfer.toId] = (net[transfer.toId] || 0) + transfer.amountCents
  }
  const result = {}
  for (const id in net) {
    if (net[id] !== 0) {
      result[id] = net[id]
    }
  }
  return result
}

// The Fewest transfers view reads settlement.fewest from the event reply (#134)
describe('GET /api/events/:eventId fewest transfers plan', () => {
  it('settles the Lisbon trip in 2 payments', async () => {
    const res = await getEvent('evt_lisbon')

    expect(res).to.have.status(200)
    expect(res.body.settlement.fewest).to.deep.equal([
      { fromId: 'p_sam', toId: 'p_alex', amountCents: 8100, status: 'unpaid' },
      { fromId: 'p_sam', toId: 'p_maya', amountCents: 900, status: 'unpaid' },
    ])
  })

  it('never needs more payments than the full list', async () => {
    for (const eventId of ['evt_lisbon', 'evt_lisbon_settling', 'evt_cabin']) {
      const res = await getEvent(eventId)
      const { all, fewest } = res.body.settlement

      expect(fewest.length).to.be.at.most(all.length)
    }
  })

  it('leaves everyone paying or getting the same amount as the full list', async () => {
    for (const eventId of ['evt_lisbon', 'evt_lisbon_settling', 'evt_cabin']) {
      const res = await getEvent(eventId)
      const { all, fewest } = res.body.settlement

      expect(netAmounts(fewest)).to.deep.equal(netAmounts(all))
    }
  })

  it('gives each payment a payer, a receiver, an amount, and a status', async () => {
    const res = await getEvent('evt_cabin')

    for (const transfer of res.body.settlement.fewest) {
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

  it('has no payments for an event with no receipts', async () => {
    const res = await getEvent('evt_7hq2xm')

    expect(res.body.settlement.fewest).to.deep.equal([])
  })
})
