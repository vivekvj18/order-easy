import { ORDER_STATUSES } from '../utils/constants';

const colorMap = {
  blue:   'badge-blue',
  yellow: 'badge-yellow',
  orange: 'badge-orange',
  green:  'badge-green',
  red:    'badge-red',
  gray:   'badge-gray',
};

const StatusBadge = ({ status }) => {
  const found = ORDER_STATUSES.find((s) => s.value === status);
  const label = found?.label || status || '—';
  const color = found?.color || 'gray';

  return <span className={colorMap[color] || 'badge-gray'}>{label}</span>;
};

export const AvailabilityBadge = ({ status }) => {
  if (status === 'AVAILABLE') {
    return (
      <span className="badge bg-green-100 text-green-700 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        Available
      </span>
    );
  }
  return (
    <span className="badge bg-orange-100 text-orange-700 flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
      Busy
    </span>
  );
};

export default StatusBadge;
