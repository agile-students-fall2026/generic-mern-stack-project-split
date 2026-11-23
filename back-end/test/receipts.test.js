import { expect, use } from 'chai'
import chaiHttp, { request } from 'chai-http'
import app from '../app.js'

process.env.NODE_ENV = 'test'
use(chaiHttp)

const photo = Buffer.from('not a real photo')

describe('POST /api/receipts/scan', () => {
  it('responds with 200 and the merchant and total it read', async () => {
    const res = await request
      .execute(app)
      .post('/api/receipts/scan')
      .attach('photo', photo, 'receipt.jpg')
    expect(res).to.have.status(200)
    expect(res).to.be.json
    expect(res.body).to.include({ merchant: 'Pingo Doce', totalCents: 3600 })
  })

  it('responds with 200 and no merchant or total for a blurry photo', async () => {
    const res = await request
      .execute(app)
      .post('/api/receipts/scan')
      .attach('photo', photo, 'Blurry-receipt.jpg')
    expect(res).to.have.status(200)
    expect(res.body).to.include({ merchant: null, totalCents: null })
  })

  it('responds with 400 when no photo is sent', async () => {
    const res = await request.execute(app).post('/api/receipts/scan')
    expect(res).to.have.status(400)
    expect(res.body.error).to.be.a('string').that.is.not.empty
  })

  it('responds with 400 when the photo is over 10 MB', async () => {
    const res = await request
      .execute(app)
      .post('/api/receipts/scan')
      .attach('photo', Buffer.alloc(10 * 1024 * 1024 + 1), 'receipt.jpg')
    expect(res).to.have.status(400)
    expect(res.body.error).to.be.a('string').that.is.not.empty
  })
})
