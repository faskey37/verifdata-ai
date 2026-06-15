"use client";

import { useState, useMemo } from "react";
import * as XLSX from "xlsx";

interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  status: "verified" | "invalid" | "needs_review";
  riskScore: number;
  riskLevel: "trusted" | "review" | "high_risk";
  isDuplicate: boolean;
  qualityFlags: string[];
}

export default function Home() {
  const [records, setRecords] = useState<CustomerRecord[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showIssuesModal, setShowIssuesModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CustomerRecord | null>(null);

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
    if (!cleaned.match(/^[0-9]{7,15}$/)) {
      return { isValid: false };
    }
    return { isValid: true };
  };

  // Function to get issues for a record
  const getIssuesForRecord = (record: CustomerRecord): { icon: string; text: string }[] => {
    const issues = [];

    // Phone issues
    if (!validatePhone(record.phone).isValid) {
      issues.push({ icon: "❌", text: "Invalid phone number" });
    }

    // Address issues
    if (!record.address || record.address.trim().length === 0) {
      issues.push({ icon: "📍", text: "Missing address" });
    } else if (record.address.length < 3) {
      issues.push({ icon: "📍", text: "Incomplete address" });
    }

    // Duplicate issues
    if (record.isDuplicate) {
      issues.push({ icon: "🔄", text: "Duplicate phone number" });
    }

    // Name issues
    if (!record.name || record.name.length === 0) {
      issues.push({ icon: "👤", text: "Missing name" });
    } else if (record.name.length < 3) {
      issues.push({ icon: "👤", text: "Suspicious short name" });
    } else if (/[0-9]/.test(record.name)) {
      issues.push({ icon: "👤", text: "Name contains numbers" });
    }

    // Fake name detection
    const fakeNames = ["unknown", "test", "test user", "admin", "asdfgh", "qwerty", "demo", "sample"];
    if (fakeNames.includes(record.name.toLowerCase())) {
      issues.push({ icon: "🎭", text: "Fake-looking name" });
    }

    // Email issues
    if (!record.email) {
      issues.push({ icon: "📧", text: "Missing email" });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
      issues.push({ icon: "📧", text: "Invalid email format" });
    }

    return issues;
  };

  // Export function
  const handleExport = () => {
    const recordsToExport = selectedRows.size > 0 
      ? records.filter(r => selectedRows.has(r.id))
      : records;

    if (recordsToExport.length === 0) {
      alert("No records to export");
      return;
    }

    // Prepare data for export
    const exportData = recordsToExport.map(record => ({
      "Name": record.name,
      "Phone": record.phone,
      "Email": record.email,
      "Address": record.address,
      "Status": record.status,
      "Risk Score": record.riskScore,
      "Risk Level": record.riskLevel,
      "Duplicate": record.isDuplicate ? "Yes" : "No",
      "Issues": getIssuesForRecord(record).map(i => i.text).join(", ")
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Auto-size columns
    const maxWidth = 50;
    worksheet['!cols'] = Object.keys(exportData[0] || {}).map(() => ({ wch: 20 }));
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customer Data");
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `verifdata_export_${timestamp}.xlsx`;
    
    // Download file
    XLSX.writeFile(workbook, filename);
  };

  const processFile = async (file: File) => {
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      const phoneMap = new Map();
      const processed: CustomerRecord[] = json.map((row: any, idx) => {
        const name = String(row.Name || row.name || "").trim();
        const phone = String(row.Phone || row.phone || "").trim();
        const email = String(row.Email || row.email || "").trim();
        const address = String(row.Address || row.address || "").trim();

        const phoneValid = validatePhone(phone);
        const isDuplicate = phoneMap.has(phone);
        phoneMap.set(phone, true);

        const qualityFlags: string[] = [];

        // Name validation
        if (!name) {
          qualityFlags.push("Missing customer name");
        } else if (name.length < 3 && name.length > 0) {
          qualityFlags.push("Suspicious short name");
        }

        const fakeNames = ["unknown", "test", "test user", "admin", "asdfgh", "qwerty", "demo", "sample"];
        if (fakeNames.includes(name.toLowerCase())) {
          qualityFlags.push("Fake-looking name");
        }

        // Email validation
        if (!email) {
          qualityFlags.push("Missing email");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          qualityFlags.push("Invalid email");
        }

        // Address validation
        if (!address) {
          qualityFlags.push("Missing address");
        } else if (address.length < 3 && address.length > 0) {
          qualityFlags.push("Incomplete address");
        }

        // Determine status based on issues
        let status: "verified" | "invalid" | "needs_review";
        let riskScore = 100;

        if (!phoneValid.isValid) {
          status = "invalid";
          riskScore -= 55;
        } else if (qualityFlags.length > 0 || isDuplicate) {
          status = "needs_review";
          
          if (qualityFlags.includes("Missing customer name")) riskScore -= 25;
          if (qualityFlags.includes("Suspicious short name")) riskScore -= 20;
          if (qualityFlags.includes("Fake-looking name")) riskScore -= 15;
          if (qualityFlags.includes("Missing email")) riskScore -= 15;
          if (qualityFlags.includes("Invalid email")) riskScore -= 10;
          if (qualityFlags.includes("Missing address")) riskScore -= 25;
          if (qualityFlags.includes("Incomplete address")) riskScore -= 15;
          if (isDuplicate) riskScore -= 20;
        } else {
          status = "verified";
        }

        riskScore = Math.max(0, Math.min(100, riskScore));

        let riskLevel: "trusted" | "review" | "high_risk" = "review";
        if (riskScore >= 85) riskLevel = "trusted";
        else if (riskScore < 60) riskLevel = "high_risk";

        return {
          id: `rec_${Date.now()}_${idx}`,
          name: name || "Unknown",
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
      { Name: "Ahmed Mansour", Phone: "+14155552671", Email: "ahmed@example.com", Address: "123 Main St, New York, NY 10001" },
      { Name: "Rahul Sharma", Phone: "+919876543210", Email: "rahul@example.com", Address: "Nagpur" },
      { Name: "Sarah Johnson", Phone: "+442071234567", Email: "sarah@example.com", Address: "789 High St, London SW1A 1AA" },
      { Name: "Test User", Phone: "0000000000", Email: "invalid", Address: "" },
      { Name: "Chen Wei", Phone: "+8612345678901", Email: "chen@example.com", Address: "123 Nanjing Rd, Shanghai" },
      { Name: "Priya Patel", Phone: "9123456789", Email: "priya@yahoo.com", Address: "Mumbai" },
      { Name: "asdfgh", Phone: "9765432109", Email: "fake@test.com", Address: "Pune" },
      { Name: "A", Phone: "12345", Email: "", Address: "" },
      { Name: "John Doe", Phone: "9988776655", Email: "john@example.com", Address: "Delhi" },
    ];

    const phoneMap = new Map();
    const processed = sampleData.map((row, idx) => {
      const name = row.Name || "";
      const phone = row.Phone || "";
      const email = row.Email || "";
      const address = row.Address || "";
      
      const phoneValid = validatePhone(phone);
      const isDuplicate = phoneMap.has(phone);
      phoneMap.set(phone, true);

      const qualityFlags: string[] = [];
      
      if (!name) {
        qualityFlags.push("Missing customer name");
      } else if (name.length < 3 && name.length > 0) {
        qualityFlags.push("Suspicious short name");
      }
      
      const fakeNames = ["unknown", "test", "test user", "admin", "asdfgh", "qwerty"];
      if (fakeNames.includes(name.toLowerCase())) qualityFlags.push("Fake-looking name");
      
      if (!email) qualityFlags.push("Missing email");
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) qualityFlags.push("Invalid email");
      
      if (!address) qualityFlags.push("Missing address");
      else if (address.length < 3 && address.length > 0) qualityFlags.push("Incomplete address");

      let status: "verified" | "invalid" | "needs_review";
      let riskScore = 100;
      
      if (!phoneValid.isValid) {
        status = "invalid";
        riskScore -= 55;
      } else if (qualityFlags.length > 0 || isDuplicate) {
        status = "needs_review";
        
        if (qualityFlags.includes("Missing customer name")) riskScore -= 25;
        if (qualityFlags.includes("Suspicious short name")) riskScore -= 20;
        if (qualityFlags.includes("Fake-looking name")) riskScore -= 15;
        if (qualityFlags.includes("Missing email")) riskScore -= 15;
        if (qualityFlags.includes("Invalid email")) riskScore -= 10;
        if (qualityFlags.includes("Missing address")) riskScore -= 25;
        if (qualityFlags.includes("Incomplete address")) riskScore -= 15;
        if (isDuplicate) riskScore -= 20;
      } else {
        status = "verified";
      }
      
      riskScore = Math.max(0, Math.min(100, riskScore));

      let riskLevel: "trusted" | "review" | "high_risk" = "review";
      if (riskScore >= 85) riskLevel = "trusted";
      else if (riskScore < 60) riskLevel = "high_risk";

      return {
        id: `sample_${idx}`,
        name: name || "Unknown",
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
  };

  const analytics = useMemo(
    () => ({
      total: records.length,
      verified: records.filter((r) => r.status === "verified").length,
      invalid: records.filter((r) => r.status === "invalid").length,
      needsReview: records.filter((r) => r.status === "needs_review").length,
      duplicates: records.filter((r) => r.isDuplicate).length,
    }),
    [records],
  );

  const filteredRecords = records.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phone.includes(searchTerm);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRows(new Set(filteredRecords.map(r => r.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSet = new Set(selectedRows);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedRows(newSet);
  };

  const handleReverify = (record: CustomerRecord) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  const handleViewIssues = (record: CustomerRecord) => {
    setSelectedRecord(record);
    setShowIssuesModal(true);
  };

  const handleDeleteSelected = () => {
    if (selectedRows.size === 0) {
      alert("No records selected");
      return;
    }
    if (confirm(`Delete ${selectedRows.size} selected record(s)?`)) {
      setRecords(records.filter(r => !selectedRows.has(r.id)));
      setSelectedRows(new Set());
    }
  };

  const handleMarkVerified = () => {
    if (selectedRows.size === 0) {
      alert("No records selected");
      return;
    }
    setRecords(records.map(r => 
      selectedRows.has(r.id) 
        ? { ...r, status: "verified" as const, riskScore: 95, riskLevel: "trusted" as const, qualityFlags: [] }
        : r
    ));
    setSelectedRows(new Set());
  };

  const isAllSelected = filteredRecords.length > 0 && 
    filteredRecords.every(record => selectedRows.has(record.id));

  // Upload Screen
  if (records.length === 0) {
    return (
      <div className="container">
        <div className="header">
          <div className="logo">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1>VerifData AI</h1>
          <p className="subtitle">
            AI-powered customer data quality & verification suite
          </p>
        </div>

        <div
          className="upload-card"
          onClick={() => document.getElementById("fileInput")?.click()}
        >
          {isUploading ? (
            <>
              <div className="spinner"></div>
              <p>Processing your data...</p>
            </>
          ) : (
            <>
              <div className="upload-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <h3>Upload your data file</h3>
              <p>Drag & drop or click to browse</p>
              <div className="file-types">
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
          onChange={(e) =>
            e.target.files?.[0] && processFile(e.target.files[0])
          }
          style={{ display: "none" }}
        />

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button className="btn btn-secondary" onClick={loadSampleData}>
            👁️ Preview with sample data
          </button>
        </div>

        <div className="features">
          {[
            { icon: "📱", label: "Phone Validation", desc: "Format & carrier" },
            { icon: "🛡️", label: "Risk Scoring", desc: "Auto calculation" },
            { icon: "📊", label: "Analytics", desc: "Live insights" },
            { icon: "✨", label: "AI Cleaning", desc: "Smart fixes" },
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div
            className="logo"
            style={{ width: "50px", height: "50px", margin: 0 }}
          >
            <svg
              width="25"
              height="25"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: "24px", margin: 0 }}>VerifData AI</h1>
            <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>
              Data Quality Dashboard
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn btn-secondary" onClick={loadSampleData}>
            Load Sample
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: "#e0e7ff" }}>
              📊
            </div>
            <div className="stat-value">{analytics.total}</div>
          </div>
          <div className="stat-label">Total Records</div>
          <div className="stat-bar">
            <div
              className="stat-bar-fill"
              style={{ width: "100%", background: "#667eea" }}
            ></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: "#d1fae5" }}>
              ✅
            </div>
            <div className="stat-value">{analytics.verified}</div>
          </div>
          <div className="stat-label">Verified</div>
          <div className="stat-bar">
            <div
              className="stat-bar-fill"
              style={{
                width: `${(analytics.verified / Math.max(analytics.total, 1)) * 100}%`,
                background: "#10b981",
              }}
            ></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: "#fed7aa" }}>
              ⚠️
            </div>
            <div className="stat-value">{analytics.needsReview}</div>
          </div>
          <div className="stat-label">Needs Review</div>
          <div className="stat-bar">
            <div
              className="stat-bar-fill"
              style={{
                width: `${(analytics.needsReview / Math.max(analytics.total, 1)) * 100}%`,
                background: "#f59e0b",
              }}
            ></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: "#fee2e2" }}>
              🔄
            </div>
            <div className="stat-value">{analytics.duplicates}</div>
          </div>
          <div className="stat-label">Duplicates</div>
          <div className="stat-bar">
            <div
              className="stat-bar-fill"
              style={{
                width: `${(analytics.duplicates / Math.max(analytics.total, 1)) * 100}%`,
                background: "#ef4444",
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <div className="button-group">
          <button className="btn btn-success" onClick={handleMarkVerified}>
            ✓ Mark Selected ({selectedRows.size})
          </button>
          <button className="btn btn-danger" onClick={handleDeleteSelected}>
            🗑️ Delete Selected
          </button>
          <button className="btn btn-secondary" onClick={handleExport}>
            📥 Export {selectedRows.size > 0 ? `(${selectedRows.size})` : "All"}
          </button>
        </div>
        <div className="filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
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
              <th className="pb-3 pt-3 pr-4">Issues</th>
              <th className="pb-3 pt-3 pr-4">Action</th>
             </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => {
              const issues = getIssuesForRecord(record);
              
              return (
                <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 pl-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(record.id)}
                      onChange={(e) => handleSelectRow(record.id, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                   </td>
                  <td className="py-3">
                    <div className="font-medium text-gray-900">
                      {record.name || "Unknown"}
                    </div>
                   </td>
                  <td className="py-3">
                    <div className="text-gray-700 font-mono text-xs">
                      {record.phone}
                    </div>
                   </td>
                  <td className="py-3">
                    <div className="text-gray-600 text-xs truncate max-w-[150px]">
                      {record.email || "—"}
                    </div>
                   </td>
                  <td className="py-3">
                    <div className="text-gray-600 text-xs truncate max-w-[150px]">
                      {record.address || "—"}
                    </div>
                   </td>
                  <td className="py-3">
                    {record.status === "verified" && (
                      <span className="badge badge-verified">✅ Verified</span>
                    )}
                    {record.status === "invalid" && (
                      <span className="badge badge-invalid">❌ Invalid</span>
                    )}
                    {record.status === "needs_review" && (
                      <span className="badge badge-review">⚠️ Needs Review</span>
                    )}
                   </td>
                  <td className="py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold ${
                        record.riskLevel === "trusted"
                          ? "bg-green-100 text-green-800"
                          : record.riskLevel === "review"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {record.riskScore}
                      </span>
                      <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            record.riskLevel === "trusted" ? "bg-green-500" :
                            record.riskLevel === "review" ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${record.riskScore}%` }}
                        />
                      </div>
                    </div>
                    </td>
                  <td className="py-3 pr-4">
                    {issues.length > 0 ? (
                      <button
                        onClick={() => handleViewIssues(record)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1"
                      >
                        📋 View {issues.length} Issue{issues.length !== 1 ? 's' : ''}
                      </button>
                    ) : (
                      <span className="text-green-600 text-xs">✅ No issues</span>
                    )}
                    </td>
                  <td className="py-3 pr-4">
                    <button
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1"
                      onClick={() => handleReverify(record)}
                    >
                      🔄 Reverify
                    </button>
                    </td>
                  </tr>
              );
            })}
          </tbody>
        </table>
        {filteredRecords.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
            No records found
          </div>
        )}
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: "20px",
          fontSize: "12px",
          color: "#999",
        }}
      >
        Showing {filteredRecords.length} of {records.length} records
        {selectedRows.size > 0 && ` | ${selectedRows.size} selected`}
      </div>

      {/* Issues Modal - Fixed Visibility */}
      {showIssuesModal && selectedRecord && (
        <div className="modal-overlay" onClick={() => setShowIssuesModal(false)}>
          <div className="modal" style={{ maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#1f2937" }}>📋 Issues Found</h3>
              <button className="close-btn" onClick={() => setShowIssuesModal(false)} style={{ fontSize: "24px", cursor: "pointer" }}>
                ×
              </button>
            </div>
            
            {/* Customer Info */}
            <div
              style={{
                padding: "16px",
                background: "#f3f4f6",
                borderRadius: "12px",
                marginBottom: "20px",
              }}
            >
              <p style={{ fontWeight: "bold", fontSize: "16px", color: "#1f2937", marginBottom: "8px" }}>
                {selectedRecord.name}
              </p>
              <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "4px" }}>
                📞 {selectedRecord.phone}
              </p>
              {selectedRecord.email && (
                <p style={{ color: "#6b7280", fontSize: "13px" }}>
                  ✉️ {selectedRecord.email}
                </p>
              )}
            </div>
            
            {/* Issues List */}
            <div style={{ marginBottom: "24px" }}>
              <p style={{ fontWeight: "600", marginBottom: "12px", fontSize: "14px", color: "#374151" }}>
                Issues Detected:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {getIssuesForRecord(selectedRecord).map((issue, idx) => (
                  <div key={idx} style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "10px",
                    padding: "10px 14px",
                    background: "#fef2f2",
                    borderRadius: "10px",
                    fontSize: "14px",
                    borderLeft: "3px solid #ef4444"
                  }}>
                    <span style={{ fontSize: "18px" }}>{issue.icon}</span>
                    <span style={{ color: "#991b1b" }}>{issue.text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Action Button */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, padding: "12px" }}
                onClick={() => {
                  setShowIssuesModal(false);
                  handleReverify(selectedRecord);
                }}
              >
                🔄 Start Reverification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reverification Modal */}
      {showModal && selectedRecord && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reverify Customer</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div
              style={{
                padding: "20px",
                background: "#f5f5f5",
                borderRadius: "12px",
                marginBottom: "20px",
              }}
            >
              <p><strong>{selectedRecord.name}</strong></p>
              <p style={{ color: "#666", fontSize: "14px", marginTop: "5px" }}>{selectedRecord.phone}</p>
              {selectedRecord.email && <p style={{ color: "#666", fontSize: "14px" }}>{selectedRecord.email}</p>}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn btn-primary" style={{ flex: 1 }}>📱 Send SMS OTP</button>
              <button className="btn btn-secondary" style={{ flex: 1 }}>📧 Send Email</button>
            </div>
            <button className="btn btn-secondary" style={{ width: "100%", marginTop: "10px" }}>
              🔗 Generate Verification Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}