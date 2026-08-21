import axios from 'axios'
import { clearToken, getToken } from './auth-storage'
import { toApiError } from './api-error'
import type {
  CreateGroupRequest,
  LoginRequest,
  LoginResponse,
  Message,
  MessagesPage,
  SendMessageRequest,
  StartDirectResponse,
  User,
  Conversation,
} from '../types/api'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = toApiError(error)

    if (apiError.status === 401) {
      clearToken()
      window.dispatchEvent(new Event('auth:unauthorized'))
    }

    return Promise.reject(apiError)
  },
)

export const chatApi = {
  login(body: LoginRequest) {
    return http.post<LoginResponse>('/auth/login', body).then((res) => res.data)
  },

  me() {
    return http.get<User>('/auth/me').then((res) => res.data)
  },

  searchUsers(q: string) {
    return http
      .get<User[]>(`/users/search?q=${encodeURIComponent(q)}`)
      .then((res) => res.data ?? [])
  },

  listUsers() {
    return http.get<User[]>('/users/search').then((res) => res.data ?? [])
  },

  listConversations() {
    return http
      .get<{ data: Conversation[] }>('/conversations')
      .then((res) => res.data.data)
  },

  startDirectConversation(userId: string) {
    return http
      .post<StartDirectResponse>('/conversations', { userId })
      .then((res) => res.data)
  },

  createGroup(body: CreateGroupRequest) {
    return http.post('/conversations/group', body).then((res) => res.data)
  },

  addParticipants(conversationId: string, userIds: string[]) {
    return http
      .post(`/conversations/${conversationId}/participants`, { userIds })
      .then((res) => res.data)
  },

  removeParticipant(conversationId: string, userId: string) {
    return http
      .delete(`/conversations/${conversationId}/participants/${userId}`)
      .then((res) => res.data)
  },

  promoteAdmin(conversationId: string, userId: string) {
    return http
      .post(`/conversations/${conversationId}/admins`, { userId })
      .then((res) => res.data)
  },

  renameGroup(conversationId: string, name: string) {
    return http
      .patch(`/conversations/${conversationId}`, { name })
      .then((res) => res.data)
  },

  getMessages(conversationId: string, params?: { limit?: number; before?: string }) {
    return http
      .get<MessagesPage>(`/conversations/${conversationId}/messages`, { params })
      .then((res) => res.data)
  },

  sendMessage(body: SendMessageRequest) {
    return http.post<Message>('/messages', body).then((res) => res.data)
  },
}
