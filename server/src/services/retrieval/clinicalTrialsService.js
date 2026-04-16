import axios from "axios";

const fetchPubMedPublicationsByNctId = async (nctId) => {
  try {
    const searchResponse = await axios.get(
      "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi",
      {
        params: {
          db: "pubmed",
          term: `${nctId}[si] OR ${nctId}[tw]`,
          retmode: "json",
          retmax: 3
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
        pmid,
        title: item?.title || "No title available",
        authors: item?.authors?.map((a) => a.name) || [],
        year: item?.pubdate || "N/A",
        source: "PubMed",
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
      };
    });
  } catch (error) {
    console.error(`PubMed publication fetch failed for ${nctId}:`, error.message);
    return [];
  }
};

export const fetchClinicalTrialsResults = async ({ disease, query, location }) => {
  try {
    const searchText = [disease, query].filter(Boolean).join(" ").trim();

    const response = await axios.get("https://clinicaltrials.gov/api/v2/studies", {
      params: {
        "query.term": searchText,
        pageSize: 5
      }
    });

    const studies = response.data?.studies || [];

    const filteredStudies = studies.filter((study) => {
      if (!location) return true;

      const locations =
        study?.protocolSection?.contactsLocationsModule?.locations || [];

      return locations.some((loc) => {
        const city = (loc.city || "").toLowerCase();
        const country = (loc.country || "").toLowerCase();
        const facility = (loc.facility || "").toLowerCase();
        const userLocation = location.toLowerCase();

        return (
          city.includes(userLocation) ||
          country.includes(userLocation) ||
          facility.includes(userLocation)
        );
      });
    });

    const selectedStudies = filteredStudies.length > 0 ? filteredStudies : studies;

    const trialsWithPublications = await Promise.all(
      selectedStudies.slice(0, 5).map(async (study, index) => {
        const protocol = study?.protocolSection || {};
        const identification = protocol?.identificationModule || {};
        const conditionsModule = protocol?.conditionsModule || {};
        const armsModule = protocol?.armsInterventionsModule || {};
        const statusModule = protocol?.statusModule || {};
        const designModule = protocol?.designModule || {};
        const contactsModule = protocol?.contactsLocationsModule || {};

        const nctId = identification?.nctId || `trial-${index}`;

        const interventions =
          armsModule?.interventions?.map((item) => item.name).filter(Boolean) || [];

        const locations = contactsModule?.locations || [];
        const firstLocation = locations[0];

        const publications = await fetchPubMedPublicationsByNctId(nctId);

        return {
          id: nctId,
          source: "ClinicalTrials.gov",
          title: identification?.briefTitle || "No title available",
          condition: conditionsModule?.conditions || [],
          intervention: interventions,
          status: statusModule?.overallStatus || "N/A",
          phase:
            Array.isArray(designModule?.phases) && designModule.phases.length > 0
              ? designModule.phases.join(", ")
              : "N/A",
          location: firstLocation
            ? `${firstLocation.city || ""} ${firstLocation.country || ""}`.trim()
            : "N/A",
          url: `https://clinicaltrials.gov/study/${nctId}`,
          publications
        };
      })
    );

    return trialsWithPublications;
  } catch (error) {
    console.error(
      "ClinicalTrials.gov v2 API error:",
      error.response?.data || error.message
    );
    return [];
  }
};