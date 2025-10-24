import { useEffect, useState } from "react";

export default function CompliancePage() {
  const [form, setForm] = useState({
    documentName: "",
    documentType: "privacy_policy",
    regulations: ["GDPR"],
    content: "",
  });
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState("text"); // "text" or "file"
  const [selectedFile, setSelectedFile] = useState(null);
  const token = localStorage.getItem("token");

  // Available regulations
  const availableRegulations = [
    { value: "GDPR", label: "GDPR (EU General Data Protection Regulation)", region: "🇪🇺 Europe" },
    { value: "CCPA", label: "CCPA (California Consumer Privacy Act)", region: "🇺🇸 USA" },
    { value: "DPDPA", label: "DPDPA (Digital Personal Data Protection Act)", region: "🇮🇳 India" },
    { value: "HIPAA", label: "HIPAA (Health Insurance Portability)", region: "🇺🇸 USA" },
    { value: "SOX", label: "SOX (Sarbanes-Oxley Act)", region: "🇺🇸 USA" },
    { value: "Privacy Law", label: "Privacy Law (General)", region: "🌍 Global" },
    { value: "Data Protection", label: "Data Protection (General)", region: "🌍 Global" },
    { value: "Contract Law", label: "Contract Law", region: "🌍 Global" }
  ];

  const fetchDocs = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setDocs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch documents", e);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegulationChange = (e) => {
    const value = e.target.value;
    const checked = e.target.checked;
    
    if (checked) {
      setForm({ ...form, regulations: [...form.regulations, value] });
    } else {
      setForm({ ...form, regulations: form.regulations.filter(r => r !== value) });
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    const validExtensions = ['.txt', '.pdf', '.docx', '.doc'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      alert('Please upload a valid file type: .txt, .pdf, .docx, or .doc');
      e.target.value = '';
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);

    // Auto-fill document name if empty
    if (!form.documentName) {
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'));
      setForm({ ...form, documentName: nameWithoutExt });
    }

    // Read file content
    try {
      if (fileExtension === '.txt') {
        const text = await file.text();
        setForm({ ...form, content: text });
      } else if (fileExtension === '.pdf' || fileExtension === '.docx' || fileExtension === '.doc') {
        // For PDF/DOCX, we'll send the file to backend for processing
        // For now, show a message
        setForm({ ...form, content: `[File uploaded: ${file.name}]` });
      }
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error reading file. Please try again.');
    }
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setForm({ ...form, content: "" });
    // Reset file input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.regulations.length === 0) {
      alert("Please select at least one regulation");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/documents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          regulations: form.regulations // Already an array
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setForm({ documentName: "", documentType: "privacy_policy", regulations: ["GDPR"], content: "" });
        // Server returns analyzed document synchronously
        if (data.document) setDocs((prev) => [data.document, ...prev]);
        else fetchDocs();
      } else {
        alert(data.message || "Upload failed");
      }
    } catch (e) {
      console.error(e);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Compliance Document Review</h2>
      <form onSubmit={handleSubmit} className="space-y-4 mb-8 bg-white p-6 rounded-lg shadow">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Document Name</span>
          </label>
          <input
            name="documentName"
            value={form.documentName}
            onChange={handleChange}
            placeholder="e.g., Privacy Policy v2.0"
            className="input input-bordered w-full"
            required
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Document Type</span>
          </label>
          <select
            name="documentType"
            value={form.documentType}
            onChange={handleChange}
            className="select select-bordered w-full"
          >
            <option value="privacy_policy">Privacy Policy</option>
            <option value="terms">Terms & Conditions</option>
            <option value="contract">Contract</option>
            <option value="policy">Policy Document</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Select Regulations (Choose at least one)</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-base-200 rounded-lg">
            {availableRegulations.map((reg) => (
              <label key={reg.value} className="label cursor-pointer justify-start gap-3 hover:bg-base-300 p-2 rounded">
                <input
                  type="checkbox"
                  value={reg.value}
                  checked={form.regulations.includes(reg.value)}
                  onChange={handleRegulationChange}
                  className="checkbox checkbox-primary"
                />
                <div className="flex flex-col">
                  <span className="label-text font-medium">{reg.label}</span>
                  <span className="label-text-alt opacity-70">{reg.region}</span>
                </div>
              </label>
            ))}
          </div>
          {form.regulations.length > 0 && (
            <div className="mt-2">
              <span className="text-sm font-medium">Selected: </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {form.regulations.map((reg) => (
                  <span key={reg} className="badge badge-primary">{reg}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Document Content</span>
          </label>
          
          {/* Upload Mode Tabs */}
          <div className="tabs tabs-boxed mb-3">
            <button
              type="button"
              className={`tab ${uploadMode === 'text' ? 'tab-active' : ''}`}
              onClick={() => {
                setUploadMode('text');
                handleFileRemove();
              }}
            >
              📝 Paste Text
            </button>
            <button
              type="button"
              className={`tab ${uploadMode === 'file' ? 'tab-active' : ''}`}
              onClick={() => setUploadMode('file')}
            >
              📁 Upload File
            </button>
          </div>

          {uploadMode === 'text' ? (
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="Paste your document content here for AI analysis..."
              className="textarea textarea-bordered w-full h-40"
              required
            />
          ) : (
            <div className="space-y-3">
              {/* File Upload Area */}
              <div className="border-2 border-dashed border-base-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  id="fileInput"
                  className="hidden"
                  accept=".txt,.pdf,.docx,.doc"
                  onChange={handleFileSelect}
                />
                <label htmlFor="fileInput" className="cursor-pointer">
                  <div className="text-4xl mb-2">📄</div>
                  <div className="text-sm font-medium mb-1">
                    Click to upload or drag and drop
                  </div>
                  <div className="text-xs opacity-60">
                    TXT, PDF, DOCX, DOC (Max 10MB)
                  </div>
                </label>
              </div>

              {/* Selected File Display */}
              {selectedFile && (
                <div className="alert shadow-lg">
                  <div className="flex-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info shrink-0 w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div>
                      <h3 className="font-bold">{selectedFile.name}</h3>
                      <div className="text-xs opacity-70">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </div>
                    </div>
                  </div>
                  <div className="flex-none">
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={handleFileRemove}
                    >
                      ✕ Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Hidden textarea for form validation */}
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                className="hidden"
                required
              />
            </div>
          )}
        </div>

        <button className="btn btn-primary w-full" type="submit" disabled={loading}>
          {loading ? (
            <>
              <span className="loading loading-spinner"></span>
              Analyzing Document...
            </>
          ) : (
            "🔍 Upload & Analyze Document"
          )}
        </button>
      </form>

      <h3 className="text-2xl font-bold mb-4">Your Documents</h3>
      <div className="space-y-4">
        {docs.map((d) => (
          <div key={d._id} className="card bg-white shadow-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="font-bold text-lg">{d.documentName}</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="badge badge-outline">{d.documentType}</span>
                  <span className={`badge ${
                    d.status === 'APPROVED' ? 'badge-success' : 
                    d.status === 'REJECTED' ? 'badge-error' : 
                    d.status === 'IN_REVIEW' ? 'badge-info' : 
                    'badge-warning'
                  }`}>
                    {d.status}
                  </span>
                  <span className={`badge ${
                    d.riskLevel === 'low' ? 'badge-success' : 
                    d.riskLevel === 'medium' ? 'badge-warning' : 
                    d.riskLevel === 'high' ? 'badge-error' : 
                    'badge-error'
                  }`}>
                    Risk: {d.riskLevel}
                  </span>
                  {Array.isArray(d.regulations) && d.regulations.map((reg) => (
                    <span key={reg} className="badge badge-primary">{reg}</span>
                  ))}
                </div>
                {typeof d.complianceScore === "number" && (
                  <div className="mt-3">
                    <div className="text-sm font-medium mb-1">Compliance Score</div>
                    <progress 
                      className={`progress ${
                        d.complianceScore >= 80 ? 'progress-success' : 
                        d.complianceScore >= 60 ? 'progress-warning' : 
                        'progress-error'
                      } w-full`} 
                      value={d.complianceScore} 
                      max="100"
                    ></progress>
                    <span className="text-sm font-bold">{d.complianceScore}/100</span>
                  </div>
                )}
              </div>
              <div className="text-sm ml-4">
                {d.assignedLawyer && (
                  <div className="text-right">
                    <div className="text-xs opacity-70">Assigned Lawyer</div>
                    <div className="font-medium">{d.assignedLawyer.email}</div>
                  </div>
                )}
              </div>
            </div>
            {d.lawyerNotes && (
              <div className="mt-2 p-2 bg-base-300 rounded">
                <p className="text-sm font-semibold">Lawyer Notes:</p>
                <p className="text-sm opacity-90">{d.lawyerNotes}</p>
              </div>
            )}
            {Array.isArray(d.violations) && d.violations.length > 0 && (
              <div className="mt-2">
                <p className="font-semibold">Violations:</p>
                <ul className="list-disc ml-5 text-sm space-y-1">
                  {d.violations.map((v, i) => (
                    <li key={i}>
                      <div>
                        <span className="font-medium">[{v.severity}]</span> {v.issue} — <span className="opacity-70">{v.regulation}</span>
                      </div>
                      {v.clause && <div className="opacity-80">Clause: {v.clause}</div>}
                      {v.suggestion && <div className="opacity-90">Suggestion: {v.suggestion}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
        {docs.length === 0 && <p>No documents yet.</p>}
      </div>
    </div>
  );
}



