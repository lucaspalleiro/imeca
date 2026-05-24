// Domain Model Interfaces for Montajes Imeca Dashboard

export type ProjectStatus = 'en_plazo' | 'en_riesgo' | 'atrasada' | 'por_cerrar' | 'detenida';

export interface Project {
  id: string;
  name: string;
  code: string;
  client_name: string;
  manager_id: string;
  manager_name: string; // resolved from employees
  status: ProjectStatus;
  start_date: string;
  end_date_estimated: string;
  end_date_contractual: string;
  budgeted_hh: number;
  consumed_hh: number;
  projected_hh: number;
  budgeted_cost: number;
  real_cost: number;
  margin_estimated: number; // e.g. 25%
  real_margin: number; // calculated from real costs
  potential_penalties: number;
  risks_active: string[];
}

export type UserRole = 
  | 'presidente' 
  | 'director' 
  | 'gerencia' 
  | 'finanzas' 
  | 'rrhh' 
  | 'jefe_de_obra' 
  | 'supervisor' 
  | 'operador';

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  dni: string;
  email?: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  hourly_rate: number;
  certifications: EmployeeCertification[];
}

export type CertificationType = 
  | 'soldadura_3g'
  | 'soldadura_6g'
  | 'espacios_confinados'
  | 'altura'
  | 'gruas'
  | 'izaje'
  | 'seguridad_industrial';

export interface Certification {
  id: string;
  name: string;
  type: CertificationType;
  validity_days: number;
}

export interface EmployeeCertification {
  id: string;
  employee_id: string;
  certification_id: string;
  certification_name: string;
  type: CertificationType;
  issue_date: string;
  expiry_date: string;
  document_url?: string;
  is_valid: boolean; // computed: expiry_date >= current_date
}

export interface Crew {
  id: string;
  name: string;
  leader_id: string;
  leader_name: string;
  project_id?: string;
  project_name?: string;
  members_count: number;
}

export interface CrewAssignment {
  id: string;
  crew_id: string;
  employee_id: string;
  employee_name: string;
  role: string;
  assigned_at: string;
}

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertPriority = 'low' | 'medium' | 'high';
export type AlertState = 'active' | 'acknowledged' | 'resolved';

export interface Alert {
  id: string;
  project_id?: string;
  project_name?: string;
  type: string;
  severity: AlertSeverity;
  priority: AlertPriority;
  message: string;
  suggested_action?: string;
  status: AlertState;
  assignee_id?: string;
  assignee_name?: string;
  created_at: string;
  updated_at: string;
}

export interface AlertHistory {
  id: string;
  alert_id: string;
  status: AlertState;
  changed_by: string;
  comment?: string;
  created_at: string;
}

export interface Equipment {
  id: string;
  name: string;
  code: string;
  type: string;
  brand?: string;
  model?: string;
  status: 'disponible' | 'en_obra' | 'mantenimiento' | 'fuera_servicio';
  project_id?: string;
  project_name?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  is_rented: boolean;
  rental_cost_monthly: number;
  location?: string;
}

export interface FinancialPulse {
  billing_monthly: number;
  billing_target: number;
  billing_projected: number;
  gross_margin_avg: number;
  accumulated_hh_cost: number;
  overdue_debt: number;
  pending_invoices: number;
  accounts_receivable: number;
  estimated_cashflow: number;
}
