import { Link } from 'react-router-dom'
import Layout from '../components/Layout.jsx'

function CreateEvent() {
  return (
    <Layout title="New event" left={<Link to="/">Cancel</Link>}>
      <h1 className="text-heading font-bold">Create event</h1>
      <p className="mt-2 text-body text-muted">
        Give your event a name and share the invite link.
      </p>
    </Layout>
  )
}

export default CreateEvent
