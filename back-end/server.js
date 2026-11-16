import 'dotenv/config'
import app from './app.js'

const port = process.env.PORT || 3000

app.listen(port, error => {
  // Express 5 passes listen errors (for example EADDRINUSE) here instead of throwing them
  if (error) throw error
  console.log(`Server running on http://localhost:${port}`)
})
