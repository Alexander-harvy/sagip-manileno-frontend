import { useQuery } from "@tanstack/react-query";
import { fetchIncidents } from "../../api/incidents";
import PageState from "@/components/common/PageState";
import { Table } from "../../../../components/layout/ui/Table";

type Incident = {
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

  if (isLoading) return <PageState type="loading" />;
  if (isError) return <PageState type="error" />;
  if (!data || data.length === 0) return <PageState type="empty" />;

  const columns: { header: string; accessor: keyof Incident }[] = [
    { header: "ID", accessor: "incident_id" },
    { header: "Type", accessor: "incident_type" },
    { header: "Description", accessor: "description" },
    { header: "Latitude", accessor: "latitude" },
    { header: "Longitude", accessor: "longitude" },
    { header: "Source", accessor: "source" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Incidents</h1>
      <Table columns={columns} data={data} />
    </div>
  );
}