import { expect, use } from 'chai'
import chaiHttp, { request } from 'chai-http'
import app from '../app.js'

use(chaiHttp)

describe('GET /api/user', () => {
  it('returns the mock current user', async () => {
    const res = await request.execute(app).get('/api/user')

    expect(res).to.have.status(200)
    expect(res).to.be.json
    expect(res.body).to.have.property('id')
    expect(res.body).to.have.property('name')
    expect(res.body).to.have.property('email')
  })
})
