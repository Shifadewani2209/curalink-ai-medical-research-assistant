export const expandQuery = ({ disease, query, location }) => {
  const expandedQueries = [
    `${disease} ${query}`,
    `${query} for ${disease}`,
    `latest research on ${disease} ${query}`
  ];

  if (location) {
    expandedQueries.push(`${disease} ${query} in ${location}`);
  }

  return expandedQueries;
};