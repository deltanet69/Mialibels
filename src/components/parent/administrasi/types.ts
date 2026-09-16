export interface SppInvoice {
  id: string;
  title: string;
  month: number;
  year: number;
  amount: number;
  paid_amount: number;
  status: string;
  due_date?: string;
  bukti_transfer?: string;
}

export interface GeneralInvoice {
  id: string;
  title: string;
  type: string;
  due_date?: string;
  items: { name: string; amount: number; paid_amount?: number }[];
  total_amount: number;
  paid_amount: number;
  status: string;
  bukti_transfer?: string;
  created_at: string;
}

export interface SavingsTransaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

export interface SavingsData {
  balance: number;
  lastUpdated: string | null;
  transactions: SavingsTransaction[];
  totalSetoran: number;
  totalPenarikan: number;
}
