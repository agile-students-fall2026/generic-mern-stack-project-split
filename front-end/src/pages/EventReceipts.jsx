import { useContext, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import api from '../api.js'
import JoinedEventsContext from '../JoinedEventsContext.js'
import Layout from '../components/Layout.jsx'
import BottomNav from '../components/BottomNav.jsx'
import InviteSheet from '../components/InviteSheet.jsx'
import ListRow from '../components/ListRow.jsx'
import Button from '../components/Button.jsx'
import EmptyState from '../components/EmptyState.jsx'
import PersonalLinkSheet from '../components/PersonalLinkSheet.jsx'
import Sheet from '../components/Sheet.jsx'

// Turns 3600 (cents) into "$36.00"
function formatMoney(cents) {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
}

// Turns "2026-10-13" into "Oct 13"
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function EventReceipts() {
  const { eventId } = useParams()
  const { pathname, state, key } = useLocation()
  const navigate = useNavigate()
  const { joinedAs } = useContext(JoinedEventsContext)

  // set by Create event, so a new event opens with the invite sheet
  const invite = state?.invite
  // set by Join event, so a guest sees their return link right away (#45)
  const personalLink = state?.personalLink

  // data loaded from the mock files
  const [event, setEvent] = useState(null)
  const [user, setUser] = useState(null)
  const [links, setLinks] = useState([])
  const [error, setError] = useState('')

  // which sheet is open: 'menu', 'link', or null (#45)
  const [sheet, setSheet] = useState(null)

  // load the event, the signed in user, and the return links
  useEffect(() => {
    Promise.all([
      api.get(`/events/${encodeURIComponent(eventId)}.json`),
      api.get('/user.json'),
      api.get('/return-links.json'),
    ])
      .then(([eventResponse, userResponse, linksResponse]) => {
        setEvent(eventResponse.data)
        setUser(userResponse.data)
        setLinks(linksResponse.data)
      })
      .catch(() => {
        setError('Could not load this event.')
      })
  }, [eventId])

  // which participant in this event is me: the guest I joined as in this
  // session, otherwise the signed in user
  const joinedId = joinedAs[eventId]
  let me = null
  if (event && user) {
    for (const person of event.participants) {
      if (joinedId ? person.id === joinedId : person.userId === user.id) {
        me = person
      }
    }
  }

  // a guest's personal return link, so they can get back in later (#45)
  let returnLink = null
  if (joinedId) {
    for (const link of links) {
      if (link.eventId === eventId && link.participantId === joinedId) {
        returnLink = link
      }
    }
  }

  // only show a sheet opened on this visit to the page
  let openSheet = ''
  if (sheet && sheet.key === key) {
    openSheet = sheet.name
  }

  function closeSheet() {
    setSheet(null)
    // drop the join or invite state so reload and Back don't reopen a sheet
    if (personalLink || invite) navigate(pathname, { replace: true })
  }

  // the name of a participant, from their id
  function nameOf(participantId) {
    for (const person of event.participants) {
      if (person.id === participantId) {
        return person.name
      }
    }
    return 'Someone'
  }

  // add up every receipt's total
  let totalCents = 0
  if (event) {
    for (const receipt of event.receipts) {
      totalCents = totalCents + receipt.totalCents
    }
  }

  return (
    <Layout
      title={event ? event.name : 'Receipts'}
      subtitle={me ? 'You: ' + me.name : undefined}
      left={<Link to="/">Back</Link>}
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

      {error && <p className="mt-2 font-semibold">{error}</p>}

      {!event && !error && <p className="mt-2 text-muted">Loading receipts…</p>}

      {/* no receipts yet (wireframe 12) */}
      {event && event.receipts.length === 0 && (
        <EmptyState
          title="No receipts yet"
          description={'Add the first shared expense for ' + event.name + '.'}
        >
          <Button to={`/events/${eventId}/receipts/new`}>Add receipt</Button>
        </EmptyState>
      )}

      {/* the receipt list (wireframes 20 and 30) */}
      {event && event.receipts.length > 0 && (
        <>
          <p className="mt-2 text-body text-muted">
            {event.receipts.length}{' '}
            {event.receipts.length === 1 ? 'receipt' : 'receipts'} ·{' '}
            {formatMoney(totalCents)} total
          </p>
          <Button to={`/events/${eventId}/receipts/new`} className="mt-4">
            Add receipt
          </Button>
          <ul className="mt-1">
            {event.receipts.map(receipt => (
              <ListRow
                key={receipt.id}
                title={receipt.merchant}
                subtitle={
                  'Paid by ' +
                  nameOf(receipt.payerId) +
                  ' · ' +
                  formatDate(receipt.date)
                }
                right={formatMoney(receipt.totalCents)}
                to={`/events/${eventId}/receipts/${receipt.id}`}
              />
            ))}
          </ul>
        </>
      )}

      {invite && (
        <InviteSheet
          eventName={invite.eventName}
          inviteCode={invite.inviteCode}
          onClose={closeSheet}
        />
      )}
      {!invite &&
        returnLink &&
        me &&
        (personalLink || openSheet === 'link') && (
          <PersonalLinkSheet
            participantName={me.name}
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