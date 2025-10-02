import { useEffect, useRef, useState } from 'react';

type CountdownState = {
  remainingSeconds: number;
  percentage: number;
  isExpired: boolean;
  isExpiring: boolean;
};

export const useFoodWarmerCountdown = (expiresAt: Date, shelfLife: number): CountdownState => {
  const expirationTimeRef = useRef(expiresAt.getTime());
  const [state, setState] = useState<CountdownState>({
    remainingSeconds: 0,
    percentage: 0,
    isExpired: false,
    isExpiring: false,
  });

  useEffect(() => {
    // Update ref if expiresAt changes
    expirationTimeRef.current = expiresAt.getTime();

    const calculateState = (): void => {
      const now = Date.now();
      const remainingMs = expirationTimeRef.current - now;
      const remainingSeconds = Math.floor(remainingMs / 1000);
      const isExpired = remainingMs < 0;
      const isExpiring = remainingMs < 3000 && remainingMs >= 0;
      const percentage = isExpired ? 0 : Math.max(0, (remainingMs / shelfLife) * 100);

      setState({
        remainingSeconds,
        percentage,
        isExpired,
        isExpiring,
      });
    };

    // Set initial state
    calculateState();

    // Update every 500ms for smooth progress
    const interval = setInterval(calculateState, 500);

    return () => clearInterval(interval);
  }, [expiresAt, shelfLife]);

  return state;
};