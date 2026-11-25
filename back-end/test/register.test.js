import { expect, use } from 'chai'
import chaiHttp, { request } from 'chai-http'
import app from '../app.js'

process.env.NODE_ENV = 'test'
use(chaiHttp)

function register(body) {
  return request.execute(app).post('/api/auth/register').send(body)
}

const valid = { email: 'jamie@example.com', password: 'mock-password' }

describe('POST /api/auth/register', () => {
  it('responds with 201 and the new account', async () => {
    const res = await register(valid)

    expect(res).to.have.status(201)
    expect(res).to.be.json
    expect(res.body).to.deep.equal({
      id: 'u_new',
      name: null,
      email: 'jamie@example.com',
    })
  })

  it('trims spaces around the email', async () => {
    const res = await register({ ...valid, email: '  jamie@example.com  ' })

    expect(res).to.have.status(201)
    expect(res.body.email).to.equal('jamie@example.com')
  })

  it('never sends the password back', async () => {
    const res = await register(valid)

    expect(res.body).to.not.have.property('password')
  })

  it('does not change the mock data', async () => {
    await register(valid)
    const res = await request.execute(app).get('/api/user')

    expect(res.body.email).to.equal('alex@example.com')
  })

  it('responds with 400 when no body is sent', async () => {
    const res = await request.execute(app).post('/api/auth/register')

    expect(res).to.have.status(400)
    expect(res.body.error).to.equal('Enter your email and password.')
  })

  for (const [label, body] of [
    ['is missing', { password: 'mock-password' }],
    ['is empty', { email: '', password: 'mock-password' }],
    ['is only spaces', { email: '   ', password: 'mock-password' }],
    ['is not text', { email: 42, password: 'mock-password' }],
  ]) {
    it(`responds with 400 when the email ${label}`, async () => {
      const res = await register(body)

      expect(res).to.have.status(400)
      expect(res.body.error).to.equal('Enter your email.')
    })
  }

  for (const [label, body] of [
    ['is missing', { email: 'jamie@example.com' }],
    ['is empty', { email: 'jamie@example.com', password: '' }],
    ['is only spaces', { email: 'jamie@example.com', password: '   ' }],
  ]) {
    it(`responds with 400 when the password ${label}`, async () => {
      const res = await register(body)

      expect(res).to.have.status(400)
      expect(res.body.error).to.equal('Enter your password.')
    })
  }

  it('responds with 409 when the email is already in use', async () => {
    const res = await register({ ...valid, email: 'alex@example.com' })

    expect(res).to.have.status(409)
    expect(res.body.error).to.equal(
      'An account with this email already exists.',
    )
  })

  it('treats the email the same whatever its capital letters', async () => {
    const res = await register({ ...valid, email: 'Alex@Example.com' })

    expect(res).to.have.status(409)
  })
})
