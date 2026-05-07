import Session from "../models/Session.js";
import { PDFParse } from "pdf-parse";
import { fetchOpenAlexResults } from "./retrieval/openAlexService.js";
import { fetchPubMedResults } from "./retrieval/pubmedService.js";
import { fetchClinicalTrials } from "./retrieval/clinicalTrialsService.js";
import { rankResults } from "./ranking/rankResults.js";

function buildExpandedQueries({ disease, query, location, followUpMessage }) {
  const baseQuery = followUpMessage?.trim()
    ? `${followUpMessage} ${disease || ""} ${location || ""}`.trim()
    : `${disease || ""} ${query || ""} ${location || ""}`.trim();

  if (!baseQuery) return [];

  const items = [
    baseQuery,
    `${disease || ""} ${query || ""}`.trim(),
    `${disease || ""} treatment latest evidence`.trim(),
    `${disease || ""} clinical trials ${location || ""}`.trim(),
    `${query || ""} publications ${disease || ""}`.trim()
  ].filter(Boolean);

  return [...new Set(items)];
}

const isDbConnected = () => Session.db.readyState === 1;

function normalizeOpenAlex(items) {
  return (items || []).map((item) => ({
    id: item.id || item.url || Math.random().toString(36).slice(2),
    title: item.title || "Untitled publication",
    year: item.year || "N/A",
    authors: Array.isArray(item.authors) ? item.authors : [],
    url: item.url || "#",
    source: "OpenAlex",
    score: item.score ?? 0
  }));
}

function normalizePubMed(items) {
  return (items || []).map((item) => ({
    id: item.id || item.url || Math.random().toString(36).slice(2),
    title: item.title || "Untitled publication",
    year: item.year || "N/A",
    authors: Array.isArray(item.authors) ? item.authors : [],
    url: item.url || "#",
    source: "PubMed",
    score: item.score ?? 0
  }));
}

function normalizeTrials(items) {
  return (items || []).map((item) => ({
    id: item.id || item.url || Math.random().toString(36).slice(2),
    title: item.title || "Untitled trial",
    phase: item.phase || "N/A",
    status: item.status || "Unknown",
    location: item.location || "N/A",
    condition: Array.isArray(item.condition) ? item.condition : [],
    intervention: Array.isArray(item.intervention) ? item.intervention : [],
    url: item.url || "#",
    source: "ClinicalTrials",
    score: item.score ?? 0
  }));
}

function buildOneLineAnswer({ disease, query, topPaper, topTrial }) {
  const question = (query || disease || "this topic").trim();
  const normalizedQuestion = question.toLowerCase();
  const asksCanOrShould =
    /^(can|should|is it safe|is it okay|do i|does|will|would|could)\b/.test(normalizedQuestion) ||
    /\b(can i|should i|safe to|okay to|recommend|take|use)\b/.test(normalizedQuestion);

  if (topPaper) {
    if (asksCanOrShould) {
      return `Suggestion: Do not decide from this alone; discuss ${question} with a clinician, because the strongest result I found is "${topPaper.title}".`;
    }

    return `Yes: I found relevant evidence for ${question}, led by "${topPaper.title}" from ${topPaper.source}.`;
  }

  if (topTrial) {
    return `Suggestion: There is trial activity for ${question}, especially "${topTrial.title}", but publication evidence looks limited in this search.`;
  }

  return `No: I did not find strong publication or clinical trial evidence for ${question} in this search.`;
}

function buildStructuredResponse({
  disease,
  query,
  location,
  publications,
  pubmedPublications,
  clinicalTrials,
  retrievalStats
}) {
  const topPaper = publications[0] || pubmedPublications[0];
  const topTrial = clinicalTrials[0];
  const oneLineAnswer = buildOneLineAnswer({
    disease,
    query,
    topPaper,
    topTrial
  });

  return {
    oneLineAnswer,

    conditionOverview: disease
      ? `${disease} was researched using publication and clinical trial sources${location ? ` with location context for ${location}` : ""}.`
      : "Condition overview not available.",

    researchInsights: topPaper
      ? `Top evidence includes "${topPaper.title}" from ${topPaper.source}${topPaper.year ? ` (${topPaper.year})` : ""}.`
      : "No strong publication insight was available.",

    clinicalTrialSignals: topTrial
      ? `Top trial signal includes "${topTrial.title}" with status "${topTrial.status}"${topTrial.phase ? ` and phase "${topTrial.phase}"` : ""}.`
      : "No strong clinical trial signal was available.",

    safetyNote: `This workspace is for research support only. It does not provide diagnosis or treatment advice for ${query || disease || "this topic"}.`,

    publications,
    pubmedPublications,
    clinicalTrials,
    retrievalStats
  };
}

async function safeFetch(label, fn) {
  try {
    const data = await fn();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`${label} error:`, error.message || error);
    return [];
  }
}

async function extractTextFromUpload({ contentBase64, mimeType = "", fileName = "" }) {
  if (!contentBase64) {
    throw new Error("No report content received");
  }

  const buffer = Buffer.from(contentBase64, "base64");
  const normalizedMime = mimeType.toLowerCase();
  const normalizedName = fileName.toLowerCase();

  if (normalizedMime.includes("pdf") || normalizedName.endsWith(".pdf")) {
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();
      return result.text || "";
    } finally {
      await parser.destroy();
    }
  }

  return buffer.toString("utf8");
}

function buildReportSuggestions(reportText) {
  const compactText = reportText.replace(/\s+/g, " ").trim();
  const lowerText = compactText.toLowerCase();
  const abnormalTerms = [
    "high",
    "low",
    "positive",
    "elevated",
    "reduced",
    "abnormal",
    "critical",
    "deficient",
    "detected"
  ];
  const abnormalHits = abnormalTerms.filter((term) => lowerText.includes(term));
  const possibleLabValues =
    compactText.match(/\b[A-Za-z][A-Za-z0-9 ()/%.-]{1,28}\s*[:=-]\s*[<>]?\s*\d+(?:\.\d+)?\s*[A-Za-z/%]*\b/g) || [];
  const possibleMedications =
    compactText.match(/\b(?:tablet|tab|capsule|cap|mg|mcg|insulin|metformin|levodopa|aspirin|statin|antibiotic)\b[^.]{0,80}/gi) || [];

  const keyFindings = [
    possibleLabValues.length
      ? `Detected possible lab values: ${possibleLabValues.slice(0, 6).join("; ")}.`
      : "No clear lab values were detected from the uploaded text.",
    abnormalHits.length
      ? `Flag words found: ${[...new Set(abnormalHits)].join(", ")}.`
      : "No obvious abnormal flag words were detected.",
    possibleMedications.length
      ? `Possible medication mentions: ${possibleMedications.slice(0, 3).join("; ")}.`
      : "No clear medication mentions were detected."
  ];

  const practicalSuggestions = [
    "Suggestion: Share the full report with a qualified clinician, especially any values marked high, low, positive, elevated, or abnormal.",
    "Suggestion: Compare each flagged value with the reference range printed on the report, because ranges differ by lab, age, sex, and condition.",
    "Suggestion: If the report contains critical values, chest pain, severe breathlessness, fainting, stroke symptoms, or very high fever, seek urgent medical care."
  ];

  return {
    keyFindings,
    practicalSuggestions,
    abnormalHits,
    possibleLabValues
  };
}

export async function analyzeReportUpload({
  fileName,
  mimeType,
  contentBase64,
  patientName,
  disease,
  location
}) {
  const reportText = await extractTextFromUpload({ contentBase64, mimeType, fileName });
  const clippedReportText = reportText.replace(/\s+/g, " ").trim().slice(0, 12000);

  if (!clippedReportText) {
    throw new Error("Could not read text from this report. Try uploading a text-based PDF or .txt report.");
  }

  const reportAnalysis = buildReportSuggestions(clippedReportText);
  const reportFindings = reportAnalysis.keyFindings.join(" ");
  const query = `${disease || "medical report"} ${reportAnalysis.abnormalHits.join(" ")} ${reportAnalysis.possibleLabValues.slice(0, 3).join(" ")}`.trim();
  const expandedQueries = buildExpandedQueries({
    disease: disease || "medical report",
    query,
    location,
    followUpMessage: ""
  });

  const oneLineAnswer = reportAnalysis.abnormalHits.length
    ? `Suggestion: This report has possible flagged terms (${[...new Set(reportAnalysis.abnormalHits)].join(", ")}); review these values with a clinician.`
    : "Suggestion: I did not detect obvious abnormal flags, but a clinician should confirm the report against its reference ranges.";

  return {
    success: true,
    message: "Report analyzed successfully",
    sessionId: `report-${Date.now()}`,
    expandedQueries,
    usedContext: {
      patientName: patientName || "Unknown",
      disease: disease || "Uploaded medical report",
      query,
      location: location || ""
    },
    finalProcessedQuery: `Uploaded report: ${fileName || "medical report"}`,
    structuredResponse: {
      oneLineAnswer,
      conditionOverview: `I read the uploaded report text${disease ? ` in the context of ${disease}` : ""}. Extracted preview: ${clippedReportText.slice(0, 500)}${clippedReportText.length > 500 ? "..." : ""}`,
      researchInsights: reportFindings,
      clinicalTrialSignals: "Report analysis does not replace clinical interpretation. Use related research only for background evidence.",
      safetyNote: reportAnalysis.practicalSuggestions.join(" "),
      publications: [],
      pubmedPublications: [],
      clinicalTrials: [],
      retrievalStats: {
        openAlexRetrieved: 0,
        pubmedRetrieved: 0,
        clinicalTrialsRetrieved: 0,
        openAlexShown: 0,
        pubmedShown: 0,
        clinicalTrialsShown: 0
      }
    }
  };
}

export async function processResearchQuery({
  sessionId,
  patientName,
  disease,
  query,
  location,
  followUpMessage
}) {
  const canUseSessionStorage = isDbConnected();
  let activeDisease = disease || "";
  let activeQuery = query || "";
  let activeLocation = location || "";
  let session = null;

  if (canUseSessionStorage && sessionId && Session.db.base.Types.ObjectId.isValid(sessionId)) {
    session = await Session.findById(sessionId);
    if (session) {
      activeDisease = activeDisease || session.activeCondition || "";
      activeQuery = activeQuery || session.activeQuery || "";
      activeLocation = activeLocation || session.activeLocation || "";
    }
  }

  if (followUpMessage?.trim()) {
    activeQuery = followUpMessage.trim();
  }

  const expandedQueries = buildExpandedQueries({
    disease: activeDisease,
    query: activeQuery,
    location: activeLocation,
    followUpMessage
  });

  const searchText =
    expandedQueries[0] ||
    `${activeDisease} ${activeQuery} ${activeLocation}`.trim();

  const [openAlexRaw, pubMedRaw, trialsRaw] = await Promise.all([
    safeFetch("OpenAlex", () => fetchOpenAlexResults(searchText)),
    safeFetch("PubMed", () => fetchPubMedResults(searchText)),
    safeFetch("ClinicalTrials", () => fetchClinicalTrials(searchText, activeLocation))
  ]);

  const rankedOpenAlex = rankResults(
    normalizeOpenAlex(openAlexRaw),
    activeDisease,
    activeQuery
  ).slice(0, 8);

  const rankedPubMed = rankResults(
    normalizePubMed(pubMedRaw),
    activeDisease,
    activeQuery
  ).slice(0, 8);

  const rankedTrials = rankResults(
    normalizeTrials(trialsRaw),
    activeDisease,
    activeQuery
  ).slice(0, 6);

  const retrievalStats = {
    openAlexRetrieved: openAlexRaw.length,
    pubmedRetrieved: pubMedRaw.length,
    clinicalTrialsRetrieved: trialsRaw.length,
    openAlexShown: rankedOpenAlex.length,
    pubmedShown: rankedPubMed.length,
    clinicalTrialsShown: rankedTrials.length
  };

  const structuredResponse = buildStructuredResponse({
    disease: activeDisease,
    query: activeQuery,
    location: activeLocation,
    publications: rankedOpenAlex,
    pubmedPublications: rankedPubMed,
    clinicalTrials: rankedTrials,
    retrievalStats
  });

  if (canUseSessionStorage && !session) {
    session = new Session({
      patientName: patientName || "Unknown",
      activeCondition: activeDisease,
      activeQuery: activeQuery,
      activeLocation: activeLocation,
      messages: []
    });
  } else if (session) {
    session.patientName = patientName || session.patientName || "Unknown";
    session.activeCondition = activeDisease;
    session.activeQuery = activeQuery;
    session.activeLocation = activeLocation;
  }

  if (session) {
    if (!Array.isArray(session.messages)) {
      session.messages = [];
    }

    session.messages.push({
      role: "user",
      content: followUpMessage?.trim() || activeQuery || searchText,
      createdAt: new Date()
    });

  session.messages.push({
    role: "assistant",
    content: structuredResponse.oneLineAnswer,
    createdAt: new Date()
  });

    await session.save();
  }

  return {
    success: true,
    message: "Research request processed successfully",
    sessionId: session?._id || sessionId || `local-${Date.now()}`,
    expandedQueries,
    usedContext: {
      patientName: session?.patientName || patientName || "Unknown",
      disease: session?.activeCondition || activeDisease,
      query: session?.activeQuery || activeQuery,
      location: session?.activeLocation || activeLocation
    },
    finalProcessedQuery: searchText,
    structuredResponse
  };
}
