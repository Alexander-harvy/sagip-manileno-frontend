import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Table } from "../../../../components/layout/ui/Table";
import PageState from "@/components/common/PageState";
import { fetchIncidents } from "../../api/incidents";
import { useDepartments } from "../../api/departments";
import { useResponders } from "../../api/responders";
import { api } from "@/api/axios";

type IncidentRow = {
  incident_id: number;
  incident_type: string;
  description: string;
  latitude: number;
  longitude: number;
  source: string;
  status: string;
};

export default function IncidentsPage() {
  const [selectedIncident, setSelectedIncident] = useState<IncidentRow | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [form, setForm] = useState({
    department_id: "",
    responder_id: "",
  });
  const [assignError, setAssignError] = useState("");

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["incidents"],
    queryFn: fetchIncidents,
  });

  const { data: departments = [] } = useDepartments();
  const { data: responders = [] } = useResponders();
  console.log("responders:", responders);

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedIncident?.incident_id) {
        throw new Error("No incident selected.");
      }

      if (!form.department_id || !form.responder_id) {
        throw new Error("Please select both department and responder.");
      }

      const payload = {
        incident_id: selectedIncident.incident_id,
        department_id: Number(form.department_id),
        responder_id: Number(form.responder_id),
      };

      const res = await api.post("/api/admin/assign", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      setIsAssignOpen(false);
      setSelectedIncident(null);
      setForm({
        department_id: "",
        responder_id: "",
      });
      setAssignError("");
    },
    onError: (error: any) => {
      setAssignError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to assign incident."
      );
    },
  });

  const handleOpenAssign = (incident: IncidentRow) => {
    setSelectedIncident(incident);
    setIsAssignOpen(true);
    setAssignError("");
    setForm({
      department_id: "",
      responder_id: "",
    });
  };

  const handleCloseAssign = () => {
    setIsAssignOpen(false);
    setSelectedIncident(null);
    setAssignError("");
    setForm({
      department_id: "",
      responder_id: "",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (isLoading) {
    return <PageState type="loading" message="Loading incidents..." />;
  }

  if (isError) {
    return <PageState type="error" message="Failed to load incidents." />;
  }

  if (!data || data.length === 0) {
    return <PageState type="empty" message="No incidents found." />;
  }

  const columns = [
    { header: "ID", accessor: "incident_id" },
    { header: "Type", accessor: "incident_type" },
    { header: "Description", accessor: "description" },
    { header: "Latitude", accessor: "latitude" },
    { header: "Longitude", accessor: "longitude" },
    { header: "Source", accessor: "source" },
    { header: "Status", accessor: "status" },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row: IncidentRow) => (
        <button
          onClick={() => handleOpenAssign(row)}
          className="rounded-lg bg-blue-500 px-3 py-1 text-white"
        >
          Assign
        </button>
      ),
    },
  ];

  const formattedData: IncidentRow[] = data.map((item: any) => ({
    incident_id: item.incident_id,
    incident_type: item.incident_type,
    description: item.description,
    latitude: item.latitude,
    longitude: item.longitude,
    source: item.source,
    status: item.status,
  }));

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">Incidents</h1>

      <Table columns={columns} data={formattedData} />

      {isAssignOpen && (
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="w-96 rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <h2 className="mb-2 text-lg font-semibold">Assign Incident</h2>

            <p className="mb-4 text-sm text-gray-500">
              Incident ID: {selectedIncident?.incident_id}
            </p>

            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Department
              </label>
              <select
                name="department_id"
                value={form.department_id}
                onChange={handleChange}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">Select department</option>
                {departments.map((department: any) => (
                  <option
                    key={department.department_id ?? department.id}
                    value={department.department_id ?? department.id}
                  >
                    {department.department_name ?? department.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Responder
              </label>
              <select
                name="responder_id"
                value={form.responder_id}
                onChange={handleChange}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">Select responder</option>
                {responders.map((responder: any) => (
                  <option
                    key={responder.responder_id ?? responder.id}
                    value={responder.responder_id ?? responder.id}
                  >
                    {responder.full_name ??
                      responder.responder_name ??
                      responder.name}
                  </option>
                ))}
              </select>
            </div>

            {assignError && (
              <p className="mb-4 text-sm text-red-600">{assignError}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={handleCloseAssign}
                disabled={assignMutation.isPending}
                className="rounded-lg bg-gray-300 px-4 py-2 text-sm"
              >
                Cancel
              </button>

              <button
                onClick={() => assignMutation.mutate()}
                disabled={assignMutation.isPending}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {assignMutation.isPending ? "Assigning..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}