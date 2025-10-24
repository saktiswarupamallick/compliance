import { useEffect, useState } from "react";

export default function LawyerDashboard() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [lawyerNotes, setLawyerNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching documents", err);
    }
  };

  const handleViewDocument = (doc) => {
    setSelectedDoc(doc);
    setLawyerNotes(doc.lawyerNotes || "");
    setNewStatus(doc.status);
  };

  const handleUpdateStatus = async () => {
    if (!selectedDoc) return;
    
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/documents/${selectedDoc._id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus, lawyerNotes }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        alert("Document updated successfully");
        setSelectedDoc(null);
        fetchDocuments();
      } else {
        alert(data.message || "Update failed");
      }
    } catch (err) {
      console.error("Update failed", err);
      alert("Something went wrong");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING_REVIEW: "badge-warning",
      IN_REVIEW: "badge-info",
      APPROVED: "badge-success",
      REJECTED: "badge-error",
      REVISION_NEEDED: "badge-warning",
    };
    return badges[status] || "badge-ghost";
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Lawyer Dashboard - Assigned Documents</h1>

      {!selectedDoc ? (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc._id} className="card bg-base-200 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-bold text-lg">{doc.documentName}</p>
                  <p className="text-sm opacity-70">
                    Type: {doc.documentType} • Regulations: {doc.regulations?.join(", ")}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className={`badge ${getStatusBadge(doc.status)}`}>{doc.status}</span>
                    <span className="badge badge-outline">Risk: {doc.riskLevel}</span>
                    {typeof doc.complianceScore === "number" && (
                      <span className="badge badge-outline">Score: {doc.complianceScore}</span>
                    )}
                  </div>
                  {doc.createdBy && (
                    <p className="text-sm mt-2">Client: {doc.createdBy.email}</p>
                  )}
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleViewDocument(doc)}
                >
                  Review
                </button>
              </div>
            </div>
          ))}
          {documents.length === 0 && <p>No documents assigned to you.</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setSelectedDoc(null)}
          >
            ← Back to List
          </button>

          <div className="card bg-base-200 p-6">
            <h2 className="text-xl font-bold mb-2">{selectedDoc.documentName}</h2>
            <div className="divider"></div>
            
            <p className="text-sm mb-2">
              <strong>Type:</strong> {selectedDoc.documentType}
            </p>
            <p className="text-sm mb-2">
              <strong>Regulations:</strong> {selectedDoc.regulations?.join(", ")}
            </p>
            <p className="text-sm mb-2">
              <strong>Risk Level:</strong> {selectedDoc.riskLevel}
            </p>
            <p className="text-sm mb-2">
              <strong>Compliance Score:</strong> {selectedDoc.complianceScore}
            </p>
            {selectedDoc.createdBy && (
              <p className="text-sm mb-4">
                <strong>Client:</strong> {selectedDoc.createdBy.email}
              </p>
            )}

            <div className="divider">Document Content</div>
            <div className="bg-base-300 p-4 rounded max-h-60 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">{selectedDoc.content}</pre>
            </div>

            {selectedDoc.violations && selectedDoc.violations.length > 0 && (
              <>
                <div className="divider">AI-Detected Violations</div>
                <ul className="list-disc ml-5 text-sm space-y-2">
                  {selectedDoc.violations.map((v, i) => (
                    <li key={i}>
                      <div>
                        <span className="font-medium">[{v.severity}]</span> {v.issue}
                      </div>
                      {v.regulation && <div className="opacity-70">Regulation: {v.regulation}</div>}
                      {v.clause && <div className="opacity-70">Clause: {v.clause}</div>}
                      {v.suggestion && <div className="opacity-90">Suggestion: {v.suggestion}</div>}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="divider">Review Actions</div>
            <div className="space-y-3">
              <select
                className="select select-bordered w-full"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="REVISION_NEEDED">Revision Needed</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <textarea
                className="textarea textarea-bordered w-full h-32"
                placeholder="Add your legal notes here..."
                value={lawyerNotes}
                onChange={(e) => setLawyerNotes(e.target.value)}
              />

              <button
                className="btn btn-success"
                onClick={handleUpdateStatus}
              >
                Update Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
