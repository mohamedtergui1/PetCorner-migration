// types/order.types.ts

export interface OrderLine {
  id: number;
  libelle: string;
  qty: number;
  subprice: number;
  photo_link?: string;
  product_type?: number;
  rang?: number;
  fk_product?: number;
  desc?: string;
  total_ht?: number;
  total_tva?: number;
  total_ttc?: number;
}

export interface Order {
  id: number;
  ref: string;
  status: number;
  date_commande: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  lines: OrderLine[];
  socid?: number;
  entity?: number;
  date_creation?: number;
  date_modification?: number;
  date_cloture?: number;
  note_public?: string;
  note_private?: string;
  source?: number;
  billed?: number;
  facture?: number;
  fk_account?: number;
  fk_currency?: string;
  fk_cond_reglement?: number;
  fk_mode_reglement?: number;
  fk_availability?: number;
  fk_input_reason?: number;
  fk_delivery_address?: number;
  shipping_method_id?: number;
  warehouse_id?: number;
  demand_reason_id?: number;
  date_livraison?: number | null;
  fk_user_author?: number;
  fk_user_modif?: number;
  fk_user_valid?: number;
  fk_user_cloture?: number;
  import_key?: string;
  extraparams?: any;
  linked_objects?: any;
  canvas?: string;
  fk_project?: number;
  contact_id?: number;
  contactid?: number;
  thirdparty?: any;
}

export interface OrderStatusInfo {
  text: string;
  color: string;
  bgColor: string;
}

export interface OrderFilterParams {
  thirdparty_ids?: number;
  limit?: number;
  page?: number;
  status?: number;
  sortfield?: string;
  sortorder?: string;
}

export interface UpdateOrderStatusRequest {
  status: number;
  note_private?: string;
  note_public?: string;
}

export interface UpdateOrderStatusResponse {
  success: boolean;
  message?: string;
  error?: string;
}