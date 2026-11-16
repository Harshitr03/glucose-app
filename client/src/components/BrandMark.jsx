import { SLOTS } from '../constants';

export default function BrandMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="4" strokeLinecap="round" aria-hidden="true">
      {SLOTS.map((slot, index) => (
        <circle
          key={slot.key}
          cx="12"
          cy="12"
          r="8.5"
          stroke={slot.color}
          strokeDasharray="10 43.4"
          transform={`rotate(${-80 + index * 90} 12 12)`}
        />
      ))}
    </svg>
  );
}
