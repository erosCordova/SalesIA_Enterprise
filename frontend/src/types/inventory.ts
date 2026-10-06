export type InventoryMovementType =
  | "entry"
  | "exit";


export interface InventoryMovement {
  id: string;

  inventory_id: string;
  product_id: string;

  sku: string;
  product_name: string;

  user_id: string | null;
  user_name: string;

  movement_type: string;
  quantity: number | string;

  reference_type: string | null;
  reference_id: string | null;
  reference_label: string | null;

  reason: string | null;

  movement_date: string;
}


export interface InventoryMovementCreate {
  product_id: string;

  movement_type:
    InventoryMovementType;

  quantity: number;

  reason: string;
}
