import { Table } from "../../../components/layout/ui/Table";
import { StatusBadge } from "../../../components/layout/ui/StatusBadge";

type Responder = {
  id: number;
  name: string;
  department: string;
  status: string;
};

type ResponderRow = {
  id: number;
  name: string;
  department: string;
  status: React.ReactNode;
};

const mockResponders: Responder[] = [
  {
    id: 1,
    name: "Juan Dela Cruz",
    department: "Fire",
    status: "available",
  },
  {
    id: 2,
    name: "Maria Santos",
    department: "Medical",
    status: "busy",
  },
  {
    id: 3,
    name: "Pedro Reyes",
    department: "Police",
    status: "offline",
  },
];

export default function RespondersPage() {
  const columns: { header: string; accessor: keyof ResponderRow }[] = [
    { header: "ID", accessor: "id" },
    { header: "Name", accessor: "name" },
    { header: "Department", accessor: "department" },
    { header: "Status", accessor: "status" },
  ];

  const formattedData: ResponderRow[] = mockResponders.map((item) => ({
    ...item,
    status: <StatusBadge status={item.status} />,
  }));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Responders</h1>

      <Table columns={columns} data={formattedData} />
    </div>
  );
}