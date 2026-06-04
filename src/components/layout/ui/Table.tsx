type Column = {
  header: string;
  accessor: string;
  cell?: (row: any) => React.ReactNode;
};
type TableRow = Record<string, unknown>;

type TableProps = {
  columns: Column[];
  data: TableRow[];
};

export function Table({ columns, data }: TableProps) {
  return (
    <div className="bg-white shadow rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((col) => (
              <th key={col.accessor} className="p-3 text-left">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="border-t">
              {columns.map((col) => (
                <td key={col.accessor} className="p-3">
                {col.cell
                  ? col.cell(row)
                  : (row[col.accessor] as React.ReactNode)}
              </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}