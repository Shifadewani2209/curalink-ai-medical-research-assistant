export const scoreItem = (item, disease, query) => {
  let score = 0;

  const diseaseText = (disease || "").toLowerCase();
  const queryText = (query || "").toLowerCase();

  const title = (item.title || "").toLowerCase();
  const source = (item.source || "").toLowerCase();
  const yearText = String(item.year || "");
  const status = (item.status || "").toLowerCase();
  const conditionText = Array.isArray(item.condition)
    ? item.condition.join(" ").toLowerCase()
    : "";

  const interventionText = Array.isArray(item.intervention)
    ? item.intervention.join(" ").toLowerCase()
    : "";

  if (diseaseText && (title.includes(diseaseText) || conditionText.includes(diseaseText))) {
    score += 40;
  }

  if (
    queryText &&
    (title.includes(queryText) || interventionText.includes(queryText))
  ) {
    score += 30;
  }

  if (source === "pubmed") {
    score += 15;
  }

  if (source === "openalex") {
    score += 10;
  }

  if (source === "clinicaltrials.gov") {
    score += 20;
  }

  const yearNumber = parseInt(yearText);
  if (!isNaN(yearNumber)) {
    if (yearNumber >= 2023) score += 15;
    else if (yearNumber >= 2020) score += 10;
    else if (yearNumber >= 2015) score += 5;
  }

  if (status.includes("recruiting")) {
    score += 15;
  } else if (status.includes("active")) {
    score += 10;
  }

  return score;
};

export const rankAndSelectResults = ({
  openAlexResults,
  pubmedResults,
  clinicalTrials,
  disease,
  query
}) => {
  const rankedOpenAlex = openAlexResults
    .map((item) => ({
      ...item,
      score: scoreItem(item, disease, query)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const rankedPubMed = pubmedResults
    .map((item) => ({
      ...item,
      score: scoreItem(item, disease, query)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const rankedTrials = clinicalTrials
    .map((item) => ({
      ...item,
      score: scoreItem(item, disease, query)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return {
    rankedOpenAlex,
    rankedPubMed,
    rankedTrials
  };
};