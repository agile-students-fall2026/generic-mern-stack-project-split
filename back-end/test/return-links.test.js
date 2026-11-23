import { expect, use } from 'chai'
import chaiHttp, { request } from 'chai-http'
import app from '../app.js'

use(chaiHttp)

describe('GET /api/return-links/:token', () => {
  it('returns the event and participant for a valid token', async () => {
    const res = await request.execute(app).get('/api/return-links/maya-7Q2K')

    expect(res).to.have.status(200)
    expect(res.body).to.have.property('eventId', 'evt_lisbon')
    expect(res.body).to.have.property('participantId', 'p_maya')
  })

  it('returns 404 for an unknown token', async () => {
    const res = await request
      .execute(app)
      .get('/api/return-links/not-a-real-token')

    expect(res).to.have.status(404)
    expect(res.body).to.have.property('error')
  })
})

describe('GET /api/events/:eventId/participants/:participantId/return-link', () => {
  it('returns the personal link for the matching participant and event', async () => {
    const res = await request
      .execute(app)
      .get('/api/events/evt_lisbon/participants/p_maya/return-link')

    expect(res).to.have.status(200)
    expect(res.body).to.have.property('token', 'maya-7Q2K')
  })

  it('returns 404 when the participant has no link for that event', async () => {
    const res = await request
      .execute(app)
      .get('/api/events/evt_7hq2xm/participants/p_maya/return-link')

    expect(res).to.have.status(404)
    expect(res.body).to.have.property('error')
  })
})
