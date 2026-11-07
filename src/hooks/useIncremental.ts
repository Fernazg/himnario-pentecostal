import { useEffect, useRef, useState } from 'react';

/** Renderiza listas largas por tramos a medida que se hace scroll. */
export function useIncremental(total: number, step = 80, resetKey?: unknown) {
  const [count, setCount] = useState(step);
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => setCount(step), [resetKey, step]);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || count >= total) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && setCount((c) => c + step), { rootMargin: '800px' });
    io.observe(el);
    return () => io.disconnect();
  }, [count, total, step]);
  return { count, sentinel };
}
