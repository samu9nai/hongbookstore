// stompjs 2.3.3에는 타입 정의가 없다. ChatRoom이 쓰는 API만 선언한다.
// 시그니처는 node_modules/stompjs/lib/stomp.js의 Client에 맞춘다. stompjs 교체는 FE-05에서 한다

declare module 'stompjs' {
  export interface Message {
    body: string
  }

  export interface Subscription {
    id: string
    unsubscribe: () => void
  }

  export interface Client {
    connected: boolean
    debug: ((message: string) => void) | null
    connect: (
      headers: Record<string, string>,
      connectCallback: () => void,
      errorCallback?: (error: unknown) => void
    ) => void
    subscribe: (
      destination: string,
      callback: (message: Message) => void,
      headers?: Record<string, string>
    ) => Subscription
    send: (
      destination: string,
      headers?: Record<string, string>,
      body?: string
    ) => void
    disconnect: (
      disconnectCallback?: () => void,
      headers?: Record<string, string>
    ) => void
  }

  const Stomp: {
    over: (ws: WebSocket) => Client
  }

  export default Stomp
}
