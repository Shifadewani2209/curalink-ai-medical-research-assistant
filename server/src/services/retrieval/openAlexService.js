export async function fetchOpenAlexResults(query) {
  if (!query) return [];

  const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=10`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "CuraLinkAI/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`OpenAlex failed with status ${response.status}`);
  }

  const data = await response.json();
  const results = data?.results || [];

  return results.map((item) => ({
    id: item.id,
    title: item.title || "Untitled",
    year: item.publication_year || "N/A",
    authors: (item.authorships || []).map((a) => a.author?.display_name).filter(Boolean),
    url: item.primary_location?.landing_page_url || item.id,
    score: item.cited_by_count || 0,
    source: "OpenAlex"
  }));
}