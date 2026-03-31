type Props = {
  status: string;
};

export function StatusBadge({ status }: Props) {
 const colors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  assigned: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",


  available: "bg-green-100 text-green-700",
  busy: "bg-yellow-100 text-yellow-700",
  offline: "bg-gray-200 text-gray-600",
};

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

