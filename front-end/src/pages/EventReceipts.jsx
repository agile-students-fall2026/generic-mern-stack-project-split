import { useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import api from '../api.js'
import JoinedEventsContext from '../JoinedEventsContext.js'
import Layout from '../components/Layout.jsx'
import BottomNav from '../components/BottomNav.jsx'
import InviteSheet from '../components/InviteSheet.jsx'
import Button from '../components/Button.jsx'
import PersonalLinkSheet from '../components/PersonalLinkSheet.jsx'
import Sheet from '../components/Sheet.jsx'

function EventReceipts() {
  const { eventId } = useParams()
  const { pathname, state, key } = useLocation()
  const navigate = useNavigate()
  const { joinedAs } = useContext(JoinedEventsContext)
  const [result, setResult] = useState(null)
  const [sheet, setSheet] = useState(null)
  const invite = state?.invite
  const personalLink = state && state.personalLink

  useEffect(() => {
    let ignore = false
    async function loadEvent() {
      try {
        const event = await api.get(
          `/events/${encodeURIComponent(eventId)}.json`,
        )
        if (ignore) return
        const links = await api.get('/return-links.json')
        if (!ignore) {
          setResult({ eventId, event: event.data, links: links.data })
        }
      } catch {
        if (!ignore) {
          setResult({ eventId, error: 'Could not load this event.' })
        }
      }
    }
    loadEvent()
    return () => {
      ignore = true
    }
  }, [eventId])

  const loaded = result !== null && result.eventId === eventId
  const event = loaded ? result.event : null
  let participant = null
  if (event) {
    for (const person of event.participants) {
      if (person.id === joinedAs[eventId]) {
        participant = person
        break
      }
    }
  }
  let returnLink = null
  if (loaded && result.links && participant) {
    for (const link of result.links) {
      if (link.eventId === eventId && link.participantId === participant.id) {
        returnLink = link
        break
      }
    }
  }
  let openSheet = ''
  if (sheet && sheet.key === key) {
    openSheet = sheet.name
  }

  function closeSheet() {
    setSheet(null)
    // Consume the join/invite state so reload and Back do not reopen a sheet.
    if (personalLink || invite) navigate(pathname, { replace: true })
  }

  return (
    <Layout
      title={event ? event.name : 'Receipts'}
      subtitle={participant ? `You: ${participant.name}` : undefined}
      right={
        returnLink && (
          <button type="button" onClick={() => setSheet({ key, name: 'menu' })}>
            Menu
          </button>
        )
      }
      nav={<BottomNav eventId={eventId} />}
    >
      <h1 tabIndex={-1} className="text-heading font-bold">
        Receipts
      </h1>
      {!loaded ? (
        <p className="mt-2">Loading event...</p>
      ) : result.error ? (
        <p role="alert" className="mt-2">
          {result.error}
        </p>
      ) : (
        <p className="mt-2 text-body text-muted">
          Receipts added to this event.
        </p>
      )}
      {invite && (
        <InviteSheet
          eventName={invite.eventName}
          inviteCode={invite.inviteCode}
          onClose={closeSheet}
        />
      )}
      {!invite && returnLink && (personalLink || openSheet === 'link') && (
        <PersonalLinkSheet
          participantName={participant.name}
          returnToken={returnLink.token}
          onClose={closeSheet}
        />
      )}
      {!invite && !personalLink && openSheet === 'menu' && returnLink && (
        <Sheet title={event.name} onClose={closeSheet}>
          <Button
            variant="outline"
            onClick={() => setSheet({ key, name: 'link' })}
          >
            My return link
          </Button>
        </Sheet>
      )}
    </Layout>
  )
}

export default EventReceipts
