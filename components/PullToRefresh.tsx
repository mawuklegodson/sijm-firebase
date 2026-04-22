import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const THRESHOLD = 80;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only start pulling if scrolled to top
    if (window.scrollY === 0 && !isRefreshing) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPullingRef.current) return;

    const diff = e.touches[0].clientY - startYRef.current;

    if (diff > 0) {
      if (e.cancelable) e.preventDefault();
      // Apply resistance — diminishing returns
      const distance = Math.min(diff * 0.4, 120);
      setPullDistance(distance);
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;

    if (pullDistance > THRESHOLD) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const showIndicator = pullDistance > 10 || isRefreshing;
  const indicatorY = isRefreshing ? 50 : Math.min(pullDistance, 60);

  return (
    <div ref={containerRef} className="relative min-h-full">
      {/* Pull indicator */}
      {showIndicator && (
        <div
          className="fixed top-0 left-0 w-full flex justify-center z-50 pointer-events-none"
          style={{ paddingTop: `${indicatorY}px`, transition: isRefreshing ? 'none' : 'padding-top 0.1s ease-out' }}
        >
          <div
            className="bg-white rounded-full shadow-lg flex items-center justify-center"
            style={{
              width: '40px',
              height: '40px',
              opacity: showIndicator ? 1 : 0,
              transform: `rotate(${isRefreshing ? 0 : pullDistance * 3}deg)`,
              transition: 'opacity 0.2s',
            }}
          >
            <Loader2
              size={20}
              className={`text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </div>
        </div>
      )}

      {/* Content wrapper — shifts down during pull */}
      <motion.div
        style={{ y: isRefreshing ? 50 : pullDistance > 0 ? pullDistance : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
