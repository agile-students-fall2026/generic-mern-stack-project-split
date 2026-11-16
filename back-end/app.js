import express from 'express'
import morgan from 'morgan'

const app = express()

// skip runs per request, because the test sets NODE_ENV after importing this module
app.use(morgan('dev', { skip: () => process.env.NODE_ENV === 'test' }))
app.use(express.json())

app.get('/api', (req, res) => {
  res.json({ message: 'Split API is running' })
})

export default app
