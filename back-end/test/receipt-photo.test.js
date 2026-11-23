import { rm } from 'node:fs/promises'
import { expect, use } from 'chai'
import chaiHttp, { request } from 'chai-http'
import app from '../app.js'

process.env.NODE_ENV = 'test'
use(chaiHttp)

// the smallest valid PNG: one transparent pixel
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)
const url = '/api/events/evt_lisbon/receipts/photo'

describe('POST /api/events/:eventId/receipts/photo', () => {
  const stored = []
  // uploads land in the real uploads folder, so remove what these tests add
  after(() =>
    Promise.all(stored.map(path => rm(new URL(`..${path}`, import.meta.url)))),
  )

  it('stores the photo and responds with 201 and its URL', async () => {
    const res = await request
      .execute(app)
      .post(url)
      .attach('photo', png, 'receipt.png')
    expect(res).to.have.status(201)
    expect(res).to.be.json
    const { pathname } = new URL(res.body.photoUrl)
    stored.push(pathname)
    expect(pathname).to.match(/^\/uploads\/[\w-]+\.png$/)
  })

  it('serves the stored photo at that URL', async () => {
    const upload = await request
      .execute(app)
      .post(url)
      .attach('photo', png, 'receipt.png')
    const { pathname } = new URL(upload.body.photoUrl)
    stored.push(pathname)
    const res = await request.execute(app).get(pathname).buffer()
    expect(res).to.have.status(200)
    expect(res).to.have.header('content-type', 'image/png')
    expect(res.body.equals(png)).to.equal(true)
  })

  it('responds with 404 for a photo that was never uploaded', async () => {
    const res = await request.execute(app).get('/uploads/nope.png')
    expect(res).to.have.status(404)
  })

  it('responds with 404 for an unknown event', async () => {
    const res = await request
      .execute(app)
      .post('/api/events/evt_nope/receipts/photo')
      .attach('photo', png, 'receipt.png')
    expect(res).to.have.status(404)
    expect(res.body.error).to.equal('Event not found.')
  })

  it('responds with 400 when no photo is sent', async () => {
    const res = await request.execute(app).post(url)
    expect(res).to.have.status(400)
    expect(res.body.error).to.be.a('string').that.is.not.empty
  })

  it('responds with 400 when the file is not an image', async () => {
    const res = await request
      .execute(app)
      .post(url)
      .attach('photo', Buffer.from('<script>'), 'receipt.html')
    expect(res).to.have.status(400)
    expect(res.body.error).to.be.a('string').that.is.not.empty
  })

  it('responds with 400 when the photo is over 10 MB', async () => {
    const res = await request
      .execute(app)
      .post(url)
      .attach('photo', Buffer.alloc(10 * 1024 * 1024 + 1), 'receipt.png')
    expect(res).to.have.status(400)
    expect(res.body.error).to.be.a('string').that.is.not.empty
  })
})
