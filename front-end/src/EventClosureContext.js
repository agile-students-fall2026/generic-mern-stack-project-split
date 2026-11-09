import { createContext } from 'react'

// Session-only closure snapshots; refreshing restores the mock data.
const EventClosureContext = createContext({
  closedEvents: {},
  closeEvent: () => {},
})

export default EventClosureContext
