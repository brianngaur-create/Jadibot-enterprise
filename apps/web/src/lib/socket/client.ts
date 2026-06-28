import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/lib/auth/store'

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001'

export type SocketConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

export interface SocketConfig {
  namespace?: string
  autoConnect?: boolean
  reconnectionAttempts?: number
  reconnectionDelay?: number
}

type EventCallback = (...args: unknown[]) => void

class SecureSocketClient {
  private socket: Socket | null = null
  private state: SocketConnectionState = 'idle'
  private reconnectAttempts = 0
  private readonly maxReconnectAttempts: number
  private listeners = new Map<string, Set<EventCallback>>()
  private stateListeners = new Set<(state: SocketConnectionState) => void>()

  constructor(private readonly config: SocketConfig = {}) {
    this.maxReconnectAttempts = config.reconnectionAttempts ?? 5
  }

  connect(): void {
    const session = useAuthStore.getState().session
    if (!session) {
      console.warn('[Socket] Attempted to connect without authentication.')
      return
    }

    if (this.socket?.connected) return

    const token = session.tokens.accessToken
    if (!token) {
      console.warn('[Socket] No access token available for socket connection.')
      return
    }

    this.setState('connecting')

    const namespace = this.config.namespace ?? '/'
    const url = `${SOCKET_URL}${namespace}`

    this.socket = io(url, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.config.reconnectionDelay ?? 2000,
      timeout: 10_000,
      withCredentials: true,
      autoConnect: true,
    })

    this.attachCoreListeners()
  }

  private attachCoreListeners(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0
      this.setState('connected')
    })

    this.socket.on('disconnect', (reason) => {
      this.setState('disconnected')
      if (reason === 'io server disconnect') {
        this.socket?.removeAllListeners()
        this.socket = null
      }
    })

    this.socket.on('connect_error', (err) => {
      this.reconnectAttempts++
      if (err.message === 'unauthorized') {
        this.disconnect()
        useAuthStore.getState().logout()
        return
      }
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.setState('error')
        this.disconnect()
      }
    })

    this.socket.on('auth:expired', () => {
      const { refreshSession } = useAuthStore.getState()
      refreshSession().then(() => {
        const newToken = useAuthStore.getState().session?.tokens.accessToken
        if (newToken && this.socket) {
          this.socket.auth = { token: newToken }
          this.socket.connect()
        } else {
          this.disconnect()
          useAuthStore.getState().logout()
        }
      })
    })

    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((cb) => this.socket?.on(event, cb))
    })
  }

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(callback)
    if (this.socket) this.socket.on(event, callback)
    return () => this.off(event, callback)
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback)
    this.socket?.off(event, callback)
  }

  emit(event: string, ...args: unknown[]): boolean {
    if (!this.socket?.connected) {
      console.warn(`[Socket] Cannot emit "${event}" — not connected.`)
      return false
    }
    this.socket.emit(event, ...args)
    return true
  }

  disconnect(): void {
    this.socket?.removeAllListeners()
    this.socket?.disconnect()
    this.socket = null
    this.setState('disconnected')
  }

  getState(): SocketConnectionState {
    return this.state
  }

  isConnected(): boolean {
    return this.state === 'connected' && !!this.socket?.connected
  }

  onStateChange(cb: (state: SocketConnectionState) => void): () => void {
    this.stateListeners.add(cb)
    return () => this.stateListeners.delete(cb)
  }

  private setState(state: SocketConnectionState): void {
    this.state = state
    this.stateListeners.forEach((cb) => cb(state))
  }
}

export const botSocket = new SecureSocketClient({ namespace: '/bots' })
export const sessionSocket = new SecureSocketClient({ namespace: '/sessions' })
