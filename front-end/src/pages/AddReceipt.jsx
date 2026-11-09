import { useContext, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import EventClosureContext from '../EventClosureContext.js'
import api from '../api.js'
import Button from '../components/Button.jsx'
import Layout from '../components/Layout.jsx'
import TextField from '../components/TextField.jsx'

function readCents(text) {
  const parts = text.trim().split('.')
  if (parts.length > 2 || parts[0] === '') return null

  let decimals = ''
  if (parts.length === 2) decimals = parts[1]
  if (decimals.length > 2) return null

  const digits = parts[0] + decimals
  for (const digit of digits) {
    if (digit < '0' || digit > '9') return null
  }

  if (decimals.length === 0) decimals = '00'
  if (decimals.length === 1) decimals = decimals + '0'

  const cents = Number(parts[0]) * 100 + Number(decimals)
  if (!Number.isSafeInteger(cents) || cents <= 0) return null
  return cents
}

function money(cents) {
  let pennies = String(cents % 100)
  if (pennies.length === 1) pennies = '0' + pennies
  return '$' + Math.floor(cents / 100) + '.' + pennies
}

function AddReceipt({ addReceipt }) {
  const { eventId } = useParams()
  // set by "Use a photo" on the receipt list (#49)
  const { state } = useLocation()
  // shortcut: a blob URL may not survive a reload, until the back-end stores photos
  const photoUrl = state?.photoUrl ?? null
  const photoName = state?.photoName ?? ''
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const { closedEvents } = useContext(EventClosureContext)
  const closure = closedEvents[eventId]
  const isClosed = Boolean(closure) || event?.status === 'closed'
  const [error, setError] = useState(null)
  const [total, setTotal] = useState('')
  const [payerId, setPayerId] = useState('')
  const [included, setIncluded] = useState([])
  const [message, setMessage] = useState('')
  const [saved, setSaved] = useState(null)
  const [merchant, setMerchant] = useState('')
  // keyed by photoUrl so a result for an earlier photo never shows
  const [scan, setScan] = useState(null)
  const scanned = scan?.photoUrl === photoUrl ? scan : null
  const pickInput = useRef(null)
  const banner = useRef(null)
  // read only once the event has loaded, since loading it clears the total
  const eventReady = event?.id === eventId

  useEffect(() => {
    api
      .get('/events/' + encodeURIComponent(eventId) + '.json')
      .then(response => {
        const data = response.data
        if (data.id !== eventId || !Array.isArray(data.participants)) {
          setError({ eventId, message: 'Could not load this event.' })
          return
        }

        const selected = []
        for (const person of data.participants) {
          selected.push(person.id)
        }
        setIncluded(selected)
        setTotal('')
        setPayerId('')
        setMessage('')
        setSaved(null)
        setError(null)
        setEvent(data)
      })
      .catch(() => {
        setError({ eventId, message: 'Could not load this event.' })
      })
  }, [eventId])

  useEffect(() => {
    if (!photoUrl || !eventReady) return
    let ignore = false
    // stands in for the real receipt reader until the back-end exists
    const timer = setTimeout(() => {
      api
        .get('/scan-receipt.json')
        .then(response => {
          if (ignore) return
          const found = /blurry/i.test(photoName)
            ? response.data.failed
            : response.data.read
          setScan({ photoUrl, totalCents: found.totalCents })
          setMerchant(found.merchant ?? '')
          // plain digits, since readCents rejects "$36.00"
          setTotal(
            found.totalCents === null
              ? ''
              : (found.totalCents / 100).toFixed(2),
          )
        })
        .catch(() => {
          if (ignore) return
          setScan({ photoUrl, totalCents: null })
          setMerchant('')
          setTotal('')
        })
    }, 1500)
    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [photoUrl, photoName, eventReady])

  // the reading screen is swapped for the form, so move focus to the result
  useEffect(() => {
    banner.current?.focus()
  }, [scan])

  // "Try another photo": read the new photo on this same form
  function photoPicked(changeEvent) {
    const file = changeEvent.target.files[0]
    if (!file) return
    const picked = URL.createObjectURL(file)
    // the replaced photo was never saved, so let the browser free it
    URL.revokeObjectURL(photoUrl)
    navigate(`/events/${eventId}/receipts/new`, {
      replace: true,
      state: { photoUrl: picked, photoName: file.name },
    })
  }

  function isIncluded(id) {
    for (const selectedId of included) {
      if (selectedId === id) return true
    }
    return false
  }

  function changeIncluded(id, checked) {
    const selected = []
    for (const selectedId of included) {
      if (selectedId !== id) selected.push(selectedId)
    }
    if (checked) selected.push(id)
    setIncluded(selected)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (saved) return

    if (
      !event ||
      event.id !== eventId ||
      isClosed ||
      event.status !== 'active'
    ) {
      setMessage('This event is not available.')
      return
    }

    const totalCents = readCents(total)
    if (totalCents === null) {
      setMessage('Enter a positive amount with at most two decimal places.')
      return
    }

    let payerFound = false
    const people = []
    for (const person of event.participants) {
      if (person.id === payerId) payerFound = true
      if (isIncluded(person.id)) people.push(person)
    }

    if (!payerFound) {
      setMessage('Choose who paid.')
      return
    }
    if (people.length === 0) {
      setMessage('Choose at least one participant.')
      return
    }

    const each = Math.floor(totalCents / people.length)
    const extra = totalCents % people.length
    const shares = []

    for (let i = 0; i < people.length; i++) {
      let amountCents = each
      if (i < extra) amountCents = amountCents + 1
      shares.push({
        participantId: people[i].id,
        amountCents: amountCents,
        percent: null,
      })
    }

    const now = new Date()
    let month = String(now.getMonth() + 1)
    let day = String(now.getDate())
    if (month.length === 1) month = '0' + month
    if (day.length === 1) day = '0' + day

    const receipt = {
      eventId: eventId,
      merchant: merchant.trim() || 'Shared expense',
      date: now.getFullYear() + '-' + month + '-' + day,
      totalCents: totalCents,
      payerId: payerId,
      split: 'equal',
      photoUrl: photoUrl,
      shares: shares,
    }

    if (addReceipt(receipt) === false) {
      setMessage('This event is closed. New receipts cannot be added.')
      return
    }
    setMessage('')
    setSaved(receipt)
  }

  let content
  if (error && error.eventId === eventId) {
    content = <p role="alert">{error.message}</p>
  } else if (!event || event.id !== eventId) {
    content = <p>Loading event...</p>
  } else if (isClosed || event.status !== 'active') {
    content = <p>This event is closed. New receipts cannot be added.</p>
  } else if (saved) {
    content = (
      <div className="space-y-3">
        <p>Receipt saved temporarily.</p>
        <p>Total: {money(saved.totalCents)}</p>
        <ul>
          {saved.shares.map(share => {
            let name = share.participantId
            for (const person of event.participants) {
              if (person.id === share.participantId) name = person.name
            }
            return (
              <li key={share.participantId}>
                {name}: {money(share.amountCents)}
              </li>
            )
          })}
        </ul>
        <p className="text-sm">Refreshing clears this temporary receipt.</p>
      </div>
    )
  } else if (photoUrl && !scanned) {
    content = (
      <div className="space-y-5">
        <img
          src={photoUrl}
          alt="The receipt photo you picked"
          className="h-96 w-full rounded-xl object-cover"
        />
        <h2 className="text-xl font-bold">Reading receipt…</h2>
        <div
          role="progressbar"
          aria-label="Reading receipt"
          className="h-1.5 w-full overflow-hidden rounded-full bg-track"
        >
          <div className="h-full w-2/5 rounded-full bg-ink" />
        </div>
        <p className="text-body text-muted">
          Looking for the merchant and total.
        </p>
        <Button variant="outline" to={'/events/' + eventId}>
          Cancel
        </Button>
      </div>
    )
  } else {
    const failed = scanned && scanned.totalCents === null
    content = (
      <form className="space-y-5" onSubmit={handleSubmit}>
        <p>{event.name}</p>
        {scanned && (
          <div
            ref={banner}
            tabIndex={-1}
            role="status"
            className={`rounded-xl bg-surface px-3 py-2.5 ${failed ? 'border-2 border-ink' : 'border border-line'}`}
          >
            <p className="text-body font-semibold">
              {failed
                ? "Couldn't read this photo"
                : 'Read from photo, check it'}
            </p>
            <p className="text-caption text-muted">
              {failed
                ? 'Enter the details yourself. The photo stays attached.'
                : 'Fix anything that looks wrong before saving.'}
            </p>
          </div>
        )}
        {photoUrl && (
          <img
            src={photoUrl}
            alt="The receipt photo you picked"
            className="h-28 w-full rounded-xl object-cover"
          />
        )}
        <TextField
          label="Merchant (optional)"
          placeholder="e.g. Pingo Doce"
          value={merchant}
          onChange={e => setMerchant(e.target.value)}
        />
        <label className="block">
          <span className="block font-semibold">Total (USD)</span>
          <input
            type="text"
            inputMode="decimal"
            className="mt-2 min-h-12 w-full rounded-lg border p-3"
            placeholder="0.00"
            value={total}
            onChange={e => setTotal(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="block font-semibold">Who paid?</span>
          <select
            className="mt-2 min-h-12 w-full rounded-lg border p-3"
            value={payerId}
            onChange={e => setPayerId(e.target.value)}
          >
            <option value="">Choose a participant</option>
            {event.participants.map(person => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend className="font-semibold">Split equally between</legend>
          {event.participants.map(person => (
            <label
              key={person.id}
              className="flex min-h-12 items-center gap-3 py-2"
            >
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={isIncluded(person.id)}
                onChange={e => changeIncluded(person.id, e.target.checked)}
              />
              <span>{person.name}</span>
            </label>
          ))}
        </fieldset>
        {message && <p role="alert">{message}</p>}
        <button
          type="submit"
          className="min-h-12 w-full rounded-lg bg-black px-4 py-3 font-semibold text-white"
        >
          Save receipt
        </button>
        {scanned && !failed && (
          <>
            <Button variant="text" onClick={() => pickInput.current.click()}>
              Try another photo
            </Button>
            <input
              ref={pickInput}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={photoPicked}
            />
          </>
        )}
      </form>
    )
  }

  return (
    <Layout
      title="Add receipt"
      left={<Link to={'/events/' + eventId}>Cancel</Link>}
    >
      <h1 className="text-heading font-bold">Add receipt</h1>
      <div className="mt-4">{content}</div>
    </Layout>
  )
}

export default AddReceipt
