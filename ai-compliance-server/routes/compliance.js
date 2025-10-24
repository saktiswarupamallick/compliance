import express from "express";
import { authenticate, authorizeLawyer } from "../middlewares/auth.js";
import { createDocument, listDocuments, getDocument, updateDocumentStatus } from "../controllers/compliance.js";

const router = express.Router();

// All routes require authentication
router.get("/", authenticate, listDocuments);
router.get("/:id", authenticate, getDocument);
router.post("/", authenticate, createDocument);

// Only lawyers can update document status
router.patch("/:id/status", authenticate, authorizeLawyer, updateDocumentStatus);

export default router;




