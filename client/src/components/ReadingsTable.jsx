import { formatDate, slotLabel } from '../constants';

export default function ReadingsTable({ readings, onEdit, onDelete, emptyText }) {
  if (readings.length === 0) return <p className="empty">{emptyText}</p>;
  const editable = Boolean(onEdit || onDelete);

  return (
    <table className="readings-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Slot</th>
          <th className="num">mg/dl</th>
          {editable && <th aria-label="Actions" />}
        </tr>
      </thead>
      <tbody>
        {readings.map((reading) => (
          <tr key={reading.id}>
            <td>{formatDate(reading.date)}</td>
            <td>{slotLabel(reading.slot)}</td>
            <td className="num">{reading.value}</td>
            {editable && (
              <td className="row-actions">
                <button type="button" className="link-button" onClick={() => onEdit(reading)}>
                  Edit
                </button>
                <button type="button" className="link-button danger" onClick={() => onDelete(reading)}>
                  Delete
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
