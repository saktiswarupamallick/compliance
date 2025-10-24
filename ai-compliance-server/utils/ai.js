const analyzeTicket = async (ticket) => {
  try {
    console.log("🤖 Starting AI analysis for ticket:", ticket.title);
    
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY not found in environment variables");
      return null;
    }

    const prompt = `Analyze this support ticket and return ONLY a valid JSON object with these fields:

{
"summary": "Brief 1-2 sentence summary",
"priority": "low|medium|high", 
"helpfulNotes": "Concise technical guidance for moderator",
"relatedSkills": ["skill1", "skill2"]
}

Ticket: ${ticket.title} - ${ticket.description}`;

    console.log("🔍 Analyzing ticket with Gemini AI...");
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      console.error("❌ Gemini API request failed:", response.status, response.statusText);
      const errorText = await response.text();
      console.error("Error details:", errorText);
      return null;
    }

    const data = await response.json();
    console.log("📝 Raw Gemini response:", data);
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error("❌ Invalid response structure from Gemini API");
      return null;
    }

    const raw = data.candidates[0].content.parts[0].text;
    console.log("📄 Raw text from Gemini:", raw);

    try {
      // Clean up the response - remove any markdown formatting
      let cleanText = raw.trim();
      
      // Remove markdown code blocks if present
      const match = cleanText.match(/```json\s*([\s\S]*?)\s*```/i);
      if (match) {
        cleanText = match[1];
      }
      
      // Remove any leading/trailing whitespace and parse
      cleanText = cleanText.trim();
      const parsed = JSON.parse(cleanText);
      console.log("✅ Successfully parsed AI response:", parsed);
      return parsed;
    } catch (e) {
      console.error("❌ Failed to parse JSON from AI response:", e.message);
      console.log("Raw response that failed to parse:", raw);
      return null;
    }
  } catch (error) {
    console.error("❌ AI analysis failed:", error.message);
    return null;
  }
};

export async function analyzeComplianceDocument(doc) {
  try {
    console.log("🧩 Starting AI compliance analysis for:", doc.documentName);

    // Helper: Build regulation-specific baseline checks
    const buildBaseline = (regulations) => {
      try {
        const text = String(doc.content || "").toLowerCase();
        const regList = Array.isArray(regulations) ? regulations : [regulations];
        const primaryReg = String(regList[0] || "GDPR").toUpperCase();
        
        // Regulation-specific compliance checks
        const regulationChecks = {
          GDPR: [
            { key: "controller identity and contact", words: ["controller", "contact", "company name", "address"], severity: "high", regulation: "GDPR Art. 13(1)(a)" },
            { key: "data protection officer contact", words: ["data protection officer", "dpo"], severity: "medium", regulation: "GDPR Art. 37-39" },
            { key: "processing purposes and legal basis", words: ["purpose", "processing", "lawful basis", "legal basis"], severity: "high", regulation: "GDPR Art. 13(1)(c)" },
            { key: "categories of personal data", words: ["categories of data", "types of data", "personal information"], severity: "high", regulation: "GDPR Art. 13(1)(d)" },
            { key: "recipients or categories of recipients", words: ["recipient", "third part", "share", "disclose"], severity: "high", regulation: "GDPR Art. 13(1)(e)" },
            { key: "international data transfers", words: ["transfer", "international", "third country", "scc", "standard contractual"], severity: "medium", regulation: "GDPR Art. 13(1)(f)" },
            { key: "data retention periods", words: ["retention", "storage period", "how long", "keep your data"], severity: "high", regulation: "GDPR Art. 13(2)(a)" },
            { key: "data subject rights", words: ["right to access", "right to erasure", "right to rectification", "data portability", "right to object"], severity: "high", regulation: "GDPR Arts. 15-21" },
            { key: "right to lodge complaint", words: ["supervisory authority", "lodge a complaint", "data protection authority"], severity: "medium", regulation: "GDPR Art. 13(2)(d)" },
            { key: "automated decision-making", words: ["automated decision", "profiling", "automated processing"], severity: "low", regulation: "GDPR Art. 22" }
          ],
          CCPA: [
            { key: "categories of personal information collected", words: ["categories", "personal information", "collect"], severity: "high", regulation: "CCPA §1798.100(a)" },
            { key: "sources of personal information", words: ["source", "obtain", "collect from"], severity: "medium", regulation: "CCPA §1798.100(b)" },
            { key: "business or commercial purpose", words: ["purpose", "use", "business purpose"], severity: "high", regulation: "CCPA §1798.100(b)" },
            { key: "categories of third parties", words: ["third part", "share", "disclose", "sell"], severity: "high", regulation: "CCPA §1798.100(d)" },
            { key: "right to know", words: ["right to know", "request disclosure", "access"], severity: "high", regulation: "CCPA §1798.100" },
            { key: "right to delete", words: ["right to delete", "deletion", "remove"], severity: "high", regulation: "CCPA §1798.105" },
            { key: "right to opt-out of sale", words: ["do not sell", "opt-out", "opt out", "sale of personal"], severity: "critical", regulation: "CCPA §1798.120" },
            { key: "right to non-discrimination", words: ["non-discrimination", "discriminate", "exercise your rights"], severity: "high", regulation: "CCPA §1798.125" },
            { key: "authorized agent", words: ["authorized agent", "agent", "designate"], severity: "medium", regulation: "CCPA §1798.135" },
            { key: "contact information for requests", words: ["contact", "submit", "request", "email", "phone"], severity: "high", regulation: "CCPA §1798.130" }
          ],
          DPDPA: [
            { key: "data fiduciary identification", words: ["data fiduciary", "organization", "company name"], severity: "high", regulation: "DPDPA Section 5" },
            { key: "purpose of data processing", words: ["purpose", "process", "use"], severity: "high", regulation: "DPDPA Section 6" },
            { key: "lawful basis for processing", words: ["consent", "lawful", "legal basis"], severity: "high", regulation: "DPDPA Section 6" },
            { key: "data retention and erasure", words: ["retention", "delete", "erase", "how long"], severity: "high", regulation: "DPDPA Section 8" },
            { key: "data principal rights", words: ["right", "access", "correction", "erasure", "data portability"], severity: "high", regulation: "DPDPA Section 11-14" },
            { key: "grievance redressal mechanism", words: ["grievance", "complaint", "redressal"], severity: "high", regulation: "DPDPA Section 15" },
            { key: "data security measures", words: ["security", "protect", "safeguard"], severity: "medium", regulation: "DPDPA Section 8" },
            { key: "cross-border data transfer", words: ["transfer", "cross-border", "outside india"], severity: "medium", regulation: "DPDPA Section 16" },
            { key: "consent withdrawal", words: ["withdraw consent", "opt-out", "stop processing"], severity: "high", regulation: "DPDPA Section 6" }
          ],
          HIPAA: [
            { key: "covered entity identification", words: ["covered entity", "healthcare provider", "organization"], severity: "high", regulation: "HIPAA Privacy Rule §164.520" },
            { key: "uses and disclosures of PHI", words: ["use", "disclosure", "protected health information", "phi"], severity: "critical", regulation: "HIPAA Privacy Rule §164.506" },
            { key: "patient rights", words: ["right to access", "right to amend", "right to accounting"], severity: "high", regulation: "HIPAA Privacy Rule §164.524-528" },
            { key: "minimum necessary standard", words: ["minimum necessary", "least privilege"], severity: "medium", regulation: "HIPAA Privacy Rule §164.502(b)" },
            { key: "business associate agreements", words: ["business associate", "baa", "agreement"], severity: "high", regulation: "HIPAA Privacy Rule §164.502(e)" },
            { key: "security safeguards", words: ["security", "safeguard", "protect", "encrypt"], severity: "critical", regulation: "HIPAA Security Rule §164.306" },
            { key: "breach notification", words: ["breach", "notification", "incident"], severity: "high", regulation: "HIPAA Breach Notification Rule §164.404" },
            { key: "complaint process", words: ["complaint", "file a complaint", "grievance"], severity: "medium", regulation: "HIPAA Privacy Rule §164.530" }
          ]
        };

        // Select appropriate checks based on primary regulation
        const checks = regulationChecks[primaryReg] || regulationChecks.GDPR;
        
        const violations = checks
          .filter((c) => !c.words.some((w) => text.includes(w)))
          .map((c) => ({
            clause: "Missing Section",
            issue: `Missing disclosure: ${c.key}`,
            regulation: c.regulation,
            severity: c.severity,
            suggestion: `Add a clear section covering ${c.key}.`
          }));

        const criticalCount = violations.filter((v) => v.severity === "critical").length;
        const highCount = violations.filter((v) => v.severity === "high").length;
        const score = Math.max(0, 100 - violations.length * 5 - highCount * 8 - criticalCount * 12);
        const risk = score >= 80 ? "low" : score >= 60 ? "medium" : score >= 40 ? "high" : "critical";

        return {
          complianceScore: score,
          riskLevel: risk,
          violations,
          relatedSkills: regList,
        };
      } catch {
        return null;
      }
    };

    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY not found in environment variables");
      return buildBaseline(doc.regulations);
    }

    const regulationsList = Array.isArray(doc.regulations)
      ? doc.regulations.join(", ")
      : String(doc.regulations || "GDPR");
    
    const primaryReg = Array.isArray(doc.regulations) ? doc.regulations[0] : doc.regulations || "GDPR";

    // Regulation-specific guidance for AI
    const regulationGuidance = {
      GDPR: "Focus on GDPR Articles 12-22. Check: controller identity, DPO, purposes, legal basis, data categories, recipients, international transfers, retention, rights (access, erasure, portability, objection), automated decisions, complaint rights.",
      CCPA: "Focus on CCPA §1798.100-135. Check: categories of personal information, sources, business purposes, third parties, right to know, right to delete, DO NOT SELL link, opt-out, non-discrimination, authorized agent, contact information.",
      DPDPA: "Focus on India's DPDPA 2023 Sections 5-16. Check: data fiduciary identification, processing purposes, consent, retention/erasure, data principal rights, grievance mechanism, security measures, cross-border transfers, consent withdrawal.",
      HIPAA: "Focus on HIPAA Privacy & Security Rules. Check: covered entity identity, PHI uses/disclosures, patient rights, minimum necessary, business associate agreements, security safeguards, breach notification, complaint process.",
      SOX: "Focus on Sarbanes-Oxley compliance. Check: financial reporting controls, audit requirements, data retention, disclosure controls.",
      "Contract Law": "Focus on contractual obligations and legal requirements specific to the agreement.",
      "Privacy Law": "Focus on general privacy principles and best practices.",
      "Data Protection": "Focus on data protection principles, security measures, and lawful processing."
    };

    const guidance = regulationGuidance[primaryReg] || regulationGuidance.GDPR;

    const prompt = `You are a compliance auditor specializing in ${regulationsList}. Analyze this ${doc.documentType} for ${regulationsList} compliance ONLY.

Document: ${doc.documentName}
Content: ${doc.content}

${guidance}

Return ONLY valid JSON (no markdown):
{
  "complianceScore": 0-100,
  "riskLevel": "low"|"medium"|"high"|"critical",
  "violations": [
    {
      "clause": "Section name or 'Missing Section'",
      "issue": "Brief ${regulationsList} compliance gap (max 100 chars)",
      "regulation": "${regulationsList} specific citation (e.g., ${primaryReg === 'GDPR' ? 'GDPR Art. 13(1)(a)' : primaryReg === 'CCPA' ? 'CCPA §1798.100' : primaryReg === 'DPDPA' ? 'DPDPA Section 6' : 'HIPAA §164.520'})",
      "severity": "low"|"medium"|"high"|"critical",
      "suggestion": "Concise fix (max 100 chars)"
    }
  ],
  "relatedSkills": ${JSON.stringify(Array.isArray(doc.regulations) ? doc.regulations : [doc.regulations || "GDPR"])}
}

IMPORTANT: Cite ${regulationsList} articles/sections ONLY. Do NOT use GDPR if analyzing ${primaryReg}. Limit to top 8 critical issues. Be concise.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 8192,  // Maximum for Gemini 2.5 Flash - ensures complete responses
          // Some Gemini endpoints expect snake_case; include both for robustness.
          responseMimeType: "application/json",
          response_mime_type: "application/json"
        }
      })
    });

    if (!response.ok) {
      console.error("❌ Gemini API request failed:", response.status, response.statusText);
      const errorText = await response.text();
      console.error("Error details:", errorText);
      return buildBaseline();
    }

    const data = await response.json();
    console.log("📦 Full Gemini API response:", JSON.stringify(data, null, 2));
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error("❌ Invalid response structure from Gemini API");
      console.error("Response data:", JSON.stringify(data, null, 2));
      return buildBaseline();
    }

    // Helper: try to extract JSON from various content shapes
    const parts = data.candidates[0].content.parts || [];
    console.log("📝 Parts from response:", JSON.stringify(parts, null, 2));
    const primaryText = parts.map((p) => p.text || "").join("\n");
    let cleanText = (primaryText || "").trim();
    console.log("📄 Primary text extracted:", cleanText);
    const fenced = cleanText.match(/```json\s*([\s\S]*?)\s*```/i);
    if (fenced) cleanText = fenced[1].trim();
    if (!cleanText || cleanText[0] !== '{') {
      const braceMatch = cleanText.match(/\{[\s\S]*\}/);
      if (braceMatch) cleanText = braceMatch[0];
    }

    try {
      // Check if response was truncated due to token limit
      if (data.candidates[0].finishReason === 'MAX_TOKENS') {
        console.warn("⚠️ WARNING: Response was truncated due to token limit. Results may be incomplete.");
        // Try to fix incomplete JSON by adding closing braces
        if (!cleanText.endsWith('}')) {
          const openBraces = (cleanText.match(/\{/g) || []).length;
          const closeBraces = (cleanText.match(/\}/g) || []).length;
          const openBrackets = (cleanText.match(/\[/g) || []).length;
          const closeBrackets = (cleanText.match(/\]/g) || []).length;
          
          // Close any open arrays first
          for (let i = 0; i < (openBrackets - closeBrackets); i++) {
            cleanText += '\n]';
          }
          // Then close any open objects
          for (let i = 0; i < (openBraces - closeBraces); i++) {
            cleanText += '\n}';
          }
          console.log("🔧 Attempted to fix truncated JSON");
        }
      }
      
      const parsed = JSON.parse(cleanText);

      // Coerce shape to expected schema
      const result = {
        complianceScore: Number(parsed.complianceScore),
        riskLevel: String(parsed.riskLevel || '').toLowerCase(),
        violations: Array.isArray(parsed.violations)
          ? parsed.violations
          : parsed.violations && typeof parsed.violations === 'object'
            ? [parsed.violations]
            : Array.isArray(parsed.recommendations)
              ? parsed.recommendations.map((r) => ({
                  clause: r.clause || r.section || 'Unknown section',
                  issue: r.issue || r.problem || r.description || 'Compliance issue',
                  regulation: r.regulation || r.reference || '',
                  severity: (r.severity || 'medium').toLowerCase(),
                  suggestion: r.suggestion || r.fix || r.action || ''
                }))
              : [],
        relatedSkills: Array.isArray(parsed.relatedSkills) ? parsed.relatedSkills : ["GDPR"]
      };

      if (Number.isNaN(result.complianceScore)) result.complianceScore = 0;
      if (!['low','medium','high','critical'].includes(result.riskLevel)) result.riskLevel = 'medium';

      // Normalize each violation
      result.violations = result.violations
        .filter(Boolean)
        .map((v) => ({
          clause: v.clause || v.section || 'Unknown section',
          issue: v.issue || v.description || 'Compliance issue',
          regulation: v.regulation || '',
          severity: (v.severity || 'medium').toLowerCase(),
          suggestion: v.suggestion || v.recommendation || ''
        }));

      if (
        typeof result.complianceScore === 'number' &&
        result.riskLevel &&
        Array.isArray(result.violations)
      ) {
        return result;
      }
      return buildBaseline();
    } catch (e) {
      console.error("❌ Failed to parse JSON from AI compliance response:", e.message);
      console.log("Raw response that failed to parse:", primaryText);
      return buildBaseline();
    }
  } catch (error) {
    console.error("❌ Compliance analysis failed:", error.message);
    return {
      complianceScore: 0,
      riskLevel: "high",
      violations: [],
      relatedSkills: ["GDPR"],
    };
  }
}

export default analyzeTicket;
