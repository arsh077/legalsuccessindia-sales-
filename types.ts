
export enum UserRole {
  ADMIN = 'admin',
  EMPLOYEE = 'employee'
}

export type LeadStatus = 'New' | 'Calling' | 'Follow-up' | 'Not Interested' | 'Converted';

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  mobile: string;
  role: UserRole;
  is_active: boolean;
  daily_lead_target: number;
  experience_level: 'new' | 'senior'; // 'senior' = Old Employee, 'new' = New Employee
  skills: string[];
  created_at: string;
}

export interface Lead {
  id: number;
  customer_name: string;
  customer_mobile: string;
  customer_email?: string;
  location?: string;
  source?: string;
  process_type: string;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
}

export interface LeadAssignment {
  id: number;
  lead_id: number;
  assigned_to: number;
  assigned_by: string;
  assigned_at: string;
  active: boolean;
}

export interface Sale {
  id: number;
  user_id: number;
  user_name: string;
  lead_id?: number;
  lead_name?: string;
  amount: number;
  type: 'add' | 'subtract';
  payment_mode: string;
  sale_date: string;
  sale_time: string;
  timestamp: string;
  comments?: string;
  created_at: string;
}

export interface PerformanceLog {
  id: number;
  user_id: number;
  month: string; // YYYY-MM
  leads_handled: number;
  sales_amount: number;
  conversions: number;
  rank_in_team?: number;
  is_top_performer: boolean;
  note_from_admin?: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  action_type: string;
  entity_type: string;
  entity_id?: number;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  created_at: string;
}
