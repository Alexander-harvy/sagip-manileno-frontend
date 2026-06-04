import { useState } from "react";
import type { ReactNode } from "react";
import { Table } from "../../../components/layout/ui/Table";
import PageState from "@/components/common/PageState";
import { useResponders } from "../api/responders";

type Responder = {
  responder_id: number;
  dept_id: number;
  substation_id?: number;
  substation_name?: string;
  address?: string;
  employee_no?: string;
  username?: string;
  first_name: string;
  last_name: string;
  contact_no: string;
  is_team_leader: number;
  team_leader_id: number | null;
};

type ResponderRow = {
  full_name: ReactNode;
  contact_no: string;
  employee_no?: string;
  substation_location?: string;
  dept_id: number;
};

export default function RespondersPage() {
  const { data, isLoading, isError } = useResponders();

  const [selectedTL, setSelectedTL] = useState<Responder | null>(null);
  const [members, setMembers] = useState<Responder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMembersLoading, setIsMembersLoading] = useState(false);

  const handleViewMembers = async (responder: Responder) => {
    if (Number(responder.is_team_leader) !== 1) return;

    try {
      setSelectedTL(responder);
      setIsMembersLoading(true);
      setIsModalOpen(true);

      const token = localStorage.getItem("admin_token");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `http://localhost:3000/api/responders/${responder.responder_id}/members`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch members");
      }

      setMembers(result.data || []);
    } catch (error) {
      console.error(error);
      setMembers([]);
    } finally {
      setIsMembersLoading(false);
    }
  };

  if (isLoading) {
    return <PageState type="loading" message="Loading responders..." />;
  }

  if (isError) {
    return <PageState type="error" message="Failed to load responders." />;
  }

  if (!data || data.length === 0) {
    return <PageState type="empty" message="No team leaders found." />;
  }

  const columns: { header: string; accessor: keyof ResponderRow }[] = [
    { header: "Full Name", accessor: "full_name" },
    { header: "Contact Number", accessor: "contact_no" },
    { header: "Employee No", accessor: "employee_no" },
    { header: "Substation Location", accessor: "substation_location" },
    { header: "Department ID", accessor: "dept_id" },
  ];

  const formattedData: ResponderRow[] = data.map((item: Responder) => {
    const fullName = `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim();
    const isTeamLeader = Number(item.is_team_leader) === 1;

    return {
      full_name: isTeamLeader ? (
        <button
          type="button"
          onClick={() => handleViewMembers(item)}
          className="font-medium text-blue-600 hover:underline"
        >
          {fullName}
        </button>
      ) : (
        <span>{fullName}</span>
      ),
      contact_no: item.contact_no,
      employee_no: item.employee_no,
      substation_location: item.address || item.substation_name || "N/A",
      dept_id: item.dept_id,
    };
  });

  return (
    <div className="min-h-screen bg-white p-6 select-none">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Team Leaders
        </h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table columns={columns} data={formattedData} />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-2">Team Members</h2>

            <p className="mb-4 text-sm text-gray-600">
              Team Leader:{" "}
              <span className="font-medium text-gray-900">
                {selectedTL?.first_name} {selectedTL?.last_name}
              </span>
            </p>

            {isMembersLoading ? (
              <p className="text-sm text-gray-500">Loading members...</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-gray-500">No members assigned.</p>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.responder_id}
                    className="rounded-md border p-3"
                  >
                    <p className="font-medium">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Employee No: {member.employee_no}
                    </p>
                    <p className="text-sm text-gray-500">
                      Contact: {member.contact_no}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedTL(null);
                  setMembers([]);
                  setIsMembersLoading(false);
                }}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}