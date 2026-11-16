const OPTIONS = [
  { value: 'oldest', label: 'Oldest first' },
  { value: 'newest', label: 'Newest first' },
];

export default function OrderToggle({ order, onChange }) {
  return (
    <div className="order-toggle" role="group" aria-label="Sort order">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={order === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
