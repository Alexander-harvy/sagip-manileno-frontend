import { Table } from "../../../components/layout/ui/Table";
import PageState from "@/components/common/PageState";
import { useOfflineLogs } from "../api/offlineLogs";

type OfflineLogRow = {
  offlineLog_id: number;
  sender_no: string;
  message_cont: string;
  receive_at: string;
  latitude: number | string;
  longitude: number | string;
};

export default function OfflineLogsPage() {
  const { data, isLoading, isError } = useOfflineLogs();

  if (isLoading) {
    return <PageState type="loading" message="Loading offline logs..." />;
  }

  if (isError) {
    return <PageState type="error" message="Failed to load offline logs." />;
  }

  if (!data || data.length === 0) {
    return <PageState type="empty" message="No offline logs found." />;
  }

  const columns: { header: string; accessor: keyof OfflineLogRow }[] = [
    { header: "ID", accessor: "offlineLog_id" },
    { header: "Sender Number", accessor: "sender_no" },
    { header: "Message", accessor: "message_cont" },
    { header: "Received At", accessor: "receive_at" },
    { header: "Latitude", accessor: "latitude" },
    { header: "Longitude", accessor: "longitude" },
  ];

  const formattedData: OfflineLogRow[] = data.map((item: any) => ({
    offlineLog_id: item.offlineLog_id,
    sender_no: item.sender_no,
    message_cont: item.message_cont,
    receive_at: new Date(item.receive_at).toLocaleString(),
    latitude: item.latitude,
    longitude: item.longitude,
  }));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Offline Logs</h1>
      <Table columns={columns} data={formattedData} />
    </div>
  );
}