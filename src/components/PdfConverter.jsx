import React, { useState, useRef, useEffect } from 'react';

export default function PdfConverter() {
  const [file, setFile] = useState(null);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState(null);
  const [depsReady, setDepsReady] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    fetch('/api/convert/status', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => setDepsReady(data))
    .catch(() => setDepsReady({ ready: false }));
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setError(null);
    } else {
      setError('Please select a PDF file');
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setConverting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/convert/pdf-to-doc', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Conversion failed');
      }

      // Download the resulting DOCX
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, '.docx');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err.message);
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          PDF to DOC Converter / PDF转Word工具
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Upload a PDF file and convert it to DOCX format.
          <br />
          上传PDF文件，转换为Word文档格式。
        </p>
      </div>

      {depsReady && !depsReady.ready && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">Dependencies not installed</p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
            Run: <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">npm install pdf-parse docx multer</code>
          </p>
        </div>
      )}

      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        {file ? (
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
            <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Click to select PDF file</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">点击选择PDF文件 (最大50MB)</p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <button
        onClick={handleConvert}
        disabled={!file || converting || (depsReady && !depsReady.ready)}
        className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {converting ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Converting...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Convert to DOCX / 转换为Word
          </>
        )}
      </button>

      {/* Info */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">About / 说明</h4>
        <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1 list-disc list-inside">
          <li>Extracts text content from PDF and creates a formatted Word document</li>
          <li>从PDF中提取文本内容并创建格式化的Word文档</li>
          <li>Supports PDFs up to 50MB / 支持最大50MB的PDF文件</li>
          <li>Complex layouts, images, and tables may not be preserved perfectly</li>
          <li>复杂排版、图片和表格可能无法完美保留</li>
        </ul>
      </div>
    </div>
  );
}
