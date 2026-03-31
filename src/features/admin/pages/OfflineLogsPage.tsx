import { Table } from "../../../components/layout/ui/Table";

type OfflineLog = {
  id: number;
  message: string;
  created_at: string;
};

const mockLogs: OfflineLog[] = [
  {
    id: 1,
    message: "No internet connection. Data saved locally.",
    created_at: "2026-03-31 08:30",
  },
  {
    id: 2,
    message: "Failed to send incident report. Retrying...",
    created_at: "2026-03-31 09:15",
  },
  {
    id: 3,
    message: "Sync completed successfully.",
    created_at: "2026-03-31 10:00",
  },
];

export default function OfflineLogsPage() {
  const columns: { header: string; accessor: keyof OfflineLog }[] = [
    { header: "ID", accessor: "id" },
    { header: "Message", accessor: "message" },
    { header: "Date", accessor: "created_at" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Offline Logs</h1>

      <Table columns={columns} data={mockLogs} />
    </div>
  );
}