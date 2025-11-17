import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Declare Pusher on window for Laravel Echo
declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo;
  }
}

window.Pusher = Pusher;

let echoInstance: Echo | null = null;

export const initializeEcho = (token: string): Echo => {
  if (echoInstance) {
    return echoInstance;
  }

  const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;
  if (!pusherKey) {
    throw new Error('Pusher APP_KEY not configured. Please set VITE_PUSHER_APP_KEY in your .env file.');
  }

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  const baseUrl = apiUrl.replace('/api/v1', '');

  echoInstance = new Echo({
    broadcaster: 'pusher',
    key: pusherKey,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
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

  window.Echo = echoInstance;
  return echoInstance;
};

export const disconnectEcho = (): void => {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
    delete window.Echo;
  }
};

export const getEcho = (): Echo | null => {
  return echoInstance;
};

