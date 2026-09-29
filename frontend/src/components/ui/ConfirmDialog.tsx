import {
  AlertTriangle,
} from "lucide-react";

import Modal from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmDialog({
  open,
  title,
  message,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
    >
      <div className="confirm-content">
        <div className="confirm-icon">
          <AlertTriangle size={25} />
        </div>

        <p>{message}</p>
      </div>

      <div className="modal-actions">
        <button
          className="secondary-button"
          onClick={onCancel}
        >
          Cancelar
        </button>

        <button
          className="danger-button"
          onClick={onConfirm}
        >
          Confirmar
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
