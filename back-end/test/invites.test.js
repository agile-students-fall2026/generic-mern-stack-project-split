import { expect, use } from 'chai'
import chaiHttp, { request } from 'chai-http'
import app from '../app.js'

use(chaiHttp)

describe('GET /api/invites/:code', () => {
  it('returns the event and organizer for a valid invite', async () => {
    const res = await request.execute(app).get('/api/invites/lis-9K2D')

    expect(res).to.have.status(200)

    expect(res.body).to.have.property('eventName', 'Lisbon trip')

    expect(res.body).to.have.property('organizerName', 'Alex')
  })

  it('returns 404 for an unknown invite', async () => {
    const res = await request.execute(app).get('/api/invites/not-a-real-code')

    expect(res).to.have.status(404)
    expect(res.body).to.have.property('error')
  })
})

describe('POST /api/invites/:code/join', () => {
  it('returns the participant and return token for the invited event', async () => {
    const res = await request
      .execute(app)
      .post('/api/invites/por-4F7P/join')
      .send({
        name: ' Test Guest ',
      })

    expect(res).to.have.status(201)

    expect(res.body).to.have.property('name', 'Test Guest')

    expect(res.body).to.have.property('eventId', 'evt_7hq2xm')

    expect(res.body).to.have.property('returnToken', 'maya-7Q2K')
  })

  it('returns 400 without a name', async () => {
    const res = await request
      .execute(app)
      .post('/api/invites/por-4F7P/join')
      .send({})

    expect(res).to.have.status(400)

    expect(res.body).to.have.property('error')
  })

  it('returns 404 for an unknown invite', async () => {
    const res = await request
      .execute(app)
      .post('/api/invites/not-a-real-code/join')
      .send({
        name: 'Test Guest',
      })

    expect(res).to.have.status(404)

    expect(res.body).to.have.property('error')
  })
})
