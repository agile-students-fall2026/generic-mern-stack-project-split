import { expect, use } from 'chai'
import chaiHttp, { request } from 'chai-http'
import app from '../app.js'

use(chaiHttp)

describe('GET /api/events/:eventId', () => {
  it('returns the details for a known event', async () => {
    const res = await request.execute(app).get('/api/events/evt_lisbon')

    expect(res).to.have.status(200)
    expect(res).to.be.json
    expect(res.body.id).to.equal('evt_lisbon')
    expect(res.body).to.have.property('participants')
    expect(res.body).to.have.property('receipts')
    expect(res.body).to.have.property('balances')
    expect(res.body).to.have.property('settlement')
  })

  it('returns 404 for an unknown event', async () => {
    const res = await request.execute(app).get('/api/events/does-not-exist')

    expect(res).to.have.status(404)
    expect(res).to.be.json
    expect(res.body).to.have.property('error')
  })
})
