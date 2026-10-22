import { useCallback, useEffect, useRef, useState } from 'react';
import { ObsAudioSession, ObsAudioSnapshot } from './obsAudio';

const RECONNECT_MS = 2000;

const offline: ObsAudioSnapshot = { phase: 'offline', inputs: [] };

/** Тримає сокет до OBS і перепідключається, якщо студія закрила з’єднання. */
export function useObsAudio(url: string, password: string, enabled: boolean) {
  const [snapshot, setSnapshot] = useState<ObsAudioSnapshot>(offline);
  const sessionRef = useRef<ObsAudioSession | null>(null);

  useEffect(() => {
    if (!enabled) {
      setSnapshot(offline);
      return undefined;
    }

    let stopped = false;
    let socket: WebSocket | null = null;
    let retry = 0;

    const connect = () => {
      if (stopped) return;
      setSnapshot({ phase: 'connecting', inputs: [] });
      const current = new WebSocket(url);
      socket = current;
      const session = new ObsAudioSession(password, (payload) => {
        if (current.readyState === WebSocket.OPEN) current.send(JSON.stringify(payload));
      }, setSnapshot);
      sessionRef.current = session;

      current.onmessage = (event) => {
        void session.handleMessage(String(event.data));
      };
      current.onclose = () => {
        if (sessionRef.current === session) sessionRef.current = null;
        if (stopped) return;
        setSnapshot((prev) => ({ phase: 'offline', inputs: prev.inputs }));
        retry = window.setTimeout(connect, RECONNECT_MS);
      };
    };

    connect();
    return () => {
      stopped = true;
      window.clearTimeout(retry);
      sessionRef.current = null;
      socket?.close();
    };
  }, [enabled, password, url]);

  const toggle = useCallback(() => sessionRef.current?.toggle(), []);

  return { snapshot, toggle };
}
