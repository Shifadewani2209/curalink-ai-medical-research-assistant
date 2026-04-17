export async function fetchPubMedResults(query) {
  if (!query) return [];

  const cleanedQuery = String(query)
    .replace(/\b(Toronto|Canada|India|Pune|Mumbai|Delhi)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const fallbackQueries = [
    cleanedQuery,
    cleanedQuery.replace(/for\s+/gi, " ").trim(),
    cleanedQuery.split(" ").slice(0, 6).join(" ").trim(),
    cleanedQuery
      .replace(/[^a-zA-Z0-9\s'-]/g, " ")
      .split(" ")
      .filter(Boolean)
      .slice(0, 4)
      .join(" ")
      .trim()
  ].filter(Boolean);

  for (const searchTerm of [...new Set(fallbackQueries)]) {
    try {
      const searchUrl =
        `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi` +
        `?db=pubmed` +
        `&term=${encodeURIComponent(searchTerm)}` +
        `&retmode=json` +
        `&retmax=8` +
        `&sort=relevance`;

      const searchResponse = await fetch(searchUrl, {
        headers: {
          accept: "application/json",
          "user-agent": "CuraLinkAI/1.0"
        }
      });

      if (!searchResponse.ok) {
        console.error(`PubMed search failed with status ${searchResponse.status}`);
        continue;
      }

      const searchData = await searchResponse.json();
      const ids = searchData?.esearchresult?.idlist || [];

      if (!ids.length) {
        console.error("PubMed returned no IDs for query:", searchTerm);
        continue;
      }

      const summaryUrl =
        `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi` +
        `?db=pubmed` +
        `&id=${ids.join(",")}` +
        `&retmode=json`;

      const summaryResponse = await fetch(summaryUrl, {
        headers: {
          accept: "application/json",
          "user-agent": "CuraLinkAI/1.0"
        }
      });

      if (!summaryResponse.ok) {
        console.error(`PubMed summary failed with status ${summaryResponse.status}`);
        continue;
      }

      const summaryData = await summaryResponse.json();

      const results = ids
        .map((id) => {
          const item = summaryData?.result?.[id];
          if (!item) return null;

          return {
            id,
            title: item.title || "Untitled publication",
            year: item.pubdate ? String(item.pubdate).slice(0, 4) : "N/A",
            authors: Array.isArray(item.authors)
              ? item.authors.map((a) => a?.name).filter(Boolean)
              : [],
            url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
            source: "PubMed",
            score: 0
          };
        })
        .filter(Boolean);

      console.error("PubMed fetched:", results.length, "using query:", searchTerm);
      return results;
    } catch (error) {
      console.error("PubMed error:", error.message || error);
    }
  }

  return [];
}