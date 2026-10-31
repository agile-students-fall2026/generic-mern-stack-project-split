import { Link, useParams } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import BottomNav from '../components/BottomNav.jsx'

function ReceiptDetails() {
  const { eventId } = useParams()

  return (
    <Layout
      title="Receipt details"
      left={<Link to={`/events/${eventId}`}>Back</Link>}
      nav={<BottomNav eventId={eventId} />}
    >
      <h1 className="text-heading font-bold">Receipt details</h1>
      <p className="mt-2 text-body text-muted">
        Who paid, everyone's share, and the photo.
      </p>
    </Layout>
  )
}

export default ReceiptDetails
