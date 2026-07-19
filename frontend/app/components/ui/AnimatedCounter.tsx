// app/components/ui/AnimatedCounter.tsx

import { useAnimatedCounter } from "~/hooks/useAnimatedCounter";

interface AnimatedCounterProps {
  target: number;
  duration?: number;
  delay?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  format?: (value: number) => string;
}

export function AnimatedCounter({
  target,
  duration = 2000,
  delay = 0,
  suffix = "",
  prefix = "",
  className = "",
  format,
}: AnimatedCounterProps) {
  const { ref, count, isVisible } = useAnimatedCounter(target, duration, delay);

  const displayValue = format ? format(count) : count;

  return (
    <span ref={ref} className={className}>
      {isVisible ? `${prefix}${displayValue}${suffix}` : "0"}
    </span>
  );
}