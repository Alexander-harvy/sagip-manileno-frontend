import { useMemo } from "react";
import PageState from "@/components/common/PageState";
import { fetchSubstations } from "../api/substations";
import { useQuery } from "@tanstack/react-query";
import { storage } from "../../../utils/storage";
import { Table } from "../../../components/layout/ui/Table";

type SubstationRow = {
  substation_id: number;
  department_id?: number;
  dept_id?: number;
  department_name?: string;
  substation_name: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  is_active?: number;
};

export default function SubstationsPage() {
  const user = storage.getUser() as any;

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["substations"],
    queryFn: fetchSubstations,
  });

  const userDepartmentId =
    user?.department_id ?? user?.dept_id ?? user?.departmentId ?? null;

  const filteredSubstations = useMemo(() => {
    if (!userDepartmentId) return data;

    return data.filter((item: SubstationRow) => {
      const substationDeptId = item.department_id ?? item.dept_id;
      return Number(substationDeptId) === Number(userDepartmentId);
    });
  }, [data, userDepartmentId]);

  if (isLoading) {
    return <PageState type="loading" message="Loading substations..." />;
  }

  if (isError) {
    return <PageState type="error" message="Failed to load substations." />;
  }

  if (!filteredSubstations.length) {
    return <PageState type="empty" message="No substations found." />;
  }

  const columns = [
    { header: "Substation Name", accessor: "substation_name" },
    { header: "Address", accessor: "address" },
    { header: "Department ID", accessor: "dept_id" },
  ];

  const formattedData = filteredSubstations.map((item: SubstationRow) => ({
    substation_name: item.substation_name,
    address: item.address || "-",
    dept_id: item.department_id ?? item.dept_id,
  }));

  return (
    <div className="min-h-screen bg-white p-6 select-none">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Substations
        </h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table columns={columns} data={formattedData} />
      </div>
    </div>
  );
}