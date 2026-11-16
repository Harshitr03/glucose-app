export default function RangeFlag({ status }) {
  if (status === 'high') return <span className="flag flag-high">High</span>;
  if (status === 'low') return <span className="flag flag-low">Low</span>;
  return null;
}
