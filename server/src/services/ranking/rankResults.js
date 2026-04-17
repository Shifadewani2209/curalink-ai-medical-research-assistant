export function rankResults(items = [], disease = "", query = "") {
  const diseaseLower = (disease || "").toLowerCase();
  const queryLower = (query || "").toLowerCase();

  return items
    .map((item) => {
      let score = Number(item.score || 0);

      const title = (item.title || "").toLowerCase();
      const text =
        [
          item.title || "",
          ...(item.authors || []),
          ...(item.condition || []),
          ...(item.intervention || [])
        ]
          .join(" ")
          .toLowerCase();

      if (diseaseLower && text.includes(diseaseLower)) score += 30;
      if (queryLower && text.includes(queryLower)) score += 20;

      if (item.source === "PubMed") score += 8;
      if (item.source === "OpenAlex") score += 6;
      if (item.source === "ClinicalTrials") score += 10;

      if (item.status) {
        const status = item.status.toLowerCase();
        if (status.includes("recruiting")) score += 12;
        else if (status.includes("active")) score += 8;
        else if (status.includes("completed")) score += 5;
      }

      if (item.year && item.year !== "N/A") {
        const yearNum = Number(item.year);
        if (!Number.isNaN(yearNum)) {
          score += Math.max(0, yearNum - 2015);
        }
      }

      return {
        ...item,
        score
      };
    })
    .sort((a, b) => b.score - a.score);
}