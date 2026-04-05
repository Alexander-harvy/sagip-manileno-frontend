import { Table } from "../../../components/layout/ui/Table";
import PageState from "@/components/common/PageState";
import { useDepartments } from "../api/departments";

type DepartmentRow = {
  dept_id: number;
  dept_name: string;
};

export default function DepartmentsPage() {
  const { data, isLoading, isError } = useDepartments();

  if (isLoading) {
    return <PageState type="loading" message="Loading departments..." />;
  }

  if (isError) {
    return <PageState type="error" message="Failed to load departments." />;
  }

  if (!data || data.length === 0) {
    return <PageState type="empty" message="No departments found." />;
  }

  const columns: { header: string; accessor: keyof DepartmentRow }[] = [
    { header: "ID", accessor: "dept_id" },
    { header: "Department Name", accessor: "dept_name" },
  ];

  const formattedData: DepartmentRow[] = data.map((item: any) => ({
    dept_id: item.dept_id,
    dept_name: item.dept_name,
  }));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Departments</h1>
      <Table columns={columns} data={formattedData} />
    </div>
  );
}