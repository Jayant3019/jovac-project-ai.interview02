import axios from 'axios'
export const api = axios.create({ baseURL: '/api', withCredentials: true })
export const errMsg = (e: any): string => e?.response?.data?.error || (e?.code === 'ERR_NETWORK' ? 'Cannot reach the server. Check your connection.' : e?.message) || 'Something went wrong'
