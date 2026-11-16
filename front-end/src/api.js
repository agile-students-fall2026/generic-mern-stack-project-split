import axios from 'axios'

// Reads the mock JSON in public/mock, for screens that have not moved to the back-end yet
const api = axios.create({ baseURL: '/mock' })

// Vite answers a missing mock file with index.html, so treat a non-JSON reply as an error
api.interceptors.response.use(response =>
  typeof response.data === 'object'
    ? response
    : Promise.reject(new Error(`No mock data at ${response.config.url}`)),
)

// The Express server. Screens move from `api` to this one at a time.
export const backend = axios.create({
  baseURL: import.meta.env.VITE_BACKEND || 'http://localhost:3000',
})

export default api
