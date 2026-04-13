import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000
})

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.error || err.message || 'Erro desconhecido'
    return Promise.reject(new Error(msg))
  }
)

export default api
