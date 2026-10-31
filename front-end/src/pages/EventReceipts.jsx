import { useParams } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import BottomNav from '../components/BottomNav.jsx'

function EventReceipts() {
  const { eventId } = useParams()

  return (
    <Layout title="Receipts" nav={<BottomNav eventId={eventId} />}>
      <h1 className="text-heading font-bold">Receipts</h1>
      <p className="mt-2 text-body text-muted">Receipts added to this event.</p>
    </Layout>
  )
}

export default EventReceipts
