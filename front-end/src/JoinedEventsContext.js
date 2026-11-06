import { createContext } from 'react'

// eventId -> participantId for events joined with an invite link; resets on reload.
const JoinedEventsContext = createContext({
  joinedAs: {},
  addJoin: () => {},
})

export default JoinedEventsContext
