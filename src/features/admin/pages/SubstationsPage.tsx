import { useMemo } from "react";
import PageState from "@/components/common/PageState";
import { fetchSubstations } from "../api/substations";
import { useQuery } from "@tanstack/react-query";
import { storage } from "../../../utils/storage";

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
  const user = storage.getUser();

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

  return (
    <div className="p-6">
      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-5">
          <h1 className="text-xl font-semibold text-gray-900">Substations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Substations under the currently signed-in department.
          </p>
        </div>

        <div className="p-6">
          {filteredSubstations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
              No substations found for this department.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full border-collapse bg-white text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">ID</th>
                    <th className="px-4 py-3 font-medium">Substation</th>
                    <th className="px-4 py-3 font-medium">Address</th>
                    <th className="px-4 py-3 font-medium">Latitude</th>
                    <th className="px-4 py-3 font-medium">Longitude</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSubstations.map((substation: SubstationRow) => (
                    <tr
                      key={substation.substation_id}
                      className="border-t border-gray-200"
                    >
                      <td className="px-4 py-3">{substation.substation_id}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {substation.substation_name}
                      </td>
                      <td className="px-4 py-3">
                        {substation.address || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {substation.latitude ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        {substation.longitude ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            substation.is_active === 0
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {substation.is_active === 0 ? "Inactive" : "Active"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}