// Roteador minimalista baseado em hash: #/dashboard?tipo=receita

import { useCallback, useEffect, useState } from 'react';

function parseHash() {
  const raw = window.location.hash.replace(/^#/, '') || '/dashboard';
  const [path, search = ''] = raw.split('?');
  const query = Object.fromEntries(new URLSearchParams(search));
  return { path: path || '/dashboard', query };
}

export function useHashRoute() {
  const [route, setRoute] = useState(parseHash);

  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((to, { replace = false } = {}) => {
    const target = to.startsWith('#') ? to : `#${to}`;
    if (replace) {
      window.history.replaceState(null, '', target);
      setRoute(parseHash());
    } else if (window.location.hash !== target) {
      window.location.hash = target;
    }
  }, []);

  return { ...route, navigate };
}
