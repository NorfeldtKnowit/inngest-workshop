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
  const startTimeRef = useRef(startedAt.getTime());
  const completeTimeRef = useRef(completesAt.getTime());
  
  const [state, setState] = useState<PreparationCountdownState>({
    remainingSeconds: 0,
    percentage: 0,
    isReady: false,
  });

  useEffect(() => {
    // Update refs if times change
    startTimeRef.current = startedAt.getTime();
    completeTimeRef.current = completesAt.getTime();

    const calculateState = (): void => {
      const now = Date.now();
      const totalTime = completeTimeRef.current - startTimeRef.current;
      const remainingMs = Math.max(0, completeTimeRef.current - now);
      const remainingSeconds = Math.ceil(remainingMs / 1000);

      // Show remaining time percentage (empties down as cooking progresses)
      const percentage = totalTime > 0
        ? Math.max(0, (remainingMs / totalTime) * 100)
        : 0;

      const isReady = remainingMs === 0 || status === 'ready';

      setState({
        remainingSeconds,
        percentage,
        isReady,
      });
    };

    // Set initial state
    calculateState();

    // Update every 500ms for smooth progress
    const interval = setInterval(calculateState, 500);

    return () => clearInterval(interval);
  }, [startedAt, completesAt, status]);

  return state;
};