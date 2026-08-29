import { useEffect, useRef, useState } from 'react';

interface ProgressBarProps {
  value: number; // 0–100
  color?: 'emerald' | 'azure' | 'amber' | 'accent';
  height?: number;
  animated?: boolean;
  showLabel?: boolean;
}

const colorMap = {
  emerald: '#10B981',
  azure: '#38BDF8',
  amber: '#F59E0B',
  accent: '#C4A96B',
};

export default function ProgressBar({
  value,
  color = 'emerald',
  height = 4,
  animated = true,
  showLabel = false,
}: ProgressBarProps) {
  const [width, setWidth] = useState(animated ? 0 : value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animated) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          requestAnimationFrame(() => setWidth(value));
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [value, animated]);

  const fill = colorMap[color];
  const clamped = Math.min(100, Math.max(0, width));

  return (
    <div ref={ref} className="w-full">
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height, background: 'rgba(51,65,85,0.5)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${clamped}%`,
            background: fill,
            transition: animated ? 'width 1.2s cubic-bezier(0.22, 1, 0.36, 1)' : undefined,
            boxShadow: `0 0 8px ${fill}50`,
          }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-right">
          <span className="font-financial text-xs text-muted-foreground">{Math.round(value)}%</span>
        </div>
      )}
    </div>
  );
}
