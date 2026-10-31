import { useEffect, useState } from 'react'
import { Link, matchPath, useLocation } from 'react-router-dom'
import api from '../api.js'

// Kept between pages, so the bar doesn't jump from 3 to 4 tabs on every tab
const organizerByEvent = new Map()

// Event tab bar fixed to the bottom of the page column.
// The organizer of the event also gets the People tab.
function BottomNav({ eventId }) {
  const { pathname } = useLocation()
  const [isOrganizer, setIsOrganizer] = useState(
    () => organizerByEvent.get(eventId) ?? false,
  )

  useEffect(() => {
    let ignore = false
    Promise.all([
      api.get('/user.json'),
      api.get(`/events/${encodeURIComponent(eventId)}.json`),
    ])
      .then(([user, event]) => {
        const organizer = user.data.id === event.data.organizerId
        organizerByEvent.set(eventId, organizer)
        if (!ignore) setIsOrganizer(organizer)
      })
      // the page shows its own load error; the bar just keeps the 3 shared tabs
      .catch(() => {})
    return () => {
      ignore = true
    }
  }, [eventId])

  const tabs = [
    { label: 'Receipts', path: '' },
    { label: 'Balances', path: '/balances' },
    { label: 'Settle up', path: '/settle-up' },
  ]
  if (isOrganizer) tabs.push({ label: 'People', path: '/people' })
  // match the way the router does (ignores case); the most specific tab wins,
  // so receipt pages keep Receipts active
  const current = tabs.findLast(tab =>
    matchPath({ path: `/events/:eventId${tab.path}`, end: false }, pathname),
  )

  return (
    <nav
      aria-label="Event"
      className={`fixed inset-x-0 bottom-0 mx-auto grid h-[50px] max-w-md border-t border-line bg-white sm:border-x ${isOrganizer ? 'grid-cols-4' : 'grid-cols-3'}`}
    >
      {tabs.map(tab => (
        <Link
          key={tab.label}
          to={`/events/${eventId}${tab.path}`}
          aria-current={tab === current ? 'page' : undefined}
          className={`flex items-center justify-center text-sm ${tab === current ? 'font-semibold text-ink underline underline-offset-4' : 'text-muted'}`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}

export default BottomNav
