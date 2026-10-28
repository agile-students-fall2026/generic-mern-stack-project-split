import axios from 'axios'

// Reads the mock JSON in public/mock until the back-end exists
const api = axios.create({ baseURL: '/mock' })

// Vite answers a missing mock file with index.html, so treat a non-JSON reply as an error
api.interceptors.response.use(response =>
  typeof response.data === 'object'
    ? response
    : Promise.reject(new Error(`No mock data at ${response.config.url}`)),
)

export default api
