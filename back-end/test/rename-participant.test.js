import { expect, use } from 'chai'
import chaiHttp, { request } from 'chai-http'
import app from '../app.js'

process.env.NODE_ENV = 'test'
use(chaiHttp)

function rename(eventId, participantId, body) {
  return request
    .execute(app)
    .post(`/api/events/${eventId}/participants/${participantId}/rename`)
    .send(body)
}

describe('POST /api/events/:eventId/participants/:participantId/rename', () => {
  it('responds with 200 and the participant under the new name', async () => {
    const res = await rename('evt_lisbon', 'p_sam_k', { name: 'Sam Kim' })

    expect(res).to.have.status(200)
    expect(res).to.be.json
    expect(res.body).to.deep.equal({
      id: 'p_sam_k',
      name: 'Sam Kim',
      userId: null,
      role: 'member',
      joinedAt: '2026-10-14',
    })
  })

  it('trims spaces around the new name', async () => {
    const res = await rename('evt_lisbon', 'p_maya', { name: '  Maya L.  ' })

    expect(res).to.have.status(200)
    expect(res.body.name).to.equal('Maya L.')
  })

  it('does not change the mock data', async () => {
    await rename('evt_lisbon', 'p_sam_k', { name: 'Sam Kim' })
    const res = await request.execute(app).get('/api/events/evt_lisbon')
    const samK = res.body.participants.find(person => person.id === 'p_sam_k')

    expect(samK.name).to.equal('Sam K.')
  })

  for (const [label, body] of [
    ['is empty', { name: '' }],
    ['is only spaces', { name: '   ' }],
    ['is missing', {}],
    ['is not text', { name: 42 }],
  ]) {
    it(`responds with 400 when the name ${label}`, async () => {
      const res = await rename('evt_lisbon', 'p_sam_k', body)

      expect(res).to.have.status(400)
      expect(res.body.error).to.equal('Enter a name.')
    })
  }

  it('responds with 400 when no body is sent', async () => {
    const res = await request
      .execute(app)
      .post('/api/events/evt_lisbon/participants/p_sam_k/rename')

    expect(res).to.have.status(400)
    expect(res.body.error).to.equal('Enter a name.')
  })

  it('responds with 404 for an unknown event', async () => {
    const res = await rename('evt_nope', 'p_sam_k', { name: 'Sam Kim' })

    expect(res).to.have.status(404)
    expect(res.body.error).to.equal('Event not found.')
  })

  it('responds with 404 for an unknown participant', async () => {
    const res = await rename('evt_lisbon', 'p_nobody', { name: 'Sam Kim' })

    expect(res).to.have.status(404)
    expect(res.body.error).to.equal('Participant not found.')
  })

  it('responds with 404 for a participant from another event', async () => {
    const res = await rename('evt_cabin', 'p_maya', { name: 'Maya' })

    expect(res).to.have.status(404)
    expect(res.body.error).to.equal('Participant not found.')
  })
})
