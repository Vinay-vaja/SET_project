import React, { useEffect, useState, useRef } from 'react';

/**
 * AnimatedNumber
 * Smooth, lightweight animated number counter component.
 * Fully compatible with React 19 and modern Vite setups without CJS/ESM interop issues.
 */
export default function AnimatedNumber({
  end = 0,
  duration = 1.0,
  decimals = 0,
  prefix = '',
  suffix = '',
  preserveValue = true,
  separator = ',',
}) {
  const numericEnd = typeof end === 'number' && !isNaN(end) ? end : parseFloat(end) || 0;
  const [displayValue, setDisplayValue] = useState(() => (preserveValue ? numericEnd : 0));
  const currentValRef = useRef(preserveValue ? numericEnd : 0);
  const frameRef = useRef(null);

  useEffect(() => {
    const startVal = currentValRef.current;
    const targetVal = numericEnd;

    if (Math.abs(startVal - targetVal) < 0.0001) {
      setDisplayValue(targetVal);
      currentValRef.current = targetVal;
      return;
    }

    const durationMs = Math.max(duration * 1000, 300);
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      // easeOutCubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (targetVal - startVal) * easeProgress;

      currentValRef.current = current;
      setDisplayValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        currentValRef.current = targetVal;
        setDisplayValue(targetVal);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [numericEnd, duration]);

  const formattedNumber = displayValue.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span>
      {prefix}
      {formattedNumber}
      {suffix}
    </span>
  );
}
