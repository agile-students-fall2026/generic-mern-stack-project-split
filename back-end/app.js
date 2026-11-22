import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import eventsRouter from './routes/events.js'

import userRouter from './routes/user.js'

import authRouter from './routes/auth.js'

const app = express()

// skip runs per request, because the test sets NODE_ENV after importing this module
app.use(morgan('dev', { skip: () => process.env.NODE_ENV === 'test' }))
// browsers block the front-end's requests unless the server names its address
app.use(
  cors({ origin: process.env.FRONT_END_DOMAIN || 'http://localhost:5173' }),
)
app.use(express.json())

app.get('/api', (req, res) => {
  res.json({ message: 'Split API is running' })
})

app.use('/api/events', eventsRouter)

app.use('/api/user', userRouter)

app.use('/api/auth', authRouter)

export default app
