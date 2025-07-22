'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
}

// iOS-style navigation transitions
const slideVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0.8,
  }),
  animate: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0.8,
  }),
};

const pageTransition = {
  type: 'tween' as const,
  ease: [0.4, 0, 0.2, 1] as const, // iOS cubic-bezier
  duration: 0.35, // iOS standard duration
};

// Define navigation hierarchy for determining slide direction
const routeHierarchy: Record<string, number> = {
  '/': 0,
  '/log': 1,
  '/meals': 1,
  '/friends': 1,
  '/friends-list': 2,
  '/notes': 2,
  '/summaries': 2,
  '/done': 2,
  '/auth/callback': 1,
};

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [direction, setDirection] = useState(0);
  const [previousPath, setPreviousPath] = useState('/');

  useEffect(() => {
    const currentLevel = routeHierarchy[pathname] ?? 1;
    const previousLevel = routeHierarchy[previousPath] ?? 0;

    // Determine slide direction based on hierarchy
    setDirection(currentLevel > previousLevel ? 1 : -1);
    setPreviousPath(pathname);
  }, [pathname, previousPath]);

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={pathname}
        custom={direction}
        variants={slideVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
