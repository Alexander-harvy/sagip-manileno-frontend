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
  location_name?: string;
  source: string;
  status: string;
  substation_id?: number | null;
  substation_name?: string | null;
};

export default function IncidentsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["incidents"],
    queryFn: fetchIncidents,
  });

  if (isLoading) {
    return <PageState type="loading" message="Loading assigned incidents..." />;
  }

  if (isError) {
    return <PageState type="error" message="Failed to load assigned incidents." />;
  }

  const assignedIncidents: IncidentRow[] = (data ?? [])
    .filter(
      (item: any) =>
        item.substation_id ||
        item.status?.toLowerCase() === "assigned_to_substation" ||
        item.status?.toLowerCase() === "assigned"
    )
    .map((item: any) => ({
      incident_id: item.incident_id,
      incident_type: item.incident_type,
      description: item.description,
      latitude: item.latitude,
      longitude: item.longitude,
      location_name: item.location_name,
      source: item.source,
      status: item.status,
      substation_id: item.substation_id ?? null,
      substation_name: item.substation_name ?? null,
    }));

  if (assignedIncidents.length === 0) {
    return <PageState type="empty" message="No assigned incidents found." />;
  }

  const columns = [
    { header: "ID", accessor: "incident_id" },
    { header: "Type", accessor: "incident_type" },
    { header: "Description", accessor: "description" },
    {
      header: "Location",
      accessor: "location_name",
      cell: (row: IncidentRow) =>
        row.location_name || `${row.latitude}, ${row.longitude}`,
    },
    { header: "Source", accessor: "source" },
    { header: "Status", accessor: "status" },
    {
      header: "Assigned To",
      accessor: "substation_name",
      cell: (row: IncidentRow) => row.substation_name || "Not assigned",
    },
  ];

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">Assigned Incidents</h1>
      <Table columns={columns} data={assignedIncidents} />
    </div>
  );
}