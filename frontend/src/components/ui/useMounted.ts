'use client';

import { useEffect, useState } from 'react';

/** True desde el primer efecto: recién ahí existe `document` para un portal. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
