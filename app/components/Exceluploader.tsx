'use client';

import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ExcelUploaderProps {
  onDataLoaded: (data: any[]) => void;
}

export default function ExcelUploader({ onDataLoaded }: ExcelUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState('');

  const handleFile = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 2000);
      return;
    }
    
    setUploadStatus('loading');
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);
        
        const mapped = json.map((row: any, idx) => ({
          id: `row_${Date.now()}_${idx}`,
          name: row['Name'] || row['name'] || row['CUSTOMER_NAME'] || row['Full Name'] || '',
          phone: row['Phone'] || row['phone'] || row['MOBILE'] || row['Phone Number'] || '',
          email: row['Email'] || row['email'] || row['EMAIL'] || '',
          address: row['Address'] || row['address'] || row['ADDRESS'] || '',
        })).filter(r => r.name || r.phone);
        
        if (mapped.length === 0) throw new Error('No valid records');
        
        setUploadStatus('success');
        setTimeout(() => onDataLoaded(mapped), 500);
      } catch (error) {
        setUploadStatus('error');
        setTimeout(() => setUploadStatus('idle'), 2000);
      }
    };
    reader.onerror = () => {
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 2000);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.csv') || file.name.endsWith('.xls'))) {
      handleFile(file);
    } else {
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 2000);
    }
  };

  return (
    <div className="w-full">
      <div
        onClick={() => uploadStatus === 'idle' && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative rounded-2xl cursor-pointer transition-all duration-300
          ${isDragging ? 'ring-2 ring-primary-500 scale-[1.01]' : ''}
          ${uploadStatus === 'loading' ? 'opacity-70' : ''}
          ${uploadStatus === 'idle' ? 'bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-sm border-2 border-dashed border-primary-300' : ''}
          ${uploadStatus === 'success' ? 'bg-emerald-50 border-2 border-emerald-300' : ''}
          ${uploadStatus === 'error' ? 'bg-rose-50 border-2 border-rose-300' : ''}
          shadow-lg hover:shadow-xl transition-all
        `}
      >
        <div className="p-12 text-center">
          {uploadStatus === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-14 h-14 text-primary-500 animate-spin" />
              <div>
                <p className="text-slate-700 font-medium">Processing {fileName}...</p>
                <p className="text-sm text-slate-400 mt-1">Validating and cleaning data</p>
              </div>
            </div>
          )}
          
          {uploadStatus === 'success' && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-emerald-500 animate-bounce" />
              </div>
              <div>
                <p className="text-emerald-600 font-semibold text-lg">File loaded successfully!</p>
                <p className="text-sm text-emerald-500 mt-1">Redirecting to dashboard...</p>
              </div>
            </div>
          )}
          
          {uploadStatus === 'error' && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-rose-500" />
              </div>
              <div>
                <p className="text-rose-600 font-semibold text-lg">Error processing file</p>
                <p className="text-sm text-rose-500 mt-1">Please check file format and try again</p>
              </div>
            </div>
          )}
          
          {uploadStatus === 'idle' && (
            <>
              <div className="w-24 h-24 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-primary-100 to-indigo-100 flex items-center justify-center shadow-inner">
                <FileSpreadsheet className="w-12 h-12 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Drop your file here</h3>
              <p className="text-slate-500 mb-4">or click to browse</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 rounded-full text-sm text-slate-600 backdrop-blur-sm">
                <Upload className="w-4 h-4" />
                .xlsx, .xls, .csv supported
              </div>
              <div className="flex gap-3 justify-center mt-6 text-xs text-slate-400">
                <span className="px-3 py-1.5 bg-white/50 rounded-lg">Name</span>
                <span className="px-3 py-1.5 bg-white/50 rounded-lg">Phone</span>
                <span className="px-3 py-1.5 bg-white/50 rounded-lg">Email</span>
                <span className="px-3 py-1.5 bg-white/50 rounded-lg">Address</span>
              </div>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="hidden"
        />
      </div>
    </div>
  );
}