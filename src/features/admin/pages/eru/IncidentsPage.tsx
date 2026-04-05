import { useQuery } from "@tanstack/react-query";
import { Table } from "../../../../components/layout/ui/Table";
import PageState from "@/components/common/PageState";
import { fetchIncidents } from "../../api/incidents";

type IncidentRow = {
  incident_id: number;
  incident_type: string;
  description: string;
  latitude: number;
  longitude: number;
  source: string;
};

export default function IncidentsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["incidents"],
    queryFn: fetchIncidents,
  });

  if (isLoading) {
    return <PageState type="loading" message="Loading incidents..." />;
  }

  if (isError) {
    return <PageState type="error" message="Failed to load incidents." />;
  }

  if (!data || data.length === 0) {
    return <PageState type="empty" message="No incidents found." />;
  }

  const columns: { header: string; accessor: keyof IncidentRow }[] = [
    { header: "ID", accessor: "incident_id" },
    { header: "Type", accessor: "incident_type" },
    { header: "Description", accessor: "description" },
    { header: "Latitude", accessor: "latitude" },
    { header: "Longitude", accessor: "longitude" },
    { header: "Source", accessor: "source" },
  ];

  const formattedData: IncidentRow[] = data.map((item: any) => ({
    incident_id: item.incident_id,
    incident_type: item.incident_type,
    description: item.description,
    latitude: item.latitude,
    longitude: item.longitude,
    source: item.source,
  }));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Incidents</h1>
      <Table columns={columns} data={formattedData} />
    </div>
  );
}