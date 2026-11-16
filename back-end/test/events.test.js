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
