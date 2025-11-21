import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Declare Pusher on window for Laravel Echo
declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<any>;
  }
}

window.Pusher = Pusher;

let echoInstance: Echo<any> | null = null;

export const initializeEcho = (token: string): Echo<any> => {
  if (echoInstance) {
    return echoInstance;
  }

  const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;
  if (!pusherKey) {
    throw new Error('Pusher APP_KEY not configured. Please set VITE_PUSHER_APP_KEY in your .env file.');
  }

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  const baseUrl = apiUrl.replace('/api/v1', '');

  const cluster = import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1';

  echoInstance = new Echo({
    broadcaster: 'pusher',
    key: pusherKey,
    cluster: cluster,
    forceTLS: true,
    encrypted: true,
    authEndpoint: `${baseUrl}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });

  // Bind error handler for connection issues
  if (echoInstance.connector && echoInstance.connector.pusher) {
    const pusher = echoInstance.connector.pusher;
    pusher.connection.bind('error', (err: any) => {
      console.error('❌ Pusher connection error:', err);
    });
  }

  window.Echo = echoInstance;
  return echoInstance;
};

export const disconnectEcho = (): void => {
  if (echoInstance) {
    try {
      // Unbind all event listeners before disconnecting to prevent multiple disconnect warnings
      if (echoInstance.connector && echoInstance.connector.pusher) {
        const pusher = echoInstance.connector.pusher;
        // Unbind all connection events to prevent multiple disconnect warnings
        pusher.connection.unbind();
        // Disconnect gracefully
        if (pusher.connection.state !== 'disconnected') {
          pusher.disconnect();
        }
      }
      // Disconnect Echo
      echoInstance.disconnect();
    } catch (error) {
      // Ignore errors during disconnect (connection might already be closed)
      // Don't log in production to avoid console noise
      if (import.meta.env.DEV) {
        console.debug('Error during Echo disconnect:', error);
      }
    } finally {
      echoInstance = null;
      if (window.Echo) {
        delete window.Echo;
      }
    }
  }
};

export const getEcho = (): Echo<any> | null => {
  return echoInstance;
};

