import { useEffect, useRef, useState } from 'react';

type PreparationCountdownState = {
  remainingSeconds: number;
  percentage: number;
  isReady: boolean;
};

export const usePreparationCountdown = (
  startedAt: Date,
  completesAt: Date,
  status: 'preparing' | 'ready'
): PreparationCountdownState => {
  const startTimeRef = useRef(new Date(startedAt).getTime());
  const completeTimeRef = useRef(new Date(completesAt).getTime());
  
  const [state, setState] = useState<PreparationCountdownState>({
    remainingSeconds: 0,
    percentage: 0,
    isReady: false,
  });

  useEffect(() => {
    // Update refs if times change
    startTimeRef.current = new Date(startedAt).getTime();
    completeTimeRef.current = new Date(completesAt).getTime();

    const calculateState = (): void => {
      const now = Date.now();
      const totalTime = completeTimeRef.current - startTimeRef.current;
      const elapsed = now - startTimeRef.current;
      const remainingMs = Math.max(0, completeTimeRef.current - now);
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      const percentage = Math.min(100, (elapsed / totalTime) * 100);
      const isReady = remainingMs === 0 || status === 'ready';

      setState({
        remainingSeconds,
        percentage,
        isReady,
      });
    };

    // Set initial state
    calculateState();

    // Update every 100ms for smoother progress bar
    const interval = setInterval(calculateState, 100);

    return () => clearInterval(interval);
  }, [startedAt, completesAt, status]);

  return state;
};