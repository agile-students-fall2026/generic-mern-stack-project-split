import { useContext, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import EventClosureContext from '../EventClosureContext.js'
import Sheet from '../components/Sheet.jsx'
import InviteSheet from '../components/InviteSheet.jsx'
import { backend } from '../api.js'
import JoinedEventsContext from '../JoinedEventsContext.js'
import Layout from '../components/Layout.jsx'
import BottomNav from '../components/BottomNav.jsx'
import ListRow from '../components/ListRow.jsx'
import Button from '../components/Button.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

// Turns 2100 (cents) into "$21.00"
function formatMoney(cents) {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
}

function SettleUp() {
  const { eventId } = useParams()
  return <SettleUpEvent key={eventId} eventId={eventId} />
}

function SettleUpEvent({ eventId }) {
  const navigate = useNavigate()
  const { closedEvents, closeEvent } = useContext(EventClosureContext)
  const closure = closedEvents[eventId]
  const [sheet, setSheet] = useState(null)

  const [loadedEvent, setEvent] = useState(null)
  const event = closure?.event ?? loadedEvent
  const [closing, setClosing] = useState(false)
  const [closeError, setCloseError] = useState('')
  const closeRequest = useRef(null)
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const [transfers, setTransfers] = useState([])
  const [confirming, setConfirming] = useState(null)
  const [markingPaid, setMarkingPaid] = useState(null)
  const [savingPaid, setSavingPaid] = useState(false)
  const [markPaidError, setMarkPaidError] = useState('')
  const [savingConfirm, setSavingConfirm] = useState(false)
  const [confirmError, setConfirmError] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const [fewestTransfers, setFewestTransfers] = useState([])
  const [showFewest, setShowFewest] = useState(false)
  const { joinedAs } = useContext(JoinedEventsContext)

  // load the event and the signed in user when the page opens
  useEffect(() => {
    let cancelled = false
    Promise.all([
      backend.get(`/api/events/${encodeURIComponent(eventId)}`),
      backend.get('/api/user'),
    ])
      .then(([eventResponse, userResponse]) => {
        if (cancelled) return
        setEvent(eventResponse.data)
        setUser(userResponse.data)
        setTransfers(eventResponse.data.settlement.all)
        setFewestTransfers(eventResponse.data.settlement.fewest)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this event.')
      })
    return () => {
      cancelled = true
      closeRequest.current?.abort()
    }
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

  const isClosed = Boolean(closure) || event?.status === 'closed'
  const allTransfers = closure?.transfers ?? transfers
  const outstanding = allTransfers.filter(
    transfer => transfer.amountCents > 0 && transfer.status !== 'confirmed',
  ).length
  const isOrganizer = me?.role === 'organizer'
  const canClose = Boolean(
    event &&
    event.id === eventId &&
    !error &&
    event.status === 'active' &&
    isOrganizer &&
    !isClosed &&
    outstanding === 0,
  )

  async function confirmClose() {
    if (!canClose || closeRequest.current) return
    const controller = new AbortController()
    closeRequest.current = controller
    setClosing(true)
    setCloseError('')
    try {
      const response = await backend.post(
        `/api/events/${encodeURIComponent(eventId)}/close`,
        undefined,
        { signal: controller.signal, timeout: 15000 },
      )
      if (controller.signal.aborted) return
      const closedEvent = response.data
      if (
        closedEvent?.id !== eventId ||
        closedEvent.status !== 'closed' ||
        typeof closedEvent.closedAt !== 'string' ||
        Number.isNaN(Date.parse(closedEvent.closedAt))
      ) {
        throw new Error('Invalid close response')
      }
      closeEvent(closedEvent, allTransfers)
      setSheet(null)
      navigate(`/events/${encodeURIComponent(eventId)}`)
    } catch (error) {
      if (controller.signal.aborted) return
      setCloseError(
        typeof error.response?.data?.error === 'string'
          ? error.response.data.error
          : 'Could not close this event. Please try again.',
      )
    } finally {
      closeRequest.current = null
      if (!controller.signal.aborted) setClosing(false)
    }
  }

  // "you" for me, otherwise the person's name
  function nameOf(participantId) {
    if (me && participantId === me.id) {
      return 'you'
    }
    for (const person of event.participants) {
      if (person.id === participantId) {
        return person.name
      }
    }
    return 'Someone'
  }

  // "You pay Alex", "Sam pays you", "Sam pays Jordan"
  function rowTitle(transfer) {
    const from = nameOf(transfer.fromId)
    const to = nameOf(transfer.toId)
    if (from === 'you') {
      return 'You pay ' + to
    }
    return from + ' pays ' + to
  }

  // the grey status line under each payment
  function rowSubtitle(transfer) {
    if (transfer.status === 'confirmed') {
      return 'Settled'
    }
    if (transfer.status === 'pending' && me && transfer.toId === me.id) {
      return nameOf(transfer.fromId) + ' marked this paid'
    }
    if (transfer.status === 'pending') {
      return 'Pending – waiting for ' + nameOf(transfer.toId)
    }
    // unpaid
    if (me && transfer.fromId === me.id) {
      return 'You owe this'
    }
    if (me && transfer.toId === me.id) {
      return 'Waiting for ' + nameOf(transfer.fromId) + ' to pay'
    }
    return 'Not paid yet'
  }

  // the small button under the amount, only on payments waiting on me
  function rowButton(transfer) {
    if (isClosed) return null
    if (transfer.status === 'pending' && me && transfer.toId === me.id) {
      return (
        <Button small onClick={() => setConfirming(transfer)}>
          Confirm received
        </Button>
      )
    }
    if (transfer.status === 'unpaid' && me && transfer.fromId === me.id) {
      return (
        <Button small onClick={() => setMarkingPaid(transfer)}>
          Mark paid
        </Button>
      )
    }
    return null
  }

  // the list on screen: all transfers, or the shorter fewest list (#55)
  const shown = !isClosed && showFewest ? fewestTransfers : allTransfers

  // change the status of one payment, keeping it the same row
  function setStatus(target, status) {
    if (isClosed) return
    // takes the latest list, because a reply from the back-end can arrive later
    const update = list =>
      list.map(transfer => {
        if (
          transfer.fromId === target.fromId &&
          transfer.toId === target.toId
        ) {
          return { ...transfer, status: status }
        }
        return transfer
      })
    if (showFewest) {
      setFewestTransfers(update)
    } else {
      setTransfers(update)
    }
  }

  // the receiver confirms the money arrived; the reply settles it (wireframe 28, #138)
  function confirmPayment() {
    if (isClosed || savingConfirm) return
    const target = confirming
    setSavingConfirm(true)
    setConfirmError('')
    backend
      .post(`/api/events/${encodeURIComponent(eventId)}/payments/confirm`, {
        fromId: target.fromId,
        toId: target.toId,
        plan: showFewest ? 'fewest' : 'all',
      })
      .then(response => {
        setStatus(target, response.data.status)
        setAnnouncement(
          'Confirmed ' +
            formatMoney(target.amountCents) +
            ' from ' +
            nameOf(target.fromId) +
            '. This payment is settled.',
        )
        setConfirming(null)
      })
      .catch(error => {
        // the server explains a 404 or 409; otherwise the request never got there
        setConfirmError(
          error.response?.data?.error ||
            'Could not confirm this payment. Try again.',
        )
      })
      .finally(() => {
        setSavingConfirm(false)
      })
  }

  // I paid outside the app, now it waits for the other person (wireframe 26)
  function markPaid() {
    if (isClosed || savingPaid) return
    const target = markingPaid
    setSavingPaid(true)
    setMarkPaidError('')
    backend
      .post(`/api/events/${encodeURIComponent(eventId)}/payments/mark-paid`, {
        fromId: target.fromId,
        toId: target.toId,
        plan: showFewest ? 'fewest' : 'all',
      })
      .then(response => {
        setStatus(target, response.data.status)
        setAnnouncement(
          'Marked ' +
            formatMoney(target.amountCents) +
            ' to ' +
            nameOf(target.toId) +
            ' as paid. Waiting for ' +
            nameOf(target.toId) +
            ' to confirm.',
        )
        setMarkingPaid(null)
      })
      .catch(() => {
        setMarkPaidError('Could not mark this as paid. Try again.')
      })
      .finally(() => {
        setSavingPaid(false)
      })
  }

  return (
    <Layout
      title={event ? event.name : 'Settle up'}
      subtitle={me ? 'You: ' + me.name : undefined}
      left={<Link to="/">Back</Link>}
      right={
        isOrganizer &&
        !isClosed &&
        event?.id === eventId && (
          <button type="button" onClick={() => setSheet('menu')}>
            Menu
          </button>
        )
      }
      nav={<BottomNav eventId={eventId} />}
    >
      <h1 tabIndex={-1} className="text-heading font-bold">
        Settle up
      </h1>

      {error && <p className="mt-2 font-semibold">{error}</p>}

      {!event && !error && <p className="mt-2 text-muted">Loading payments…</p>}

      {event && (
        <>
          <p className="mt-2 text-body text-muted">
            {isClosed
              ? 'Closed · read-only'
              : 'Pay each other outside the app, then mark it here.'}
          </p>
          {!isClosed && (
            <div
              role="status"
              className="mt-4 rounded-lg border border-line bg-surface p-3"
            >
              {outstanding > 0 ? (
                `${outstanding} ${outstanding === 1 ? 'payment' : 'payments'} still unpaid or pending`
              ) : (
                <>
                  <p className="font-semibold">All payments settled</p>
                  <p className="text-muted">
                    No further payments are required.
                  </p>
                </>
              )}
            </div>
          )}
          {!isClosed && (
            <label className="mt-4 flex items-center justify-between">
              Fewest transfers
              <input
                type="checkbox"
                checked={showFewest}
                onChange={() => setShowFewest(!showFewest)}
                className="size-6 accent-ink"
              />
            </label>
          )}
          {shown.length === 0 && (
            <p className="mt-4 text-body text-muted">
              No payments yet. Add receipts to see who owes whom.
            </p>
          )}
          <ul className="mt-1">
            {shown.map(transfer => (
              <ListRow
                key={transfer.fromId + '-' + transfer.toId}
                title={rowTitle(transfer)}
                subtitle={rowSubtitle(transfer)}
                right={
                  <div className="flex flex-col items-end gap-2">
                    {formatMoney(transfer.amountCents)}
                    {rowButton(transfer)}
                  </div>
                }
              />
            ))}
          </ul>
          <p role="status" className="sr-only">
            {announcement}
          </p>
        </>
      )}

      {sheet === 'menu' && isOrganizer && !isClosed && (
        <Sheet title={event.name} onClose={() => setSheet(null)}>
          <Button variant="outline" onClick={() => setSheet('invite')}>
            Invite link
          </Button>
          <Button
            disabled={!canClose}
            className="disabled:bg-gray-200 disabled:text-gray-500"
            onClick={() => {
              setCloseError('')
              setSheet('close')
            }}
          >
            Close event
          </Button>
          {outstanding > 0 && (
            <p className="text-center text-body text-muted">
              {outstanding} {outstanding === 1 ? 'payment' : 'payments'} still
              unpaid or pending
            </p>
          )}
        </Sheet>
      )}
      {sheet === 'invite' && !isClosed && (
        <InviteSheet
          eventName={event.name}
          inviteCode={event.inviteCode}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'close' && !isClosed && (
        <ConfirmDialog
          title={`Close ${event.name}?`}
          description="Closed events are read-only. No one can add receipts or change payments."
          confirmLabel={closing ? 'Closing…' : 'Close event'}
          busy={closing}
          onConfirm={confirmClose}
          onClose={() => setSheet(null)}
        >
          {closeError && <p role="alert">{closeError}</p>}
          {closing && <p role="status">Closing event…</p>}
        </ConfirmDialog>
      )}

      {!isClosed && markingPaid && (
        <ConfirmDialog
          title={
            'Mark ' +
            formatMoney(markingPaid.amountCents) +
            ' to ' +
            nameOf(markingPaid.toId) +
            ' as paid?'
          }
          description={
            'Only do this after you’ve paid ' +
            nameOf(markingPaid.toId) +
            ' outside the app. ' +
            nameOf(markingPaid.toId) +
            ' will be asked to confirm it.'
          }
          confirmLabel={savingPaid ? 'Marking…' : 'Mark paid'}
          onConfirm={markPaid}
          onClose={() => {
            setMarkingPaid(null)
            setMarkPaidError('')
          }}
        >
          {markPaidError && (
            <p role="alert" className="text-sm font-semibold">
              {markPaidError}
            </p>
          )}
        </ConfirmDialog>
      )}

      {!isClosed && confirming && (
        <ConfirmDialog
          title={
            'Confirm ' +
            formatMoney(confirming.amountCents) +
            ' from ' +
            nameOf(confirming.fromId) +
            '?'
          }
          description="Confirm only once the money has arrived. This settles the payment for everyone."
          confirmLabel={savingConfirm ? 'Confirming…' : 'Confirm'}
          onConfirm={confirmPayment}
          onClose={() => {
            setConfirming(null)
            setConfirmError('')
          }}
        >
          {confirmError && (
            <p role="alert" className="text-sm font-semibold">
              {confirmError}
            </p>
          )}
        </ConfirmDialog>
      )}
    </Layout>
  )
}

export default SettleUp
