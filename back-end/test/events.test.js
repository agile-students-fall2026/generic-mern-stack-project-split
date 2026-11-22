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
