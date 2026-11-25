import { createContext } from 'react'

// Session-only snapshots of close replies and locally confirmed transfers.
const EventClosureContext = createContext({
  closedEvents: {},
  closeEvent: () => {},
})

export default EventClosureContext
