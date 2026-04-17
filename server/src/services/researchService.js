import Session from "../models/Session.js";
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

  return {
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

export async function processResearchQuery({
  sessionId,
  patientName,
  disease,
  query,
  location,
  followUpMessage
}) {
  let activeDisease = disease || "";
  let activeQuery = query || "";
  let activeLocation = location || "";
  let session = null;

  if (sessionId) {
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

  if (!session) {
    session = new Session({
      patientName: patientName || "Unknown",
      activeCondition: activeDisease,
      activeQuery: activeQuery,
      activeLocation: activeLocation,
      messages: []
    });
  } else {
    session.patientName = patientName || session.patientName || "Unknown";
    session.activeCondition = activeDisease;
    session.activeQuery = activeQuery;
    session.activeLocation = activeLocation;
  }

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
    content: structuredResponse.researchInsights,
    createdAt: new Date()
  });

  await session.save();

  return {
    success: true,
    message: "Research request processed successfully",
    sessionId: session._id,
    expandedQueries,
    usedContext: {
      patientName: session.patientName,
      disease: session.activeCondition,
      query: session.activeQuery,
      location: session.activeLocation
    },
    finalProcessedQuery: searchText,
    structuredResponse
  };
}