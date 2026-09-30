import {
  Filter,
  Plus,
  Search,
} from "lucide-react";


export interface TableToolbarProps {
  search: string;

  onSearchChange: (
    value: string,
  ) => void;

  onCreate?: () => void;

  createLabel?: string;

  canCreate?: boolean;
}


function TableToolbar({
  search,
  onSearchChange,
  onCreate,
  createLabel = "Nuevo registro",
  canCreate = true,
}: TableToolbarProps) {
  return (
    <div className="table-toolbar">
      <div className="table-search">
        <Search size={17} />

        <input
          type="search"
          value={search}
          onChange={(event) =>
            onSearchChange(
              event.target.value,
            )
          }
          placeholder="Buscar..."
        />
      </div>

      <div className="table-toolbar-actions">
        <button
          type="button"
          className="secondary-button"
        >
          <Filter size={17} />
          Filtros
        </button>

        {canCreate && onCreate && (
          <button
            type="button"
            className="primary-button"
            onClick={onCreate}
          >
            <Plus size={17} />

            {createLabel}
          </button>
        )}
      </div>
    </div>
  );
}


/*
 * Se mantienen ambas exportaciones.
 *
 * Esto permite:
 *
 * import TableToolbar from ".../TableToolbar";
 *
 * y tambien:
 *
 * import { TableToolbar } from ".../TableToolbar";
 */
export {
  TableToolbar,
};

export default TableToolbar;
