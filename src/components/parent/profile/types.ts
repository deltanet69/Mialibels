export interface StudentProfileData {
  id: string;
  name: string;
  student_number?: string | null;
  nisn?: string | null;
  class?: string | null;
  gender?: string | null;
  birth_place?: string | null;
  birth_date?: string | null;
  address?: string | null;
  parent_name?: string | null;
  parent_phone?: string | null;
  parent_email?: string | null;
  image?: string | null;
  is_active?: boolean;
  homeroomTeacherName?: string;
  tabunganBalance: number;
  sppInvoices: any[];
  sppAmountDisplay: string;
}

export interface ParentProfileProps {
  student: StudentProfileData;
}
