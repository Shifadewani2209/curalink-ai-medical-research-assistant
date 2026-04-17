export async function fetchClinicalTrials(query, location = "") {
  const term = `${query || ""} ${location || ""}`.trim();
  if (!term) return [];

  const url =
    `https://clinicaltrials.gov/api/v2/studies` +
    `?query.term=${encodeURIComponent(term)}` +
    `&pageSize=10` +
    `&format=json`;

  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "user-agent": "CuraLinkAI/1.0"
      }
    });

    if (!response.ok) {
      console.error(`ClinicalTrials failed with status ${response.status}`);
      return [];
    }

    const data = await response.json();
    const studies = data?.studies || [];

    return studies.map((study) => {
      const protocol = study?.protocolSection || {};
      const idModule = protocol?.identificationModule || {};
      const statusModule = protocol?.statusModule || {};
      const designModule = protocol?.designModule || {};
      const conditionsModule = protocol?.conditionsModule || {};
      const armsModule = protocol?.armsInterventionsModule || {};
      const contactsLocationsModule = protocol?.contactsLocationsModule || {};

      const nctId = idModule?.nctId || "";
      const title =
        idModule?.briefTitle ||
        protocol?.descriptionModule?.briefSummary ||
        "Untitled trial";

      const conditions = conditionsModule?.conditions || [];
      const interventions =
        (armsModule?.interventions || []).map((i) => i?.name).filter(Boolean);

      const locations =
        (contactsLocationsModule?.locations || [])
          .map((loc) =>
            [loc?.city, loc?.state, loc?.country].filter(Boolean).join(", ")
          )
          .filter(Boolean);

      return {
        id: nctId || Math.random().toString(36).slice(2),
        title,
        condition: conditions,
        intervention: interventions,
        phase: Array.isArray(designModule?.phases)
          ? designModule.phases.join(", ")
          : designModule?.phases || "N/A",
        status: statusModule?.overallStatus || "Unknown",
        location: locations[0] || "N/A",
        url: nctId ? `https://clinicaltrials.gov/study/${nctId}` : "#",
        source: "ClinicalTrials",
        score: 0
      };
    });
  } catch (error) {
    console.error("ClinicalTrials error:", error.message || error);
    return [];
  }
}