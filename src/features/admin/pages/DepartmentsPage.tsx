import { Table } from "../../../components/layout/ui/Table";

type Department = {
  id: number;
  name: string;
};

const mockDepartments: Department[] = [
  { id: 1, name: "Fire Department" },
  { id: 2, name: "Medical Services" },
  { id: 3, name: "Police Department" },
];

export default function DepartmentsPage() {
  const columns: { header: string; accessor: keyof Department }[] = [
    { header: "ID", accessor: "id" },
    { header: "Department Name", accessor: "name" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Departments</h1>

      <Table columns={columns} data={mockDepartments} />
    </div>
  );
}