import { useEffect, useRef, useState } from 'react';

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useScrollAnimation = (options: UseScrollAnimationOptions = {}) => {
  const { threshold = 0.1, rootMargin = '50px 0px', triggerOnce = true } = options;
  const ref = useRef<HTMLDivElement>(null);
  // Always visible - no delayed loading animations
  const [isVisible, setIsVisible] = useState(true);

  // Content is always visible for instant loading - no intersection observer needed

  return { ref, isVisible };
};

export default useScrollAnimation;
