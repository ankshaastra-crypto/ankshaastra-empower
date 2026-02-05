import { useRef } from 'react';

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useScrollAnimation = (_options: UseScrollAnimationOptions = {}) => {
  const ref = useRef<HTMLDivElement>(null);
  // Content is always visible for instant loading
  const isVisible = true;

  return { ref, isVisible };
};

export default useScrollAnimation;
