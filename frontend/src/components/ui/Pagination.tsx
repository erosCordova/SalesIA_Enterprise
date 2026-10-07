import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";


interface PaginationProps {
  page: number;

  totalPages: number;

  onPageChange:
    (page: number) =>
      void;
}


function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  return (
    <div className="pagination">
      <span>
        Página {page} de{" "}
        {totalPages}
      </span>

      <div
        className="pagination-actions"
        data-export-hide="true"
      >
        <button
          type="button"
          disabled={
            page <= 1
          }
          onClick={() =>
            onPageChange(
              page - 1,
            )
          }
        >
          <ChevronLeft
            size={17}
          />
        </button>

        <button
          type="button"
          disabled={
            page >=
            totalPages
          }
          onClick={() =>
            onPageChange(
              page + 1,
            )
          }
        >
          <ChevronRight
            size={17}
          />
        </button>
      </div>
    </div>
  );
}


export default Pagination;
