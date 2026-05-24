import { useEffect, useRef } from 'react';
import { useUIStore } from '../stores/uiStore';

export const useTVMode = () => {
  const {
    tvMode,
    tvRotationInterval,
    tvRotationPaused,
    nextTvPanel,
    currentTvPanel,
    setCurrentTvPanel,
    tvPanelsCount
  } = useUIStore();

  const rotationTimerRef = useRef<NodeJS.Timeout | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wakeLockRef = useRef<any>(null);

  // 1. Rotation Management
  useEffect(() => {
    if (rotationTimerRef.current) {
      clearInterval(rotationTimerRef.current);
    }

    if (tvMode && !tvRotationPaused) {
      rotationTimerRef.current = setInterval(() => {
        nextTvPanel();
      }, tvRotationInterval * 1000);
    }

    return () => {
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current);
      }
    };
  }, [tvMode, tvRotationInterval, tvRotationPaused, nextTvPanel]);

  // 2. Wake Lock API (Prevent screen from turning off)
  useEffect(() => {
    const acquireWakeLock = async () => {
      if (tvMode && 'wakeLock' in navigator) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          console.log('[TV Mode] Screen Wake Lock acquired.');
        } catch (err) {
          console.warn('[TV Mode] Failed to acquire screen wake lock:', err);
        }
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
          console.log('[TV Mode] Screen Wake Lock released.');
        } catch (err) {
          console.error('[TV Mode] Wake lock release error:', err);
        }
      }
    };

    if (tvMode) {
      acquireWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => {
      releaseWakeLock();
    };
  }, [tvMode]);

  // 3. Fullscreen toggle helper
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('[TV Mode] Error toggling fullscreen:', err);
    }
  };

  return {
    tvMode,
    currentTvPanel,
    setCurrentTvPanel,
    tvPanelsCount,
    tvRotationPaused,
    tvRotationInterval,
    toggleFullscreen
  };
};
