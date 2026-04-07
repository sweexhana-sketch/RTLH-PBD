import { useEffect } from 'react';

export function useDevServerHeartbeat() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!import.meta.env.DEV) return;

    let lastAction = Date.now();
    const handleAction = () => { lastAction = Date.now(); };
    window.addEventListener('mousemove', handleAction, { passive: true });
    window.addEventListener('keydown', handleAction, { passive: true });
    window.addEventListener('scroll', handleAction, { passive: true });

    const interval = setInterval(() => {
      // Only keep the server alive if the user has been active recently
      if (Date.now() - lastAction < 60_000 * 3) {
        fetch('/', { method: 'GET' }).catch(() => {});
      }
    }, 60_000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleAction);
      window.removeEventListener('keydown', handleAction);
      window.removeEventListener('scroll', handleAction);
    };
  }, []);
}
