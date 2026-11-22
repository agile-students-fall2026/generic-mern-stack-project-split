import express from 'express'
import morgan from 'morgan'
import eventsRouter from './routes/events.js'

import userRouter from './routes/user.js'

import authRouter from './routes/auth.js'

const app = express()

// skip runs per request, because the test sets NODE_ENV after importing this module
app.use(morgan('dev', { skip: () => process.env.NODE_ENV === 'test' }))
app.use(express.json())

app.get('/api', (req, res) => {
  res.json({ message: 'Split API is running' })
})

app.use('/api/events', eventsRouter)

app.use('/api/user', userRouter)

app.use('/api/auth', authRouter)

export default app
