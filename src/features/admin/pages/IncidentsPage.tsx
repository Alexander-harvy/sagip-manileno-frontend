import { Table } from "../../../components/layout/ui/Table";
import { StatusBadge } from "../../../components/layout/ui/StatusBadge";
import { useQuery } from "@tanstack/react-query";
import { fetchIncidents } from "../api/incidents";

type Incident = {
  id: number;
  type: string;
  location: string;
  status: string;
  created_at: string;
};

export default function IncidentsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["incidents"],
    queryFn: fetchIncidents,
  });

  const columns = [
    { header: "ID", accessor: "id" },
    { header: "Type", accessor: "type" },
    { header: "Location", accessor: "location" },
    { header: "Status", accessor: "status" },
    { header: "Date", accessor: "created_at" },
  ];

  if (isLoading) return <p className="p-6">Loading...</p>;
  if (error) return <p className="p-6">Error loading data</p>;

  const formattedData = (data || []).map((item: Incident) => ({
    ...item,
    status: <StatusBadge status={item.status} />,
  }));

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Incidents</h1>
      </div>

      <Table columns={columns} data={formattedData} />
    </div>
  );
}