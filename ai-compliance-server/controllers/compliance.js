import ComplianceDocument from "../models/complianceDocument.js";
import User from "../models/user.js";
import { inngest } from "../inngest/client.js";
import { analyzeComplianceDocument } from "../utils/ai.js";

export const createDocument = async (req, res) => {
  try {
    const { documentName, documentType = "privacy_policy", regulations = ["GDPR"], content } = req.body;
    if (!documentName || !content) {
      return res.status(400).json({ message: "documentName and content are required" });
    }
    let doc = await ComplianceDocument.create({
      documentName,
      documentType,
      regulations,
      content,
      createdBy: req.user._id,
      status: "PENDING_REVIEW",
    });

    // Run AI synchronously for immediate UX feedback
    let aiResult = null;
    try {
      const ai = await analyzeComplianceDocument({
        documentName,
        documentType,
        regulations,
        content,
      });
      if (ai) {
        aiResult = ai;
        doc = await ComplianceDocument.findByIdAndUpdate(
          doc._id,
          {
            complianceScore: ai.complianceScore,
            riskLevel: ai.riskLevel,
            violations: ai.violations,
          },
          { new: true }
        );
      } else {
        // fallback minimal
        doc = await ComplianceDocument.findByIdAndUpdate(
          doc._id,
          {
            riskLevel: "high",
          },
          { new: true }
        );
      }
    } catch (e) {
      console.log("AI sync analysis failed:", e.message);
    }

    // Auto-assign to a lawyer based on specializations matching regulations
    try {
      const regulationsList = Array.isArray(regulations) ? regulations : [regulations];
      let lawyer = await User.findOne({
        role: "lawyer",
        specializations: {
          $elemMatch: {
            $in: regulationsList.map(r => new RegExp(r, 'i'))
          }
        }
      });

      // Fallback: any lawyer if no specialization match
      if (!lawyer) {
        lawyer = await User.findOne({ role: "lawyer" });
      }

      if (lawyer) {
        doc = await ComplianceDocument.findByIdAndUpdate(
          doc._id,
          { 
            assignedLawyer: lawyer._id,
            status: "IN_REVIEW"
          },
          { new: true }
        ).populate("assignedLawyer", ["email", "_id"]);
      }
    } catch (e) {
      console.log("Lawyer assignment failed:", e.message);
    }

    // Fire inngest for any async follow-ups (e.g., email, audit logs)
    try {
      await inngest.send({ name: "document/uploaded", data: { documentId: doc._id.toString() } });
    } catch (e) {
      console.log("Inngest error (non-critical):", e.message);
    }

    return res.status(201).json({ message: "Document analyzed", document: doc });
  } catch (error) {
    console.error("Error creating compliance document", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const listDocuments = async (req, res) => {
  try {
    const user = req.user;
    let query = {};
    
    if (user.role === "client") {
      // Clients see only their own documents
      query = { createdBy: user._id };
    } else if (user.role === "lawyer") {
      // Lawyers see documents assigned to them
      query = { assignedLawyer: user._id };
    }
    
    const docs = await ComplianceDocument.find(query)
      .populate("assignedLawyer", ["email", "_id"])
      .populate("createdBy", ["email", "_id"])
      .sort({ createdAt: -1 });
    return res.status(200).json(docs);
  } catch (error) {
    console.error("Error listing compliance documents", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getDocument = async (req, res) => {
  try {
    const user = req.user;
    let doc;
    
    if (user.role === "client") {
      doc = await ComplianceDocument.findOne({ _id: req.params.id, createdBy: user._id })
        .populate("assignedLawyer", ["email", "_id"])
        .populate("createdBy", ["email", "_id"]);
    } else if (user.role === "lawyer") {
      doc = await ComplianceDocument.findOne({ _id: req.params.id, assignedLawyer: user._id })
        .populate("assignedLawyer", ["email", "_id"])
        .populate("createdBy", ["email", "_id"]);
    }
    
    if (!doc) return res.status(404).json({ message: "Document not found" });
    return res.status(200).json({ document: doc });
  } catch (error) {
    console.error("Error fetching compliance document", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateDocumentStatus = async (req, res) => {
  try {
    const user = req.user;
    const { status, lawyerNotes } = req.body;
    
    // Only lawyers can update status
    if (user.role !== "lawyer") {
      return res.status(403).json({ message: "Only lawyers can update document status" });
    }
    
    const doc = await ComplianceDocument.findOne({ 
      _id: req.params.id, 
      assignedLawyer: user._id 
    });
    
    if (!doc) {
      return res.status(404).json({ message: "Document not found or not assigned to you" });
    }
    
    doc.status = status;
    if (lawyerNotes) doc.lawyerNotes = lawyerNotes;
    if (["APPROVED", "REJECTED"].includes(status)) {
      doc.reviewedAt = new Date();
    }
    
    await doc.save();
    
    return res.status(200).json({ message: "Document updated", document: doc });
  } catch (error) {
    console.error("Error updating document status", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};




