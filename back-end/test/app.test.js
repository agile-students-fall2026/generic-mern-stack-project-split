import { expect, use } from 'chai'
import chaiHttp, { request } from 'chai-http'
import app from '../app.js'

process.env.NODE_ENV = 'test'
use(chaiHttp)

describe('GET /api', () => {
  it('responds with 200 and JSON saying the API is running', async () => {
    const res = await request.execute(app).get('/api')
    expect(res).to.have.status(200)
    expect(res).to.be.json
    expect(res.body).to.deep.equal({ message: 'Split API is running' })
  })
})
