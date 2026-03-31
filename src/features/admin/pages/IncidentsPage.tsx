import { Table } from "../../../components/layout/ui/Table";
import { StatusBadge } from "../../../components/layout/ui/StatusBadge";

type Incident = {
  id: number;
  type: string;
  location: string;
  status: string;

  created_at: string;
};

const mockIncidents: Incident[] = [
  {
    id: 1,
    type: "Fire",
    location: "Tondo, Manila",
    status: "pending",
    created_at: "2026-03-31 10:30",
  },
  {
    id: 2,
    type: "Medical",
    location: "Ermita, Manila",
    status: "assigned",
    created_at: "2026-03-31 09:10",
  },
  {
    id: 3,
    type: "Accident",
    location: "Quiapo, Manila",
    status: "resolved",
    created_at: "2026-03-30 18:45",
  },
];

export default function IncidentsPage() {
  const columns = [
    { header: "ID", accessor: "id" },
    { header: "Type", accessor: "type" },
    { header: "Location", accessor: "location" },
    { header: "Status", accessor: "status" },
    { header: "Date", accessor: "created_at" },
  ];

  const formattedData = mockIncidents.map((item) => ({
    ...item,
    status: <StatusBadge status={item.status} />,
  }));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Incidents</h1>
      </div>

      {/* Table */}
      <Table columns={columns} data={formattedData} />
    </div>
  );
}