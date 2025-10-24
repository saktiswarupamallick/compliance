import mongoose from "mongoose";

const violationSchema = new mongoose.Schema(
  {
    clause: String,
    issue: String,
    regulation: String,
    severity: { type: String, enum: ["low", "medium", "high", "critical"] },
    suggestion: String,
  },
  { _id: false }
);

const complianceDocumentSchema = new mongoose.Schema({
  documentName: { type: String, required: true },
  documentType: {
    type: String,
    enum: ["privacy_policy", "terms", "contract", "policy", "other"],
    default: "privacy_policy",
  },
  regulations: [{ type: String }],
  content: { type: String, required: true },
  status: {
    type: String,
    enum: ["PENDING_REVIEW", "IN_REVIEW", "APPROVED", "REJECTED", "REVISION_NEEDED"],
    default: "PENDING_REVIEW",
  },
  riskLevel: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
  complianceScore: { type: Number, min: 0, max: 100, default: 0 },
  violations: [violationSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  assignedLawyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  lawyerNotes: { type: String, default: "" },
  reviewedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("ComplianceDocument", complianceDocumentSchema);







