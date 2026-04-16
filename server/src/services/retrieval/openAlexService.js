import axios from "axios";

export const fetchOpenAlexResults = async (expandedQueries) => {
  try {
    const allResults = [];

    for (const query of expandedQueries) {
      const response = await axios.get("https://api.openalex.org/works", {
        params: {
          search: query,
          per_page: 3
        }
      });

      const results = response.data.results.map((item, index) => ({
        id: item.id || `${query}-${index}`,
        source: "OpenAlex",
        title: item.title || "No title available",
        year: item.publication_year || "N/A",
        authors:
          item.authorships?.map((author) => author.author?.display_name).filter(Boolean) || [],
        url: item.primary_location?.source?.homepage_url || item.id || "No URL available"
      }));

      allResults.push(...results);
    }

    return allResults;
  } catch (error) {
    console.error("OpenAlex API error:", error.message);
    return [];
  }
};