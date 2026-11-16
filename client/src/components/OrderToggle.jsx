import Segmented from './Segmented';

const OPTIONS = [
  { value: 'oldest', label: 'Oldest first' },
  { value: 'newest', label: 'Newest first' },
];

export default function OrderToggle({ order, onChange }) {
  return <Segmented label="Sort order" options={OPTIONS} value={order} onChange={onChange} />;
}
