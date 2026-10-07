import type {
  ReactNode,
} from "react";


export interface DataTableColumn<T> {
  key: string;
  label: string;

  render:
    (row: T) =>
      ReactNode;
}


interface DataTableProps<T> {
  columns:
    DataTableColumn<T>[];

  data: T[];

  getRowKey:
    (row: T) =>
      string | number;

  actions?:
    (row: T) =>
      ReactNode;
}


function DataTable<T>({
  columns,
  data,
  getRowKey,
  actions,
}: DataTableProps<T>) {
  return (
    <div className="enterprise-table-wrapper">
      <table className="enterprise-table">
        <thead>
          <tr>
            {columns.map(
              (
                column,
              ) => (
                <th
                  key={
                    column.key
                  }
                >
                  {
                    column.label
                  }
                </th>
              ),
            )}

            {actions && (
              <th
                data-export-hide="true"
              >
                Acciones
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {data.map(
            (
              row,
            ) => (
              <tr
                key={
                  getRowKey(
                    row,
                  )
                }
              >
                {columns.map(
                  (
                    column,
                  ) => (
                    <td
                      key={
                        column.key
                      }
                    >
                      {
                        column.render(
                          row,
                        )
                      }
                    </td>
                  ),
                )}

                {actions && (
                  <td
                    data-export-hide="true"
                  >
                    {
                      actions(
                        row,
                      )
                    }
                  </td>
                )}
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}


export default DataTable;
