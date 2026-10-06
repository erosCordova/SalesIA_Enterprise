import {
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

  placeholder?: string;
}


function TableToolbar({
  search,
  onSearchChange,
  onCreate,
  createLabel = "Nuevo registro",
  canCreate = true,
  placeholder = "Buscar...",
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
          placeholder={placeholder}
        />
      </div>

      {canCreate && onCreate && (
        <div className="table-toolbar-actions">
          <button
            type="button"
            className="primary-button"
            onClick={onCreate}
          >
            <Plus size={17} />

            {createLabel}
          </button>
        </div>
      )}
    </div>
  );
}


export {
  TableToolbar,
};

export default TableToolbar;
