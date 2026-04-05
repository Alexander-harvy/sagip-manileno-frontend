import { Table } from "../../../components/layout/ui/Table";
import { StatusBadge } from "../../../components/layout/ui/StatusBadge";
import PageState from "@/components/common/PageState";
import { useResponders } from "../api/responders";

type ResponderRow = {
  responder_id: number;
  full_name: string;
  contact_no: string;
  status: React.ReactNode;
  dept_id: number;
};

export default function RespondersPage() {
  const { data, isLoading, isError } = useResponders();

  if (isLoading) {
    return <PageState type="loading" message="Loading responders..." />;
  }

  if (isError) {
    return <PageState type="error" message="Failed to load responders." />;
  }

  if (!data || data.length === 0) {
    return <PageState type="empty" message="No responders found." />;
  }

  const columns: { header: string; accessor: keyof ResponderRow }[] = [
    { header: "ID", accessor: "responder_id" },
    { header: "Full Name", accessor: "full_name" },
    { header: "Contact Number", accessor: "contact_no" },
    { header: "Status", accessor: "status" },
    { header: "Department ID", accessor: "dept_id" },
  ];

  const formattedData: ResponderRow[] = data.map((item: any) => ({
    responder_id: item.responder_id,
    full_name: `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim(),
    contact_no: item.contact_no,
    dept_id: item.dept_id,
    status: <StatusBadge status={item.status ?? "offline"} />,
  }));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Responders</h1>
      <Table columns={columns} data={formattedData} />
    </div>
  );
}