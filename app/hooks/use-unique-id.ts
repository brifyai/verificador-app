
'use client';

import { useCallback, useRef } from 'react';

export function useUniqueId(prefix: string = 'id') {
  const counterRef = useRef(0);

  const generateId = useCallback(() => {
    counterRef.current += 1;
    return `${prefix}_${counterRef.current}_${Date.now()}`;
  }, [prefix]);

  return generateId;
}
