import { expect, use } from 'chai'
import chaiHttp, { request } from 'chai-http'
import app from '../app.js'

process.env.NODE_ENV = 'test'
use(chaiHttp)

function getEvent(eventId) {
  return request.execute(app).get(`/api/events/${eventId}`)
}

// a participant's net amount in a plan: what they receive minus what they pay
function netAmount(transfers, participantId) {
  let net = 0
  for (const transfer of transfers) {
    if (transfer.toId === participantId) net = net + transfer.amountCents
    if (transfer.fromId === participantId) net = net - transfer.amountCents
  }
  return net
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

  it('has no more transfers than the all plan', async () => {
    for (const eventId of ['evt_lisbon', 'evt_lisbon_settling', 'evt_cabin']) {
      const res = await getEvent(eventId)
      const { all, fewest } = res.body.settlement

      expect(fewest.length).to.be.at.most(all.length)
    }
  })

  it('leaves each participant with the same net amount as the all plan', async () => {
    for (const eventId of ['evt_lisbon', 'evt_lisbon_settling', 'evt_cabin']) {
      const res = await getEvent(eventId)
      const { all, fewest } = res.body.settlement

      for (const participant of res.body.participants) {
        expect(
          netAmount(fewest, participant.id),
          `${participant.name} in ${eventId}`,
        ).to.equal(netAmount(all, participant.id))
      }
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
