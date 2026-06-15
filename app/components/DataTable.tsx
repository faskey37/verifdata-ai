'use client';

import { CustomerRecord } from '@/app/types';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  HelpCircle,
  PhoneOff,
  MapPinOff,
  Copy,
  UserX,
  MailX,
  ShieldAlert
} from 'lucide-react';

interface DataTableProps {
  records: CustomerRecord[];
  onSelectRow: (id: string) => void;
  selectedRows: Set<string>;
  onBulkAction: (action: string, ids: string[]) => void;
}

const statusIcon = (status: string) => {
  switch (status) {
    case 'verified':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'invalid':
      return <XCircle className="w-4 h-4 text-red-600" />;
    case 'needs_review':
      return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    default:
      return <HelpCircle className="w-4 h-4 text-gray-400" />;
  }
};

// Function to get risk explanation based on record data
const getRiskIssues = (record: CustomerRecord): { icon: JSX.Element; text: string; color: string }[] => {
  const issues = [];

  // Phone issues
  if (record.status === 'invalid' || (record.phone && !record.phone.match(/^[0-9]{10}$/))) {
    issues.push({
      icon: <PhoneOff className="w-3.5 h-3.5" />,
      text: 'Invalid phone number',
      color: 'text-red-700 bg-red-50'
    });
  }

  // Address issues
  if (!record.address || record.address.length < 5) {
    issues.push({
      icon: <MapPinOff className="w-3.5 h-3.5" />,
      text: 'Missing/incomplete address',
      color: 'text-orange-700 bg-orange-50'
    });
  } else if (record.address.length < 15) {
    issues.push({
      icon: <MapPinOff className="w-3.5 h-3.5" />,
      text: 'Short address',
      color: 'text-yellow-700 bg-yellow-50'
    });
  }

  // Duplicate issues
  if (record.isDuplicate) {
    issues.push({
      icon: <Copy className="w-3.5 h-3.5" />,
      text: 'Duplicate phone number',
      color: 'text-purple-700 bg-purple-50'
    });
  }

  // Name issues
  if (!record.name || record.name.length < 2) {
    issues.push({
      icon: <UserX className="w-3.5 h-3.5" />,
      text: 'Missing name',
      color: 'text-red-700 bg-red-50'
    });
  } else if (record.name.length < 3) {
    issues.push({
      icon: <UserX className="w-3.5 h-3.5" />,
      text: 'Suspicious short name',
      color: 'text-orange-700 bg-orange-50'
    });
  } else if (/[0-9]/.test(record.name)) {
    issues.push({
      icon: <UserX className="w-3.5 h-3.5" />,
      text: 'Name contains numbers',
      color: 'text-yellow-700 bg-yellow-50'
    });
  }

  // Email issues
  if (record.email && (!record.email.includes('@') || !record.email.includes('.'))) {
    issues.push({
      icon: <MailX className="w-3.5 h-3.5" />,
      text: 'Invalid email format',
      color: 'text-orange-700 bg-orange-50'
    });
  }

  // Quality flags from validation
  if (record.qualityFlags) {
    record.qualityFlags.forEach(flag => {
      if (flag.includes('name')) {
        issues.push({
          icon: <UserX className="w-3.5 h-3.5" />,
          text: flag,
          color: 'text-orange-700 bg-orange-50'
        });
      } else if (flag.includes('address')) {
        issues.push({
          icon: <MapPinOff className="w-3.5 h-3.5" />,
          text: flag,
          color: 'text-yellow-700 bg-yellow-50'
        });
      } else if (flag.includes('email')) {
        issues.push({
          icon: <MailX className="w-3.5 h-3.5" />,
          text: flag,
          color: 'text-orange-700 bg-orange-50'
        });
      }
    });
  }

  // If no issues, return trusted status
  if (issues.length === 0) {
    issues.push({
      icon: <ShieldAlert className="w-3.5 h-3.5" />,
      text: 'No issues detected',
      color: 'text-green-700 bg-green-50'
    });
  }

  return issues;
};

// Get risk level badge style
const getRiskBadgeStyle = (riskLevel: string, score: number) => {
  if (riskLevel === 'trusted') {
    return {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200',
      label: 'Trusted'
    };
  } else if (riskLevel === 'review') {
    return {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200',
      label: score >= 75 ? 'Needs Review' : 'Low Confidence'
    };
  } else {
    return {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
      label: 'High Risk'
    };
  }
};

export default function DataTable({
  records,
  onSelectRow,
  selectedRows,
  onBulkAction
}: DataTableProps) {
  // Handle select all functionality
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      records.forEach(record => {
        if (!selectedRows.has(record.id)) {
          onSelectRow(record.id);
        }
      });
    } else {
      records.forEach(record => {
        if (selectedRows.has(record.id)) {
          onSelectRow(record.id);
        }
      });
    }
  };

  const isAllSelected = records.length > 0 && records.every(record => selectedRows.has(record.id));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr className="text-left text-gray-600">
            <th className="pb-3 pt-3 pl-4 w-8">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={isAllSelected}
                onChange={handleSelectAll}
              />
            </th>
            <th className="pb-3 pt-3">Customer</th>
            <th className="pb-3 pt-3">Phone</th>
            <th className="pb-3 pt-3">Email</th>
            <th className="pb-3 pt-3">Address</th>
            <th className="pb-3 pt-3">Status</th>
            <th className="pb-3 pt-3">Risk Score</th>
            <th className="pb-3 pt-3 pr-4">Issues & Flags</th>
            <th className="pb-3 pt-3 pr-4">Action</th>
           </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const issues = getRiskIssues(record);
            const riskBadge = getRiskBadgeStyle(record.riskLevel, record.riskScore);
            
            return (
              <tr
                key={record.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-3 pl-4">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(record.id)}
                    onChange={() => onSelectRow(record.id)}
                    className="rounded border-gray-300"
                  />
                 </td>
                <td className="py-3">
                  <div>
                    <div className="font-medium text-gray-900">
                      {record.name || 'Unknown'}
                    </div>
                    {record.country && record.country !== 'Unknown' && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        {record.country}
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3">
                  <div className="text-gray-700 font-mono text-xs">
                    {record.phone}
                  </div>
                </td>
                <td className="py-3">
                  <div className="text-gray-600 text-xs truncate max-w-[150px]">
                    {record.email || '—'}
                  </div>
                </td>
                <td className="py-3">
                  <div className="text-gray-600 text-xs truncate max-w-[150px]">
                    {record.address || '—'}
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    {statusIcon(record.status)}
                    <span className="capitalize text-gray-700 text-xs">
                      {record.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold border ${riskBadge.bg} ${riskBadge.text} ${riskBadge.border}`}
                    >
                      {record.riskScore} - {riskBadge.label}
                    </span>
                    <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          record.riskLevel === 'trusted' ? 'bg-green-500' :
                          record.riskLevel === 'review' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${record.riskScore}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex flex-wrap gap-1.5">
                    {issues.slice(0, 2).map((issue, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${issue.color}`}
                        title={issue.text}
                      >
                        {issue.icon}
                        {issue.text.length > 25 ? issue.text.substring(0, 22) + '...' : issue.text}
                      </span>
                    ))}
                    {issues.length > 2 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                        +{issues.length - 2} more
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <button
                    onClick={() => onBulkAction('reverify', [record.id])}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    Reverify
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {/* Empty state */}
      {records.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-sm">No records to display</div>
        </div>
      )}
    </div>
  );
}