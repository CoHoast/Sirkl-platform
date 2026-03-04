import { ApplicationStatus } from '@/lib/mock-data';

const statusConfig = {
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800',
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-100 text-green-800',
  },
  denied: {
    label: 'Denied',
    className: 'bg-red-100 text-red-800',
  },
  review: {
    label: 'Needs Review',
    className: 'bg-blue-100 text-blue-800',
  },
};

export default function StatusBadge({ status }: { status: ApplicationStatus }) {
  const config = statusConfig[status];
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
