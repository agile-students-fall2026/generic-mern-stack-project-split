import { Link, useParams } from 'react-router-dom'
import Layout from '../components/Layout.jsx'

function AddReceipt() {
  const { eventId } = useParams()

  return (
    <Layout
      title="Add receipt"
      left={<Link to={`/events/${eventId}`}>Cancel</Link>}
    >
      <h1 className="text-heading font-bold">Add receipt</h1>
      <p className="mt-2 text-body text-muted">
        Enter the receipt details and choose how to split it.
      </p>
    </Layout>
  )
}

export default AddReceipt
