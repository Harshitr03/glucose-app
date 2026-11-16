export function markerPath(shape, cx, cy, size) {
  const r = size / 2;
  switch (shape) {
    case 'square':
      return `M${cx - r * 0.85},${cy - r * 0.85}h${r * 1.7}v${r * 1.7}h${-r * 1.7}Z`;
    case 'triangle':
      return `M${cx},${cy - r * 1.05}L${cx + r},${cy + r * 0.8}L${cx - r},${cy + r * 0.8}Z`;
    case 'diamond':
      return `M${cx},${cy - r * 1.1}L${cx + r * 1.1},${cy}L${cx},${cy + r * 1.1}L${cx - r * 1.1},${cy}Z`;
    default:
      return `M${cx - r},${cy}a${r},${r} 0 1,0 ${r * 2},0a${r},${r} 0 1,0 ${-r * 2},0`;
  }
}

export default function SlotMarker({ shape, color, size = 12 }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <path d={markerPath(shape, size / 2, size / 2, size - 2)} fill={color} />
    </svg>
  );
}
