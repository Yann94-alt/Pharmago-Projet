import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

window.Pusher = Pusher

const echo = new Echo({
  broadcaster: 'reverb',

  key: 'c6fckb1wtfo50t1fd60u',

  wsHost: 'localhost',
  wsPort: 8080,

  wssPort: 8080,

  forceTLS: false,

  enabledTransports: ['ws', 'wss'],

  authEndpoint: 'http://127.0.0.1:8000/api/broadcasting/auth',

  auth: {
    headers: {
      Authorization: `Bearer ${localStorage.getItem(
        'pharmago_token'
      )}`,

      Accept: 'application/json',
    },
  },
})

/*
|--------------------------------------------------------------------------
| DIAGNOSTIC WEBSOCKET
|--------------------------------------------------------------------------
*/

const pusher = echo.connector.pusher
pusher.connection.bind('message', (message) => {
  console.log('📨 MESSAGE WEBSOCKET REÇU :', message)
})

pusher.connection.bind(
  'connecting',
  () => {
    console.log(
      '🟡 WebSocket : CONNEXION...'
    )
  }
)

pusher.connection.bind(
  'connected',
  () => {
    console.log(
      '🟢 WebSocket : CONNECTÉ'
    )

    console.log(
      '🔑 Socket ID :',
      pusher.connection.socket_id
    )
  }
)

pusher.connection.bind(
  'disconnected',
  () => {
    console.log(
      '🔴 WebSocket : DÉCONNECTÉ'
    )
  }
)

pusher.connection.bind(
  'error',
  (error) => {
    console.error(
      '❌ WebSocket ERROR :',
      error
    )
  }
)

export default echo
