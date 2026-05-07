export const generateResearchSummary = async ({
  patientName,
  disease,
  query,
  location,
  results
}) => {
  const safePatient = patientName || "the user";
  const safeDisease = disease || "the selected condition";
  const safeQuery = query || "the requested topic";

  const publications = results.filter(
    (item) => item.source === "OpenAlex" || item.source === "PubMed"
  );

  const trials = results.filter(
    (item) => item.source === "ClinicalTrials.gov"
  );

  const recentPublications = publications.filter((item) => {
    const year = parseInt(item.year);
    return !isNaN(year) && year >= 2020;
  });

  const recruitingTrials = trials.filter((item) =>
    (item.status || "").toLowerCase().includes("recruiting")
  );

  const topPublicationTitles = publications
    .slice(0, 3)
    .map((item) => item.title)
    .filter(Boolean);

  const topTrialTitles = trials
    .slice(0, 2)
    .map((item) => item.title)
    .filter(Boolean);

  const conditionOverview = `This search is focused on ${safeDisease} for ${safePatient}${location ? ` in ${location}` : ""}. The current topic of interest is "${safeQuery}".`;

  let researchInsights = `A total of ${publications.length} ranked publication results were identified across OpenAlex and PubMed. `;
  if (recentPublications.length > 0) {
    researchInsights += `${recentPublications.length} of these are recent publications from 2020 onward. `;
  }
  if (topPublicationTitles.length > 0) {
    researchInsights += `Top publication signals include: ${topPublicationTitles.join("; ")}.`;
  }

  let clinicalTrialSignals = "";
  if (trials.length > 0) {
    clinicalTrialSignals = `A total of ${trials.length} ranked clinical trial results were identified. `;
    if (recruitingTrials.length > 0) {
      clinicalTrialSignals += `${recruitingTrials.length} trial(s) appear to be recruiting. `;
    }
    if (topTrialTitles.length > 0) {
      clinicalTrialSignals += `Top trial signals include: ${topTrialTitles.join("; ")}.`;
    }
  } else {
    clinicalTrialSignals = "No strong clinical trial signals were identified in the current top-ranked results.";
  }

  let safetyNote =
    "This prototype provides research-backed evidence summaries and should not be used as a substitute for professional medical advice.";

  const lowerQuery = safeQuery.toLowerCase();

  if (
    lowerQuery.includes("vitamin d") ||
    lowerQuery.includes("supplement") ||
    lowerQuery.includes("can i take")
  ) {
    safetyNote =
      `This question appears to be about a supplement or treatment-use decision in the context of ${safeDisease}. The retrieved evidence should be treated as research context only, not as a direct recommendation to take or avoid a product. Clinical guidance is still necessary before acting on it.`;
  }

  return {
    conditionOverview,
    researchInsights,
    clinicalTrialSignals,
    safetyNote
  };
};
