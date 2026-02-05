// client/src/modules/machine/types.ts

export interface Machine {
  id: string;
  asset_id: string;
  name: string;
  status: "Operational" | "Breakdown" | "Maintenance" | "Safety_Lock";
  criticality: "High" | "Medium" | "Low";
  shop_name: string;
  manufacturer?: string;
  model_name?: string;
  install_year?: number;
  last_maintenance_date?: string;
  image_url?: string | null; // <--- Add this
}