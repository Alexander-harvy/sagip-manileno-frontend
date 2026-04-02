export const fetchIncidents = async () => {
  const res = await fetch("http://localhost:3000/api/incidents");

  if (!res.ok) {
    throw new Error("Failed to fetch incidents");
  }

  return res.json();
};