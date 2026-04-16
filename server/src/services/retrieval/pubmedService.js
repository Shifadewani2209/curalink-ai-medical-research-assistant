import axios from "axios";

export const fetchPubMedResults = async ({ disease, query }) => {
  try {
    const searchText = [disease, query].filter(Boolean).join(" ").trim();

    if (!searchText) {
      return [];
    }

    const searchResponse = await axios.get(
      "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi",
      {
        params: {
          db: "pubmed",
          term: searchText,
          retmode: "json",
          retmax: 5
        }
      }
    );

    const pubmedIds = searchResponse.data?.esearchresult?.idlist || [];

    if (!pubmedIds.length) {
      return [];
    }

    const summaryResponse = await axios.get(
      "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi",
      {
        params: {
          db: "pubmed",
          id: pubmedIds.join(","),
          retmode: "json"
        }
      }
    );

    const result = summaryResponse.data?.result || {};

    return pubmedIds.map((pmid) => {
      const item = result[pmid];

      return {
        id: pmid,
        source: "PubMed",
        title: item?.title || "No title available",
        authors: item?.authors?.map((a) => a.name) || [],
        year: item?.pubdate || "N/A",
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
      };
    });
  } catch (error) {
    console.error("PubMed API error:", error.message);
    return [];
  }
};