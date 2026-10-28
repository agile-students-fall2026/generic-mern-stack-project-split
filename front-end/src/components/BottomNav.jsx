import { Link, useLocation } from 'react-router-dom'

// Event tab bar fixed to the bottom of the page column.
// Organizers get the extra People tab.
function BottomNav({ eventId, isOrganizer = false }) {
  const { pathname } = useLocation()
  const base = `/events/${eventId}`
  const tabs = [
    { label: 'Receipts', to: base },
    { label: 'Balances', to: `${base}/balances` },
    { label: 'Settle up', to: `${base}/settle-up` },
  ]
  if (isOrganizer) tabs.push({ label: 'People', to: `${base}/people` })
  // the most specific match wins, so receipt pages keep Receipts active
  const current = tabs.findLast(tab => pathname.startsWith(tab.to))

  return (
    <nav
      aria-label="Event"
      className={`fixed inset-x-0 bottom-0 mx-auto grid h-[50px] max-w-md border-t border-line bg-white sm:border-x ${isOrganizer ? 'grid-cols-4' : 'grid-cols-3'}`}
    >
      {tabs.map(tab => (
        <Link
          key={tab.to}
          to={tab.to}
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
