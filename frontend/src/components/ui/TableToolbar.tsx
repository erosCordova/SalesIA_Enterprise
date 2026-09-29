import {
  Filter,
  Plus,
  Search,
} from "lucide-react";

interface TableToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onCreate: () => void;
  createLabel: string;
}

function TableToolbar({
  search,
  onSearchChange,
  onCreate,
  createLabel,
}: TableToolbarProps) {
  return (
    <div className="table-toolbar">
      <div className="table-search">
        <Search size={17} />

        <input
          value={search}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          placeholder="Buscar..."
        />
      </div>

      <div className="table-toolbar-actions">
        <button className="secondary-button">
          <Filter size={17} />
          Filtros
        </button>

        <button
          className="primary-button"
          onClick={onCreate}
        >
          <Plus size={17} />
          {createLabel}
        </button>
      </div>
    </div>
  );
}

export default TableToolbar;
