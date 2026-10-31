import { createContext } from 'react'

// Events created in this session. The mock files can't be written to, so
// these live in App state until the back-end exists and reset on reload.
const CreatedEventsContext = createContext({
  createdEvents: [],
  addEvent: () => {},
})

export default CreatedEventsContext
