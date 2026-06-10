'use client';

import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';

interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  status: 'verified' | 'invalid' | 'needs_review';
  riskScore: number;
  riskLevel: 'trusted' | 'review' | 'high_risk';
  isDuplicate: boolean;
  qualityFlags: string[];
}

export default function Home() {
  const [records, setRecords] = useState<CustomerRecord[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CustomerRecord | null>(null);

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    if (!cleaned.match(/^[0-9]{7,15}$/)) {
      return { isValid: false };
    }
    return { isValid: true };
  };

  const processFile = async (file: File) => {
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      
      const phoneMap = new Map();
      const processed: CustomerRecord[] = json.map((row: any, idx) => {
        const name = row.Name || row.name || 'Unknown';
        const phone = row.Phone || row.phone || '';
        const email = row.Email || row.email || '';
        const address = row.Address || row.address || '';
        
        const phoneValid = validatePhone(phone);
        const isDuplicate = phoneMap.has(phone);
        phoneMap.set(phone, true);
        
        const qualityFlags: string[] = [];
        if (!name || name.length < 2) qualityFlags.push('Missing name');
        if (!address || address.length < 5) qualityFlags.push('Incomplete address');
        
        let status: 'verified' | 'invalid' | 'needs_review' = 'needs_review';
        if (phoneValid.isValid && qualityFlags.length === 0) status = 'verified';
        else if (!phoneValid.isValid) status = 'invalid';
        
        let riskScore = 100;
        if (status === 'invalid') riskScore -= 40;
        if (qualityFlags.includes('Incomplete address')) riskScore -= 20;
        if (isDuplicate) riskScore -= 25;
        riskScore = Math.max(0, riskScore);
        
        let riskLevel: 'trusted' | 'review' | 'high_risk' = 'review';
        if (riskScore >= 85) riskLevel = 'trusted';
        else if (riskScore < 60) riskLevel = 'high_risk';
        
        return {
          id: `rec_${Date.now()}_${idx}`,
          name,
          phone,
          email,
          address,
          status,
          riskScore,
          riskLevel,
          isDuplicate,
          qualityFlags,
        };
      });
      
      setRecords(processed);
      setIsUploading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const loadSampleData = () => {
    const sampleData = [
      { Name: 'Ahmed Mansour', Phone: '+14155552671', Email: 'ahmed@example.com', Address: '123 Main St, New York, NY 10001' },
      { Name: 'Rahul Sharma', Phone: '+919876543210', Email: 'rahul@example.com', Address: '456 Park Ave, Mumbai 400001' },
      { Name: 'Sarah Johnson', Phone: '+442071234567', Email: 'sarah@example.com', Address: '789 High St, London SW1A 1AA' },
      { Name: 'Test User', Phone: '0000000000', Email: 'invalid', Address: '' },
      { Name: 'Chen Wei', Phone: '+8612345678901', Email: 'chen@example.com', Address: '123 Nanjing Rd, Shanghai' },
    ];
    
    const phoneMap = new Map();
    const processed = sampleData.map((row, idx) => {
      const phoneValid = validatePhone(row.Phone);
      const isDuplicate = phoneMap.has(row.Phone);
      phoneMap.set(row.Phone, true);
      
      const qualityFlags: string[] = [];
      if (!row.Name || row.Name.length < 2) qualityFlags.push('Missing name');
      if (!row.Address || row.Address.length < 5) qualityFlags.push('Incomplete address');
      
      let status: 'verified' | 'invalid' | 'needs_review' = 'needs_review';
      if (phoneValid.isValid && qualityFlags.length === 0) status = 'verified';
      else if (!phoneValid.isValid) status = 'invalid';
      
      let riskScore = 100;
      if (status === 'invalid') riskScore -= 40;
      if (qualityFlags.includes('Incomplete address')) riskScore -= 20;
      if (isDuplicate) riskScore -= 25;
      riskScore = Math.max(0, riskScore);
      
      let riskLevel: 'trusted' | 'review' | 'high_risk' = 'review';
      if (riskScore >= 85) riskLevel = 'trusted';
      else if (riskScore < 60) riskLevel = 'high_risk';
      
      return {
        id: `sample_${idx}`,
        name: row.Name,
        phone: row.Phone,
        email: row.Email,
        address: row.Address,
        status,
        riskScore,
        riskLevel,
        isDuplicate,
        qualityFlags,
      };
    });
    setRecords(processed);
  };

  const analytics = useMemo(() => ({
    total: records.length,
    verified: records.filter(r => r.status === 'verified').length,
    invalid: records.filter(r => r.status === 'invalid').length,
    needsReview: records.filter(r => r.status === 'needs_review').length,
    duplicates: records.filter(r => r.isDuplicate).length,
  }), [records]);

  const filteredRecords = records.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.phone.includes(searchTerm);
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleReverify = (record: CustomerRecord) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  // Upload Screen
  if (records.length === 0) {
    return (
      <div className="container">
        <div className="header">
          <div className="logo">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1>VerifData AI</h1>
          <p className="subtitle">AI-powered customer data quality & verification suite</p>
        </div>

        <div className="upload-card" onClick={() => document.getElementById('fileInput')?.click()}>
          {isUploading ? (
            <>
              <div className="spinner"></div>
              <p>Processing your data...</p>
            </>
          ) : (
            <>
              <div className="upload-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3>Upload your data file</h3>
              <p>Drag & drop or click to browse</p>
              <div className="file-types">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                .xlsx, .csv supported
              </div>
              <div className="columns">
                <span className="column-badge">Name</span>
                <span className="column-badge">Phone</span>
                <span className="column-badge">Email</span>
                <span className="column-badge">Address</span>
              </div>
            </>
          )}
        </div>
        <input
          id="fileInput"
          type="file"
          accept=".xlsx,.csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
          style={{ display: 'none' }}
        />

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button className="btn btn-secondary" onClick={loadSampleData}>
            👁️ Preview with sample data
          </button>
        </div>

        <div className="features">
          {[
            { icon: '📱', label: 'Phone Validation', desc: 'Format & carrier' },
            { icon: '🛡️', label: 'Risk Scoring', desc: 'Auto calculation' },
            { icon: '📊', label: 'Analytics', desc: 'Live insights' },
            { icon: '✨', label: 'AI Cleaning', desc: 'Smart fixes' },
          ].map((feature, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h4>{feature.label}</h4>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className="logo" style={{ width: '50px', height: '50px', margin: 0 }}>
            <svg width="25" height="25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: '24px', margin: 0 }}>VerifData AI</h1>
            <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Data Quality Dashboard</p>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={loadSampleData}>Load Sample</button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: '#e0e7ff' }}>📊</div>
            <div className="stat-value">{analytics.total}</div>
          </div>
          <div className="stat-label">Total Records</div>
          <div className="stat-bar">
            <div className="stat-bar-fill" style={{ width: '100%', background: '#667eea' }}></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: '#d1fae5' }}>✅</div>
            <div className="stat-value">{analytics.verified}</div>
          </div>
          <div className="stat-label">Verified</div>
          <div className="stat-bar">
            <div className="stat-bar-fill" style={{ width: `${(analytics.verified / Math.max(analytics.total, 1)) * 100}%`, background: '#10b981' }}></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: '#fed7aa' }}>⚠️</div>
            <div className="stat-value">{analytics.needsReview}</div>
          </div>
          <div className="stat-label">Needs Review</div>
          <div className="stat-bar">
            <div className="stat-bar-fill" style={{ width: `${(analytics.needsReview / Math.max(analytics.total, 1)) * 100}%`, background: '#f59e0b' }}></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: '#fee2e2' }}>🔄</div>
            <div className="stat-value">{analytics.duplicates}</div>
          </div>
          <div className="stat-label">Duplicates</div>
          <div className="stat-bar">
            <div className="stat-bar-fill" style={{ width: `${(analytics.duplicates / Math.max(analytics.total, 1)) * 100}%`, background: '#ef4444' }}></div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <div className="button-group">
          <button className="btn btn-success">✓ Mark Selected ({selectedRows.size})</button>
          <button className="btn btn-danger">🗑️ Delete Selected</button>
          <button className="btn btn-secondary">📥 Export</button>
        </div>
        <div className="filters">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="invalid">Invalid</option>
            <option value="needs_review">Needs Review</option>
          </select>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th><input type="checkbox" /></th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Address</th>
              <th>Status</th>
              <th>Risk</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map(record => (
              <tr key={record.id}>
                <td><input type="checkbox" /></td>
                <td><strong>{record.name}</strong></td>
                <td>{record.phone}</td>
                <td>{record.email || '—'}</td>
                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.address || '—'}</td>
                <td>
                  {record.status === 'verified' && <span className="badge badge-verified">✅ Verified</span>}
                  {record.status === 'invalid' && <span className="badge badge-invalid">❌ Invalid</span>}
                  {record.status === 'needs_review' && <span className="badge badge-review">⚠️ Review</span>}
                </td>
                <td>
                  <span className={`risk-score risk-${record.riskLevel}`}>
                    {record.riskScore}
                  </span>
                </td>
                <td>
                  <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => handleReverify(record)}>
                    🔄 Reverify
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRecords.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            No records found
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#999' }}>
        Showing {filteredRecords.length} of {records.length} records
      </div>

      {/* Modal */}
      {showModal && selectedRecord && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reverify Customer</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '12px', marginBottom: '20px' }}>
              <p><strong>{selectedRecord.name}</strong></p>
              <p style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>{selectedRecord.phone}</p>
              {selectedRecord.email && <p style={{ color: '#666', fontSize: '14px' }}>{selectedRecord.email}</p>}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" style={{ flex: 1 }}>📱 Send SMS OTP</button>
              <button className="btn btn-secondary" style={{ flex: 1 }}>📧 Send Email</button>
            </div>
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: '10px' }}>🔗 Generate Verification Link</button>
          </div>
        </div>
      )}
    </div>
  );
}