import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 30000, // longer timeout for video uploads + AI
})

API.interceptors.request.use(config => {
  const token = localStorage.getItem('civic_token')
  if (token && token !== 'mock-token') config.headers.Authorization = `Bearer ${token}`
  return config
})

API.interceptors.response.use(
  res => res,
  err => {
    // Only clear session on 401 if we were using a real token.
    // When using mock-token (backend offline), let the store's catch handlers
    // fallback to mock data instead of nuking the session.
    const token = localStorage.getItem('civic_token')
    if (err.response?.status === 401 && token && token !== 'mock-token') {
      localStorage.removeItem('civic_token')
      localStorage.removeItem('civic_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const loginAPI    = d  => API.post('/api/auth/login',    d)
export const registerAPI = d  => API.post('/api/auth/register', d)
export const getMeAPI    = () => API.get('/api/auth/me')

// Issues
export const getIssuesAPI   = params  => API.get('/api/issues', { params })
export const getIssueAPI    = id      => API.get(`/api/issues/${id}`)
export const createIssueAPI = d       => API.post('/api/issues', d, { headers: { 'Content-Type': 'multipart/form-data' } })
export const upvoteIssueAPI = id      => API.put(`/api/issues/${id}/upvote`)
export const addCommentAPI  = (id, d) => API.post(`/api/issues/${id}/comments`, d)
export const getNearbyAPI   = params  => API.get('/api/issues/nearby/search', { params })

// Admin
export const getAdminStatsAPI    = ()       => API.get('/api/admin/stats')
export const getAdminIssuesAPI   = params   => API.get('/api/admin/issues', { params })
export const updateIssueAdminAPI = (id, d)  => API.put(`/api/admin/issues/${id}`, d)
export const uploadAfterImageAPI = (id, d)  => API.post(`/api/admin/issues/${id}/after-image`, d)
export const getAdminUsersAPI    = ()       => API.get('/api/admin/users')

// Blockchain verification (read from chain via backend proxy or direct ethers in browser)
export const getBlockchainRecordAPI = id => API.get(`/api/issues/${id}`).then(r => ({
  txHash:    r.data.data?.blockchainTxHash,
  hash:      r.data.data?.complaintHash,
  recordedAt: r.data.data?.blockchainRecordedAt,
}))

export default API
