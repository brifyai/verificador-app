
'use client';

import { useState, useEffect } from 'react';

export default function CurrentTime() {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString('es-CL'));
    };

    // Establecer tiempo inicial
    updateTime();

    // Actualizar cada minuto
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  return <>{currentTime}</>;
}
