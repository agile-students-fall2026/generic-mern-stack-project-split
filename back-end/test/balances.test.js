import { expect, use } from 'chai'
import chaiHttp, { request } from 'chai-http'
import app from '../app.js'

process.env.NODE_ENV = 'test'
use(chaiHttp)

// Exercise the HTTP response, not a direct import of the mock balances.
const scenarios = [
  ['evt_lisbon', 'an active event'],
  ['evt_lisbon_settling', 'an event with payments awaiting confirmation'],
  ['evt_7hq2xm', 'an event without receipts'],
  ['evt_cabin', 'a closed event'],
]

describe('Balances in GET /api/events/:eventId', () => {
  for (const [eventId, description] of scenarios) {
    describe(description, () => {
      let event

      before(async () => {
        const res = await request.execute(app).get(`/api/events/${eventId}`)
        expect(res).to.have.status(200)
        expect(res).to.be.json
        expect(res.body.id).to.equal(eventId)
        expect(res.body.participants).to.be.an('array').that.is.not.empty
        expect(res.body.balances).to.be.an('array')
        event = res.body
      })

      it('has exactly one balance per participant, with no unknown participants', () => {
        const participantIds = event.participants.map(person => person.id)
        const balanceIds = event.balances.map(balance => balance.participantId)

        expect(balanceIds).to.have.lengthOf(participantIds.length)
        expect(new Set(balanceIds).size).to.equal(balanceIds.length)
        expect(balanceIds).to.have.same.members(participantIds)
      })

      it('represents monetary amounts as safe integer cents', () => {
        for (const balance of event.balances) {
          for (const field of ['paidCents', 'shareCents', 'netCents']) {
            expect(
              Number.isSafeInteger(balance[field]),
              `${balance.participantId}.${field} must be integer cents`,
            ).to.equal(true)
          }
          expect(balance.paidCents).to.be.at.least(0)
          expect(balance.shareCents).to.be.at.least(0)
        }
      })

      it('calculates each net balance as the amount paid minus the share', () => {
        for (const balance of event.balances) {
          expect(balance.netCents, balance.participantId).to.equal(
            balance.paidCents - balance.shareCents,
          )
        }
      })

      it('has net balances that sum to zero', () => {
        const totalNetCents = event.balances.reduce(
          (total, balance) => total + balance.netCents,
          0,
        )
        expect(totalNetCents).to.equal(0)
      })
    })
  }
})
