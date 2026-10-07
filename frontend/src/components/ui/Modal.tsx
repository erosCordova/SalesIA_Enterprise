import {
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

import {
  KeyRound,
  X,
} from "lucide-react";


interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}


const ACCESS_ENABLED_KEY =
  "salesia_customer_access_enabled";

const ACCESS_PASSWORD_KEY =
  "salesia_customer_access_password";


function Modal({
  open,
  title,
  description,
  children,
  onClose,
}: ModalProps) {
  const isCustomerRegister =
    /registrar\s+(nuevo\s+)?cliente/i.test(
      title.trim(),
    );


  const [
    createAccess,
    setCreateAccess,
  ] = useState(true);


  const [
    password,
    setPassword,
  ] = useState("");


  useEffect(
    () => {
      if (
        open &&
        isCustomerRegister
      ) {
        setCreateAccess(true);
        setPassword("");

        sessionStorage.setItem(
          ACCESS_ENABLED_KEY,
          "1",
        );

        sessionStorage.removeItem(
          ACCESS_PASSWORD_KEY,
        );
      }
    },
    [
      open,
      isCustomerRegister,
    ],
  );


  function handleAccessChange(
    enabled: boolean,
  ) {
    setCreateAccess(
      enabled,
    );

    sessionStorage.setItem(
      ACCESS_ENABLED_KEY,
      enabled
        ? "1"
        : "0",
    );

    if (!enabled) {
      setPassword("");

      sessionStorage.removeItem(
        ACCESS_PASSWORD_KEY,
      );
    }
  }


  function handlePasswordChange(
    value: string,
  ) {
    setPassword(
      value,
    );

    sessionStorage.setItem(
      ACCESS_PASSWORD_KEY,
      value,
    );
  }


  function handleClose() {
    if (isCustomerRegister) {
      sessionStorage.removeItem(
        ACCESS_ENABLED_KEY,
      );

      sessionStorage.removeItem(
        ACCESS_PASSWORD_KEY,
      );

      setCreateAccess(true);
      setPassword("");
    }

    onClose();
  }


  if (!open) {
    return null;
  }


  const accessPanel = (
    <div
      style={{
        marginBottom: "20px",
        padding: "16px 18px",
        border:
          "1px solid #bfdbfe",
        borderRadius: "14px",
        background:
          "#f8fbff",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            flex: "0 0 auto",
            display: "grid",
            placeItems: "center",
            borderRadius: "11px",
            background: "#eff6ff",
            color: "#2563eb",
          }}
        >
          <KeyRound
            size={20}
          />
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <strong
            style={{
              display: "block",
              marginBottom: "4px",
              color: "#172033",
              fontSize: "0.92rem",
            }}
          >
            Acceso al sistema
          </strong>

          <span
            style={{
              display: "block",
              color: "#64748b",
              fontSize: "0.78rem",
              lineHeight: 1.5,
            }}
          >
            Crea una cuenta con rol Cliente
            vinculada a este registro.
          </span>
        </div>
      </div>


      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "9px",
          marginTop: "15px",
          color: "#334155",
          fontSize: "0.86rem",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={
            createAccess
          }
          onChange={(
            event,
          ) =>
            handleAccessChange(
              event.target.checked,
            )
          }
        />

        Crear acceso para este cliente
      </label>


      {createAccess && (
        <div
          style={{
            marginTop: "14px",
          }}
        >
          <label
            style={{
              display: "block",
              color: "#334155",
              fontSize: "0.86rem",
              fontWeight: 600,
            }}
          >
            Contraseña inicial

            <input
              type="password"
              value={password}
              onChange={(
                event,
              ) =>
                handlePasswordChange(
                  event.target.value,
                )
              }
              placeholder="Mínimo 8 caracteres"
              minLength={8}
              autoComplete="new-password"
              style={{
                width: "100%",
                height: "40px",
                marginTop: "7px",
                padding: "0 12px",
                border:
                  "1px solid #d7e0ea",
                borderRadius: "10px",
                outline: "none",
                background: "#ffffff",
                color: "#172033",
                font: "inherit",
              }}
            />
          </label>

          <small
            style={{
              display: "block",
              marginTop: "7px",
              color: "#64748b",
              fontSize: "0.72rem",
            }}
          >
            El correo escrito en el formulario
            será utilizado para iniciar sesión.
          </small>
        </div>
      )}
    </div>
  );


  let content =
    children;


  if (
    isCustomerRegister &&
    isValidElement(children)
  ) {
    const element =
      children as ReactElement<{
        children?: ReactNode;
      }>;


    if (
      element.type ===
      "form"
    ) {
      content =
        cloneElement(
          element,
          {},
          <>
            {accessPanel}

            {
              element.props
                .children
            }
          </>,
        );
    } else {
      content = (
        <>
          {accessPanel}
          {children}
        </>
      );
    }
  }


  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h2>
              {title}
            </h2>

            {description && (
              <p>
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={
              handleClose
            }
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          {content}
        </div>
      </div>
    </div>
  );
}


export default Modal;
