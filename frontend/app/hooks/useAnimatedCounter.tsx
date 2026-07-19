// app/hooks/useAnimatedCounter.ts

import { useState, useEffect, useRef } from "react";

export function useAnimatedCounter(
  target: number,
  duration: number = 2000,
  delay: number = 0
) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimatedRef.current) {
          setIsVisible(true);
          hasAnimatedRef.current = true;
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const startAnimation = () => {
      startTimeRef.current = null;
      const animate = (timestamp: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp;
        }

        const progress = Math.min(
          (timestamp - startTimeRef.current) / duration,
          1
        );

        // Easing function (ease-out cubic)
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(eased * target);

        setCount(currentValue);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          setCount(target);
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const timeoutId = setTimeout(startAnimation, delay);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVisible, target, duration, delay]);

  return { ref, count, isVisible };
}