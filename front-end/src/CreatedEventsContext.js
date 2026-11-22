import { createContext } from 'react'

// Events created in this session. The back-end does not save them yet, so
// these live in App state and reset on reload.
const CreatedEventsContext = createContext({
  createdEvents: [],
  addEvent: () => {},
})

export default CreatedEventsContext
