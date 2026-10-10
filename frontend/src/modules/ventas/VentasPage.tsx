import {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Ban,
  Building2,
  Eye,
  Plus,
  ReceiptText,
  RefreshCw,
  UserRound,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import DataTable, {
  type DataTableColumn,
} from "../../components/ui/DataTable";

import ExportActions from "../../components/ui/ExportActions";
import Modal from "../../components/ui/Modal";
import ModuleState from "../../components/ui/ModuleState";
import Pagination from "../../components/ui/Pagination";
import TableToolbar from "../../components/ui/TableToolbar";

import {
  cancelSale,
  getSaleDetail,
  getSales,
} from "../../services/commercial.service";

import {
  getBranches,
} from "../../services/organization.service";

import {
  useApiResource,
} from "../../hooks/useApiResource";

import {
  useAuth,
} from "../../services/auth.context";

import {
  createVisualPdfFile,
  downloadVisualPdf,
  exportDateStamp,
  exportRowsToCsv,
  exportRowsToExcel,
  shareFile,
  type ExportRow,
} from "../../utils/exporting";

import type {
  SaleListItem,
  SaleView,
} from "../../types/commercial";

import "./ventas.css";


const PAGE_SIZE = 8;


function toNumber(
  value: number | string,
) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}


function formatMoney(
  value: number | string,
) {
  return new Intl.NumberFormat(
    "es-PE",
    {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    },
  ).format(
    toNumber(value),
  );
}


function formatDate(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "es-PE",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}


function statusLabel(
  value: string,
) {
  if (value === "completed") {
    return "Completada";
  }

  if (value === "cancelled") {
    return "Anulada";
  }

  return value;
}


function VentasPage() {
  const exportRef =
    useRef<HTMLElement>(
      null,
    );


  const [
    exportError,
    setExportError,
  ] =
    useState("");


  const navigate =
    useNavigate();

  const {
    user,
  } = useAuth();

  const {
    data,
    loading,
    error,
    reload,
  } =
    useApiResource(
      getSales,
    );

  const branchesResource =
    useApiResource(
      getBranches,
    );

  const [
    branchFilter,
    setBranchFilter,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    detailOpen,
    setDetailOpen,
  ] = useState(false);

  const [
    selectedSale,
    setSelectedSale,
  ] =
    useState<SaleView | null>(
      null,
    );

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [
    detailError,
    setDetailError,
  ] = useState("");

  const [
    cancelTarget,
    setCancelTarget,
  ] =
    useState<SaleListItem | null>(
      null,
    );

  const [
    cancelReason,
    setCancelReason,
  ] = useState("");

  const [
    cancelling,
    setCancelling,
  ] = useState(false);

  const [
    actionError,
    setActionError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");


  const sales =
    data ?? [];

  const branches =
    branchesResource.data ?? [];


  const canCreate =
    user?.role === "Administrador"
    ||
    user?.role === "Vendedor";


  const canCancel =
    user?.role === "Administrador"
    ||
    user?.role === "Gerente";

const filteredSales =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return sales.filter(
          (sale) => {
            const matchesBranch =
              !branchFilter
              || (
                branchFilter === "__none__"
                  ? !sale.branch_id
                  : sale.branch_id ===
                    branchFilter
              );

            if (!matchesBranch) {
              return false;
            }

            if (!query) {
              return true;
            }

            return [
              sale.sale_number,
              sale.branch_name,
              sale.customer_name,
              sale.status,
              sale.total,
            ].some(
              (value) =>
                String(
                  value ?? "",
                )
                  .toLowerCase()
                  .includes(
                    query,
                  ),
            );
          },
        );
      },
      [
        sales,
        search,
        branchFilter,
      ],
    );


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredSales.length /
          PAGE_SIZE,
      ),
    );


  const safePage =
    Math.min(
      page,
      totalPages,
    );


  const paginatedSales =
    filteredSales.slice(
      (safePage - 1) *
        PAGE_SIZE,

      safePage *
        PAGE_SIZE,
    );


  function exportRows(): ExportRow[] {
    return filteredSales.map(
      (sale) => ({
        Venta:
          sale.sale_number,

        Fecha:
          formatDate(
            sale.sale_date,
          ),

        Sucursal:
          sale.branch_name
          || "Sin sucursal",

        Cliente:
          sale.customer_name
          || "Cliente general",

        Subtotal:
          toNumber(
            sale.subtotal,
          ),

        Descuento:
          toNumber(
            sale.discount,
          ),

        Impuesto:
          toNumber(
            sale.tax,
          ),

        Total:
          toNumber(
            sale.total,
          ),

        Estado:
          statusLabel(
            sale.status,
          ),
      }),
    );
  }


  function exportFilename() {
    return `ventas-${exportDateStamp()}`;
  }


  async function handlePdf() {
    if (
      !exportRef.current
    ) {
      return;
    }


    setExportError("");


    try {
      await downloadVisualPdf(
        exportRef.current,
        exportFilename(),
      );
    } catch (
      currentError
    ) {
      setExportError(
        currentError instanceof Error
          ? currentError.message
          : "No se pudo generar el PDF.",
      );
    }
  }


  function handleCsv() {
    setExportError("");


    try {
      exportRowsToCsv(
        exportFilename(),
        exportRows(),
      );
    } catch (
      currentError
    ) {
      setExportError(
        currentError instanceof Error
          ? currentError.message
          : "No se pudo generar el CSV.",
      );
    }
  }


  async function handleExcel() {
    setExportError("");


    try {
      await exportRowsToExcel(
        exportFilename(),
        "Ventas",
        exportRows(),
      );
    } catch (
      currentError
    ) {
      setExportError(
        currentError instanceof Error
          ? currentError.message
          : "No se pudo generar el archivo Excel.",
      );
    }
  }


  async function handleShare() {
    if (
      !exportRef.current
    ) {
      return;
    }


    setExportError("");


    try {
      const file =
        await createVisualPdfFile(
          exportRef.current,
          exportFilename(),
        );


      await shareFile(
        file,
        "Ventas - SalesIA Enterprise",
        "Listado de ventas de SalesIA Enterprise.",
      );
    } catch (
      currentError
    ) {
      setExportError(
        currentError instanceof Error
          ? currentError.message
          : "No se pudo compartir el listado de ventas.",
      );
    }
  }


  async function openDetail(
    sale: SaleListItem,
  ) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError("");
    setSelectedSale(null);

    try {
      setSelectedSale(
        await getSaleDetail(
          sale.id,
        ),
      );
    } catch (err) {
      setDetailError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar la venta.",
      );
    } finally {
      setDetailLoading(false);
    }
  }


  async function handleCancel() {
    if (!cancelTarget) {
      return;
    }

    const reason =
      cancelReason.trim();

    if (reason.length < 3) {
      setActionError(
        "Indica el motivo de la anulación.",
      );

      return;
    }

    setCancelling(true);
    setActionError("");

    try {
      await cancelSale(
        cancelTarget.id,
        reason,
      );

      setSuccess(
        `La venta ${cancelTarget.sale_number} fue anulada y el inventario fue restaurado.`,
      );

      setCancelTarget(null);
      setCancelReason("");

      await reload();

    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "No se pudo anular la venta.",
      );
    } finally {
      setCancelling(false);
    }
  }


  const columns:
    DataTableColumn<SaleListItem>[] = [
      {
        key: "sale",
        label: "Venta",

        render: (sale) => (
          <div className="customer-cell">
            <div className="customer-avatar">
              <ReceiptText
                size={17}
              />
            </div>

            <div>
              <strong>
                {sale.sale_number}
              </strong>

              <span>
                {formatDate(
                  sale.sale_date,
                )}
              </span>
            </div>
          </div>
        ),
      },

      {
        key: "branch",
        label: "Sucursal",

        render: (sale) => (
          <span className="table-detail">
            <Building2
              size={13}
            />

            {sale.branch_name
              || "Sin sucursal"}
          </span>
        ),
      },

      {
        key: "customer",
        label: "Cliente",

        render: (sale) => (
          <span className="table-detail">
            <UserRound
              size={13}
            />

            {sale.customer_name ||
              "Cliente general"}
          </span>
        ),
      },

      {
        key: "total",
        label: "Total",

        render: (sale) => (
          <strong>
            {formatMoney(
              sale.total,
            )}
          </strong>
        ),
      },

      {
        key: "status",
        label: "Estado",

        render: (sale) => (
          <span
            className={`status-badge ${
              sale.status ===
              "completed"
                ? "success"
                : "inactive"
            }`}
          >
            {statusLabel(
              sale.status,
            )}
          </span>
        ),
      },
    ];


  return (
    <section
      ref={exportRef}
      className="module-page"
    >
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">
            OPERACIÓN COMERCIAL
          </span>

          <h1>
            Ventas
          </h1>

          <p>
            Consulta el detalle de cada
            operación y administra
            anulaciones manteniendo
            trazabilidad en Inventario
            y Kardex.
          </p>
        </div>

        <div
          className="sale-toolbar-actions"
          data-export-hide="true"
        >
          <ExportActions
            disabled={
              loading
              || filteredSales.length === 0
            }
            onPdf={handlePdf}
            onCsv={handleCsv}
            onExcel={handleExcel}
            onShare={handleShare}
          />


          <button
            type="button"
            className="secondary-button"
            disabled={
              loading
              || branchesResource.loading
            }
            onClick={() =>
              void Promise.all([
                reload(),
                branchesResource.reload(),
              ])
            }
          >
            <RefreshCw
              size={16}
            />

            Actualizar
          </button>

          {canCreate && (
            <button
              type="button"
              className="primary-button"
              onClick={() =>
                navigate(
                  "/sales/new",
                )
              }
            >
              <Plus size={16} />

              Nueva venta
            </button>
          )}
        </div>
      </div>


      {success && (
        <div data-export-hide="true">
          <ModuleState
          type="success"
          title="Venta actualizada"
          description={success}
          />
        </div>
      )}


      {actionError &&
        !cancelTarget && (
        <div data-export-hide="true">
          <ModuleState
          type="error"
          title="No se pudo completar la acción"
          description={actionError}
          />
        </div>
      )}

      {exportError && (
        <div
          data-export-hide="true"
          className="sale-export-error"
        >
          {exportError}
        </div>
      )}


      <article className="panel enterprise-data-panel">
        <div
          className="sale-list-controls"
          data-export-hide="true"
        >
          <label className="sale-branch-filter">
            <span>Sucursal</span>

            <select
              value={branchFilter}
              disabled={
                branchesResource.loading
              }
              onChange={(event) => {
                setBranchFilter(
                  event.target.value,
                );

                setPage(1);
              }}
            >
              <option value="">
                {
                  branchesResource.loading
                    ? "Cargando sucursales..."
                    : "Todas las sucursales"
                }
              </option>

              {branches.map(
                (branch) => (
                  <option
                    key={branch.id}
                    value={branch.id}
                  >
                    {branch.name}
                  </option>
                ),
              )}

              {sales.some(
                (sale) =>
                  !sale.branch_id,
              ) && (
                <option value="__none__">
                  Sin sucursal (ventas anteriores)
                </option>
              )}
            </select>
          </label>

          <TableToolbar
            search={search}
          onSearchChange={(
            value,
          ) => {
            setSearch(value);
            setPage(1);
          }}
            canCreate={false}
          />
        </div>


        {loading ? (
          <ModuleState
            type="loading"
            title="Cargando ventas"
          />
        ) : error ? (
          <ModuleState
            type="error"
            title="No se pudieron cargar las ventas"
            description={error}
          />
        ) : filteredSales.length ===
          0 ? (
          <ModuleState
            type="empty"
            title="No se encontraron ventas"
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={
                paginatedSales
              }
              getRowKey={(
                sale,
              ) => sale.id}
              actions={(
                sale,
              ) => (
                <div className="table-actions">
                  <button
                    type="button"
                    className="icon-button"
                    title="Ver detalle"
                    onClick={() =>
                      void openDetail(
                        sale,
                      )
                    }
                  >
                    <Eye size={16} />
                  </button>

                  {canCancel &&
                    sale.status ===
                      "completed" && (
                    <button
                      type="button"
                      className="icon-button sale-cancel-action"
                      title="Anular venta"
                      onClick={() => {
                        setActionError(
                          "",
                        );

                        setCancelReason(
                          "",
                        );

                        setCancelTarget(
                          sale,
                        );
                      }}
                    >
                      <Ban size={16} />
                    </button>
                  )}
                </div>
              )}
            />

            <Pagination
              page={safePage}
              totalPages={
                totalPages
              }
              onPageChange={
                setPage
              }
            />
          </>
        )}
      </article>


      <Modal
        open={detailOpen}
        title={
          selectedSale
            ? `Venta ${selectedSale.sale_number}`
            : "Detalle de venta"
        }
        description="Información completa de la operación."
        onClose={() => {
          setDetailOpen(
            false,
          );

          setSelectedSale(
            null,
          );
        }}
      >
        {detailLoading ? (
          <ModuleState
            type="loading"
            title="Cargando detalle"
          />
        ) : detailError ? (
          <ModuleState
            type="error"
            title="No se pudo cargar el detalle"
            description={
              detailError
            }
          />
        ) : selectedSale ? (
          <div className="sale-detail-view">
            <div className="sale-detail-summary">
              <div>
                <span>Cliente</span>

                <strong>
                  {selectedSale.customer_name}
                </strong>
              </div>

              <div>
                <span>Sucursal</span>

                <strong>
                  {selectedSale.branch_name
                    || "Sin sucursal"}
                </strong>
              </div>

              <div>
                <span>Fecha</span>

                <strong>
                  {formatDate(
                    selectedSale.sale_date,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Registrado por
                </span>

                <strong>
                  {selectedSale.created_by_name}
                </strong>
              </div>

              <div>
                <span>Estado</span>

                <strong>
                  {statusLabel(
                    selectedSale.status,
                  )}
                </strong>
              </div>
            </div>


            <div className="sale-detail-items">
              <h3>
                Productos
              </h3>

              {selectedSale.items.map(
                (item) => (
                  <div
                    className="sale-detail-item"
                    key={
                      item.product_id
                    }
                  >
                    <div>
                      <strong>
                        {item.product_name}
                      </strong>

                      <span>
                        {item.quantity}
                        {" × "}
                        {formatMoney(
                          item.unit_price,
                        )}
                      </span>
                    </div>

                    <strong>
                      {formatMoney(
                        item.subtotal,
                      )}
                    </strong>
                  </div>
                ),
              )}
            </div>


            <div className="sale-detail-totals">
              <div>
                <span>Subtotal</span>

                <strong>
                  {formatMoney(
                    selectedSale.subtotal,
                  )}
                </strong>
              </div>

              <div>
                <span>Descuento</span>

                <strong>
                  {formatMoney(
                    selectedSale.discount,
                  )}
                </strong>
              </div>

              <div>
                <span>Impuesto</span>

                <strong>
                  {formatMoney(
                    selectedSale.tax,
                  )}
                </strong>
              </div>

              <div className="sale-detail-total">
                <span>Total</span>

                <strong>
                  {formatMoney(
                    selectedSale.total,
                  )}
                </strong>
              </div>
            </div>


            {selectedSale.payment && (
              <div className="sale-detail-payment">
                <span>Pago</span>

                <strong>
                  {selectedSale.payment.payment_method}
                </strong>

                <small>
                  {formatMoney(
                    selectedSale.payment.amount,
                  )}

                  {" · "}

                  {selectedSale.payment.status ===
                  "cancelled"
                    ? "Cancelado"
                    : "Completado"}
                </small>
              </div>
            )}


            {selectedSale.notes && (
              <div className="sale-detail-notes">
                <span>Notas</span>

                <p>
                  {selectedSale.notes}
                </p>
              </div>
            )}
          </div>
        ) : null}
      </Modal>


      <Modal
        open={
          Boolean(
            cancelTarget,
          )
        }
        title="Anular venta"
        description={
          cancelTarget
            ? `Venta ${cancelTarget.sale_number}`
            : undefined
        }
        onClose={() => {
          if (!cancelling) {
            setCancelTarget(
              null,
            );

            setCancelReason(
              "",
            );

            setActionError(
              "",
            );
          }
        }}
      >
        <div className="sale-cancel-box">
          <Ban size={25} />

          <div>
            <strong>
              La venta no será eliminada.
            </strong>

            <p>
              Quedará anulada, el pago se
              cancelará y las unidades
              regresarán al inventario
              mediante movimientos de Kardex.
            </p>
          </div>
        </div>


        <label className="sale-field">
          <span>
            Motivo de anulación
          </span>

          <textarea
            rows={4}
            maxLength={500}
            value={cancelReason}
            onChange={(event) =>
              setCancelReason(
                event.target.value,
              )
            }
            placeholder="Indica por qué se anula la venta."
          />
        </label>


        {actionError && (
          <p className="sale-inline-error">
            {actionError}
          </p>
        )}


        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={cancelling}
            onClick={() => {
              setCancelTarget(
                null,
              );

              setActionError(
                "",
              );
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="danger-button"
            disabled={cancelling}
            onClick={() =>
              void handleCancel()
            }
          >
            <Ban size={16} />

            {cancelling
              ? "Anulando..."
              : "Confirmar anulación"}
          </button>
        </div>
      </Modal>
    </section>
  );
}


export default VentasPage;
