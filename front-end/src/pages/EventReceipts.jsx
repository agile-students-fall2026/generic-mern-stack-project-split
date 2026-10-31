import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import BottomNav from '../components/BottomNav.jsx'
import InviteSheet from '../components/InviteSheet.jsx'

function EventReceipts() {
  const { eventId } = useParams()
  const { pathname, state } = useLocation()
  const navigate = useNavigate()
  // set by Create event, so a new event opens with the invite sheet
  const invite = state?.invite

  return (
    <Layout title="Receipts" nav={<BottomNav eventId={eventId} />}>
      <h1 tabIndex={-1} className="text-heading font-bold">
        Receipts
      </h1>
      <p className="mt-2 text-body text-muted">Receipts added to this event.</p>
      {invite && (
        <InviteSheet
          eventName={invite.eventName}
          inviteCode={invite.inviteCode}
          // drop the state so Back or a reload doesn't reopen the sheet
          onClose={() => navigate(pathname, { replace: true })}
        />
      )}
    </Layout>
  )
}

export default EventReceipts
