import {
  apiFetch,
} from "./api";

import type {
  InventoryMovement,
  InventoryMovementCreate,
} from "../types/inventory";


export function getInventoryMovements() {
  return apiFetch<
    InventoryMovement[]
  >(
    "/inventory/movements",
  );
}


export function createInventoryMovement(
  payload: InventoryMovementCreate,
) {
  return apiFetch<
    InventoryMovement
  >(
    "/inventory/movements",
    {
      method: "POST",
      body: JSON.stringify(
        payload,
      ),
    },
  );
}
