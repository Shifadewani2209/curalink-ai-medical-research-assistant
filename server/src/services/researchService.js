import { expandQuery } from "./query/expandQuery.js";
import { fetchOpenAlexResults } from "./retrieval/openAlexService.js";
import { fetchClinicalTrialsResults } from "./retrieval/clinicalTrialsService.js";
import { fetchPubMedResults } from "./retrieval/pubmedService.js";
import { generateResearchSummary } from "./llm/ollamaService.js";
import { rankAndSelectResults } from "./ranking/rankResults.js";
import Session from "../models/Session.js";

export const processResearchQuery = async ({
  sessionId,
  patientName,
  disease,
  query,
  location
}) => {
  let session = null;

  if (sessionId) {
    session = await Session.findById(sessionId);
  }

  if (!session) {
    session = await Session.create({
      activeCondition: disease || "",
      activeQuery: query || "",
      activeLocation: location || ""
    });
  }

  const finalDisease = disease || session.activeCondition;
  const finalQuery = query || session.activeQuery;
  const finalLocation = location || session.activeLocation;

  session.activeCondition = finalDisease || "";
  session.activeQuery = finalQuery || "";
  session.activeLocation = finalLocation || "";
  await session.save();

  const expandedQueries = expandQuery({
    disease: finalDisease,
    query: finalQuery,
    location: finalLocation
  });

  const openAlexResults = await fetchOpenAlexResults(expandedQueries);
  const pubmedResults = await fetchPubMedResults({
    disease: finalDisease,
    query: finalQuery
  });
  const clinicalTrials = await fetchClinicalTrialsResults({
    disease: finalDisease,
    query: finalQuery,
    location: finalLocation
  });

  const { rankedOpenAlex, rankedPubMed, rankedTrials } = rankAndSelectResults({
    openAlexResults,
    pubmedResults,
    clinicalTrials,
    disease: finalDisease,
    query: finalQuery
  });

  const combinedTopEvidence = [
    ...rankedOpenAlex,
    ...rankedPubMed,
    ...rankedTrials
  ];

  const summarySections = await generateResearchSummary({
    patientName,
    disease: finalDisease,
    query: finalQuery,
    location: finalLocation,
    results: combinedTopEvidence
  });

  const structuredResponse = {
    conditionOverview: summarySections.conditionOverview,
    researchInsights: summarySections.researchInsights,
    clinicalTrialSignals: summarySections.clinicalTrialSignals,
    safetyNote: summarySections.safetyNote,
    publications: rankedOpenAlex,
    pubmedPublications: rankedPubMed,
    clinicalTrials: rankedTrials,
    retrievalStats: {
      openAlexRetrieved: openAlexResults.length,
      pubmedRetrieved: pubmedResults.length,
      clinicalTrialsRetrieved: clinicalTrials.length,
      openAlexShown: rankedOpenAlex.length,
      pubmedShown: rankedPubMed.length,
      clinicalTrialsShown: rankedTrials.length
    }
  };

  return {
    success: true,
    message: "Research request processed successfully",
    sessionId: session._id.toString(),
    usedContext: {
      disease: finalDisease,
      query: finalQuery,
      location: finalLocation
    },
    receivedData: {
      patientName,
      disease,
      query,
      location
    },
    expandedQueries,
    structuredResponse
  };
};