import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'flappy-bird-high-score';

export const useHighScore = () => {
  const [highScore, setHighScore] = useState<number>(0);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setHighScore(parseInt(stored, 10));
    }
  }, []);

  const updateHighScore = useCallback((score: number): boolean => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem(STORAGE_KEY, score.toString());
      return true;
    }
    return false;
  }, [highScore]);

  return { highScore, updateHighScore };
};
