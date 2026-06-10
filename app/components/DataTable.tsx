'use client';

import { CustomerRecord } from '@/app/types';
import { CheckCircle, XCircle, AlertCircle, HelpCircle } from 'lucide-react';

interface DataTableProps {
  records: CustomerRecord[];
  onSelectRow: (id: string) => void;
  selectedRows: Set<string>;
  onBulkAction: (action: string, ids: string[]) => void;
}

const statusIcon = (status: string) => {
  switch(status) {
    case 'verified': return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'invalid': return <XCircle className="w-4 h-4 text-red-600" />;
    case 'needs_review': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    default: return <HelpCircle className="w-4 h-4 text-gray-400" />;
  }
};

export default function DataTable({ records, onSelectRow, selectedRows, onBulkAction }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200">
          <tr className="text-left text-gray-500">
            <th className="pb-3 w-8">
              <input type="checkbox" className="rounded" />
            </th>
            <th className="pb-3">Customer</th>
            <th className="pb-3">Phone</th>
            <th className="pb-3">Status</th>
            <th className="pb-3">Risk</th>
            <th className="pb-3">Quality Flags</th>
          </tr>
        </thead>
        <tbody>
          {records.map(record => (
            <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3">
                <input
                  type="checkbox"
                  checked={selectedRows.has(record.id)}
                  onChange={() => onSelectRow(record.id)}
                  className="rounded"
                />
              </td>
              <td className="py-3 font-medium">{record.name}</td>
              <td className="py-3 text-gray-600">{record.phone}</td>
              <td className="py-3 flex items-center gap-1">
                {statusIcon(record.status)}
                <span className="capitalize">{record.status.replace('_', ' ')}</span>
              </td>
              <td className="py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  record.riskLevel === 'trusted' ? 'bg-green-100 text-green-800' :
                  record.riskLevel === 'review' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {record.riskScore}
                </span>
              </td>
              <td className="py-3 text-xs text-gray-500">
                {record.qualityFlags.slice(0, 2).join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}