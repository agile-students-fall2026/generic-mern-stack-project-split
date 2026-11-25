import { expect, use } from 'chai'
import chaiHttp, { request } from 'chai-http'
import app from '../app.js'

process.env.NODE_ENV = 'test'
use(chaiHttp)

describe('GET /api/events', () => {
  it('responds with 200 and a list with active and past events', async () => {
    const res = await request.execute(app).get('/api/events')
    expect(res).to.have.status(200)
    expect(res).to.be.json
    expect(res.body).to.be.an('array')
    expect(res.body.map(event => event.status)).to.include.members([
      'active',
      'closed',
    ])
  })

  it('gives each event the fields My Events shows', async () => {
    const res = await request.execute(app).get('/api/events')
    for (const event of res.body) {
      expect(event).to.include.keys(
        'id',
        'name',
        'status',
        'startDate',
        'endDate',
        'closedAt',
        'participantCount',
        'totalCents',
      )
    }
  })
})

function makeReceipt() {
  return {
    merchant: 'Lunch',
    date: '2026-11-25',
    totalCents: 1000,
    payerId: 'p_alex',
    split: 'equal',
    photoUrl: null,
    shares: [
      { participantId: 'p_alex', amountCents: 500, percent: null },
      { participantId: 'p_maya', amountCents: 500, percent: null },
    ],
  }
}

it('returns 400 when the total is not a positive whole cent amount', async () => {
  const receipt = makeReceipt()
  receipt.totalCents = 1000.5
  const res = await request
    .execute(app)
    .post('/api/events/evt_lisbon/receipts')
    .send(receipt)
  expect(res).to.have.status(400)
})

it('returns 400 when the payer is not in the event', async () => {
  const receipt = makeReceipt()
  receipt.payerId = 'not-a-participant'
  const res = await request
    .execute(app)
    .post('/api/events/evt_lisbon/receipts')
    .send(receipt)
  expect(res).to.have.status(400)
})

it('returns 400 when nobody is included', async () => {
  const receipt = makeReceipt()
  receipt.shares = []
  const res = await request
    .execute(app)
    .post('/api/events/evt_lisbon/receipts')
    .send(receipt)
  expect(res).to.have.status(400)
})

it('returns 400 when the shares do not add up to the total', async () => {
  const receipt = makeReceipt()
  receipt.shares[1].amountCents = 499
  const res = await request
    .execute(app)
    .post('/api/events/evt_lisbon/receipts')
    .send(receipt)
  expect(res).to.have.status(400)
})

it('returns 404 when the event does not exist', async () => {
  const res = await request
    .execute(app)
    .post('/api/events/does-not-exist/receipts')
    .send(makeReceipt())
  expect(res).to.have.status(404)
})

describe('POST /api/events', () => {
  it('responds with 201 and the new event with its id and invite code', async () => {
    const res = await request
      .execute(app)
      .post('/api/events')
      .send({ name: '  Ski trip  ' })
    expect(res).to.have.status(201)
    expect(res).to.be.json
    // the name sent, trimmed, not the one in the mock data
    expect(res.body).to.include({ name: 'Ski trip', status: 'active' })
    expect(res.body.id).to.be.a('string').that.is.not.empty
    expect(res.body.inviteCode).to.be.a('string').that.is.not.empty
  })

  for (const [label, body] of [
    ['is missing', {}],
    ['is blank', { name: '   ' }],
    ['is not text', { name: 42 }],
  ]) {
    it(`responds with 400 when the name ${label}`, async () => {
      const res = await request.execute(app).post('/api/events').send(body)
      expect(res).to.have.status(400)
      expect(res).to.be.json
      expect(res.body.error).to.be.a('string').that.is.not.empty
    })
  }

  it('responds with 400 when no body is sent', async () => {
    const res = await request.execute(app).post('/api/events')
    expect(res).to.have.status(400)
    expect(res.body.error).to.be.a('string').that.is.not.empty
  })
})

describe('POST /api/events/evt_lisbon/receipts', () => {
  it('creates a receipt for an equal split', async () => {
    const res = await request
      .execute(app)
      .post('/api/events/evt_lisbon/receipts')
      .send({
        merchant: 'Lunch',
        date: '2026-11-25',
        totalCents: 1000,
        payerId: 'p_alex',
        split: 'equal',
        photoUrl: null,
        shares: [
          { participantId: 'p_alex', amountCents: 500, percent: null },
          { participantId: 'p_maya', amountCents: 500, percent: null },
        ],
      })

    expect(res).to.have.status(201)
    expect(res.body.id).to.be.a('string').that.is.not.empty
    expect(res.body.totalCents).to.equal(1000)
    expect(res.body.split).to.equal('equal')
  })
  it('creates a receipt for a percentage split', async () => {
    const res = await request
      .execute(app)
      .post('/api/events/evt_lisbon/receipts')
      .send({
        merchant: 'Lunch',
        date: '2026-11-25',
        totalCents: 1000,
        payerId: 'p_alex',
        split: 'percent',
        shares: [
          { participantId: 'p_alex', amountCents: 600, percent: 60 },
          { participantId: 'p_maya', amountCents: 400, percent: 40 },
        ],
      })

    expect(res).to.have.status(201)
    expect(res.body.split).to.equal('percent')
    expect(res.body.shares[0].percent).to.equal(60)
  })

  it('rejects a percentage outside 0 to 100', async () => {
    const res = await request
      .execute(app)
      .post('/api/events/evt_lisbon/receipts')
      .send({
        totalCents: 1000,
        payerId: 'p_alex',
        split: 'percent',
        shares: [
          { participantId: 'p_alex', amountCents: 600, percent: 101 },
          { participantId: 'p_maya', amountCents: 400, percent: -1 },
        ],
      })

    expect(res).to.have.status(400)
    expect(res.body.error).to.equal('Enter a percentage from 0 to 100.')
  })

  it('rejects percentages that do not add up to 100', async () => {
    const res = await request
      .execute(app)
      .post('/api/events/evt_lisbon/receipts')
      .send({
        totalCents: 1000,
        payerId: 'p_alex',
        split: 'percent',
        shares: [
          { participantId: 'p_alex', amountCents: 600, percent: 60 },
          { participantId: 'p_maya', amountCents: 400, percent: 30 },
        ],
      })

    expect(res).to.have.status(400)
    expect(res.body.error).to.equal('Percentages must add up to 100.')
  })

  it('rejects percentage shares that do not add up to the receipt total', async () => {
    const res = await request
      .execute(app)
      .post('/api/events/evt_lisbon/receipts')
      .send({
        totalCents: 1000,
        payerId: 'p_alex',
        split: 'percent',
        shares: [
          { participantId: 'p_alex', amountCents: 600, percent: 60 },
          { participantId: 'p_maya', amountCents: 399, percent: 40 },
        ],
      })

    expect(res).to.have.status(400)
    expect(res.body.error).to.equal('Shares must add up to the total.')
  })
})
