export type CustomerSummary = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  zip?: string | null;
};

export type VehicleSummary = {
  id: string;
  year: number;
  make: string;
  model: string;
  color: string;
  isDefault: boolean;
};

export type RebookPayload = {
  serviceSlug: string;
  vehicle: VehicleSummary;
};
