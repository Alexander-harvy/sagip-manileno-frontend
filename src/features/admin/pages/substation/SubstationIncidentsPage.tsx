import { Table } from "..//../../../components/layout/ui/Table";
import { StatusBadge } from "..//../../../components/layout/ui/StatusBadge";
import { useQuery } from "@tanstack/react-query";
import { fetchIncidents } from "../../api/incidents";

export default function SubstationIncidentsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["incidents"],
    queryFn: fetchIncidents,
  });

  const columns = [
    { header: "ID", accessor: "id" },
    { header: "Type", accessor: "type" },
    { header: "Location", accessor: "location" },
    { header: "Status", accessor: "status" },
  ];

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6">Error loading incidents</div>;

  // 🔥 FILTER LOGIC (IMPORTANT)
  const filteredData = (data || []).filter(
    (item: any) => item.assigned_substation_id !== null
  );

  const formattedData = filteredData.map((item: any) => ({
    ...item,
    status: <StatusBadge status={item.status} />,
  }));

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">
        Assigned Incidents (Substation)
      </h1>

      <Table columns={columns} data={formattedData} />
    </div>
  );
}