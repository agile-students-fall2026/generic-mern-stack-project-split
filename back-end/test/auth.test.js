import { expect, use } from 'chai'
import chaiHttp, { request } from 'chai-http'
import app from '../app.js'

use(chaiHttp)

describe('POST /api/auth/sign-in', () => {
  it('returns the mock account for a matching email', async () => {
    const res = await request.execute(app).post('/api/auth/sign-in').send({
      email: 'alex@example.com',
      password: 'mock-password',
    })

    expect(res).to.have.status(200)
    expect(res.body).to.have.property('id', 'u_alex')
  })

  it('returns 400 without a request body', async () => {
    const res = await request.execute(app).post('/api/auth/sign-in')

    expect(res).to.have.status(400)
    expect(res.body).to.have.property('error')
  })

  it('returns 400 without an email', async () => {
    const res = await request.execute(app).post('/api/auth/sign-in').send({
      password: 'mock-password',
    })

    expect(res).to.have.status(400)
    expect(res.body).to.have.property('error')
  })

  it('returns 400 without a password', async () => {
    const res = await request.execute(app).post('/api/auth/sign-in').send({
      email: 'alex@example.com',
    })

    expect(res).to.have.status(400)
    expect(res.body).to.have.property('error')
  })

  it('returns 401 for an unknown email', async () => {
    const res = await request.execute(app).post('/api/auth/sign-in').send({
      email: 'unknown@example.com',
      password: 'mock-password',
    })

    expect(res).to.have.status(401)
    expect(res.body).to.have.property('error')
  })
})

describe('POST /api/auth/sign-out', () => {
  it('acknowledges sign-out', async () => {
    const res = await request.execute(app).post('/api/auth/sign-out')

    expect(res).to.have.status(200)
    expect(res.body).to.have.property('success', true)
  })
})
