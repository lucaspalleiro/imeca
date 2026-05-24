-- Setup Database Schema for Montajes Imeca Dashboard Ejecutivo
-- Target: PostgreSQL / Supabase
-- Author: Senior Software Industrial SaaS Architect
-- Date: 2026-05-24

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. ENUMS AND CUSTOM TYPES
-- =========================================================================

CREATE TYPE user_role AS ENUM (
    'presidente',
    'director',
    'gerencia',
    'finanzas',
    'rrhh',
    'jefe_de_obra',
    'supervisor',
    'operador'
);

CREATE TYPE project_status AS ENUM (
    'en_plazo',
    'en_riesgo',
    'atrasada',
    'por_cerrar',
    'detenida'
);

CREATE TYPE alert_severity AS ENUM (
    'info',
    'warning',
    'critical'
);

CREATE TYPE alert_priority AS ENUM (
    'low',
    'medium',
    'high'
);

CREATE TYPE alert_state AS ENUM (
    'active',
    'acknowledged',
    'resolved'
);

CREATE TYPE certification_type AS ENUM (
    'soldadura_3g',
    'soldadura_6g',
    'espacios_confinados',
    'altura',
    'gruas',
    'izaje',
    'seguridad_industrial'
);

CREATE TYPE equipment_status AS ENUM (
    'disponible',
    'en_obra',
    'mantenimiento',
    'fuera_servicio'
);

CREATE TYPE invoice_status AS ENUM (
    'borrador',
    'emitida',
    'pagada_parcial',
    'pagada',
    'vencida',
    'anulada'
);

-- =========================================================================
-- 2. CORE TABLES
-- =========================================================================

-- Companies (for multi-tenant support)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    cuit VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employees
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    dni VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    role user_role NOT NULL DEFAULT 'operador',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users (Link Auth.users with Employee profiles and roles)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    role user_role NOT NULL DEFAULT 'operador',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects (Obras)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g. OB-2026-001
    client_name VARCHAR(255) NOT NULL,
    manager_id UUID REFERENCES employees(id) ON DELETE SET NULL, -- Jefe de Obra
    status project_status NOT NULL DEFAULT 'en_plazo',
    start_date DATE NOT NULL,
    end_date_estimated DATE NOT NULL,
    end_date_contractual DATE NOT NULL,
    budgeted_hh NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    budgeted_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    margin_estimated NUMERIC(5, 2) NOT NULL DEFAULT 0.00, -- e.g. 25.50 %
    potential_penalties NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    risks_active TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_dates CHECK (end_date_contractual >= start_date AND end_date_estimated >= start_date)
);

-- Project Progress snapshots
CREATE TABLE project_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    progress_percentage NUMERIC(5, 2) NOT NULL CONSTRAINT check_progress CHECK (progress_percentage BETWEEN 0.00 AND 100.00),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Certifications Catalog
CREATE TABLE certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type certification_type NOT NULL,
    description TEXT,
    validity_days INTEGER NOT NULL, -- duration of validity in days
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employee Certifications
CREATE TABLE employee_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    certification_id UUID NOT NULL REFERENCES certifications(id) ON DELETE RESTRICT,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    document_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_expiry CHECK (expiry_date > issue_date)
);

-- Crews (Cuadrillas)
CREATE TABLE crews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    leader_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL, -- Currently assigned project
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crew Assignments (History of employees in crews)
CREATE TABLE crew_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unassigned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_assignment_dates CHECK (unassigned_at IS NULL OR unassigned_at >= assigned_at)
);

-- Equipment and Fleet (Grúas, aparejos, vehículos, herramientas)
CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g. EQ-GRU-01
    type VARCHAR(100) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    status equipment_status NOT NULL DEFAULT 'disponible',
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    is_rented BOOLEAN NOT NULL DEFAULT FALSE,
    rental_cost_monthly NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    location VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Maintenance Logs
CREATE TABLE maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    maintenance_date DATE NOT NULL,
    description TEXT NOT NULL,
    cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    performed_by VARCHAR(255),
    next_scheduled_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Work Logs (Partes diarios / Horas Hombre)
CREATE TABLE work_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    crew_id UUID REFERENCES crews(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    normal_hours NUMERIC(4, 2) NOT NULL CONSTRAINT check_normal_hours CHECK (normal_hours BETWEEN 0.00 AND 24.00),
    overtime_hours_50 NUMERIC(4, 2) NOT NULL DEFAULT 0.00 CONSTRAINT check_ot_50 CHECK (overtime_hours_50 BETWEEN 0.00 AND 24.00),
    overtime_hours_100 NUMERIC(4, 2) NOT NULL DEFAULT 0.00 CONSTRAINT check_ot_100 CHECK (overtime_hours_100 BETWEEN 0.00 AND 24.00),
    description TEXT,
    recorded_by UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_total_hours CHECK ((normal_hours + overtime_hours_50 + overtime_hours_100) <= 24.00)
);

-- Suppliers
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cuit VARCHAR(20) UNIQUE NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Purchase Orders (Compras de obra)
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- e.g. pending, approved, delivered, cancelled
    delivery_date_expected DATE,
    delivery_date_actual DATE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoices (Facturación a Clientes)
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status invoice_status NOT NULL DEFAULT 'emitida',
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE,
    tax_percentage NUMERIC(4, 2) NOT NULL DEFAULT 21.00,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_invoice_dates CHECK (due_date >= issue_date)
);

-- Payments Received
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(100),
    reference_number VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Miscellaneous Project Costs (Fletes, subcontratos, etc.)
CREATE TABLE project_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- e.g. 'materials', 'rentals', 'subcontractors', 'logistics', 'other'
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alerts System (Alertas en tiempo real)
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- e.g. 'maintenance_expired', 'certification_expired', 'project_delayed', 'hh_exceeded', 'invoice_expired', etc.
    severity alert_severity NOT NULL DEFAULT 'info',
    priority alert_priority NOT NULL DEFAULT 'medium',
    message TEXT NOT NULL,
    suggested_action TEXT,
    status alert_state NOT NULL DEFAULT 'active',
    assignee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alert state transitions history (for auditing responses)
CREATE TABLE alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    status alert_state NOT NULL,
    changed_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System Audit Logs (Full traceability)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- References auth.users(id), not enforced by FK to preserve logs on user deletion
    action VARCHAR(20) NOT NULL, -- e.g. INSERT, UPDATE, DELETE
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    client_ip VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================================================================
-- 3. INDEXES FOR PERFORMANCE OPTIMIZATION
-- =========================================================================

-- Projects & Progress
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_company ON projects(company_id);
CREATE INDEX idx_project_progress_project ON project_progress(project_id, recorded_at DESC);

-- Employees & Certifications
CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_emp_certs_employee ON employee_certifications(employee_id);
CREATE INDEX idx_emp_certs_expiry ON employee_certifications(expiry_date);

-- Work logs / HH (very large table)
CREATE INDEX idx_work_logs_project_date ON work_logs(project_id, date);
CREATE INDEX idx_work_logs_employee_date ON work_logs(employee_id, date);

-- Invoices & Payments
CREATE INDEX idx_invoices_project_status ON invoices(project_id, status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);

-- Alerts
CREATE INDEX idx_alerts_status_severity ON alerts(status, severity);
CREATE INDEX idx_alerts_project ON alerts(project_id);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);


-- =========================================================================
-- 4. MATERIALIZED VIEWS (For 60s Executive Load)
-- =========================================================================

-- Financial Pulse Materialized View
-- Aggregate monthly billings, targets, projections, margins, and accounts receivables
CREATE MATERIALIZED VIEW mv_financial_pulse AS
WITH invoice_totals AS (
    SELECT 
        i.project_id,
        COALESCE(SUM(CASE WHEN i.status = 'pagada' THEN i.amount ELSE 0 END), 0) AS total_collected,
        COALESCE(SUM(CASE WHEN i.status IN ('emitida', 'pagada_parcial', 'vencida') THEN i.amount ELSE 0 END), 0) AS total_receivable,
        COALESCE(SUM(CASE WHEN i.status = 'vencida' OR (i.status IN ('emitida', 'pagada_parcial') AND i.due_date < CURRENT_DATE) THEN i.amount ELSE 0 END), 0) AS overdue_debt
    FROM invoices i
    WHERE i.status != 'anulada'
    GROUP BY i.project_id
),
labor_costs AS (
    SELECT 
        wl.project_id,
        SUM((wl.normal_hours + wl.overtime_hours_50 * 1.5 + wl.overtime_hours_100 * 2.0) * e.hourly_rate) AS total_labor_cost,
        SUM(wl.normal_hours + wl.overtime_hours_50 + wl.overtime_hours_100) AS total_hours_consumed
    FROM work_logs wl
    JOIN employees e ON wl.employee_id = e.id
    GROUP BY wl.project_id
),
other_costs AS (
    SELECT 
        project_id,
        SUM(amount) AS total_other_cost
    FROM project_costs
    GROUP BY project_id
),
purchase_costs AS (
    SELECT 
        project_id,
        SUM(amount) AS total_purchase_cost
    FROM purchase_orders
    WHERE status IN ('approved', 'delivered')
    GROUP BY project_id
),
project_financials AS (
    SELECT 
        p.id AS project_id,
        p.name AS project_name,
        p.client_name,
        p.budgeted_cost,
        COALESCE(it.total_collected, 0) + COALESCE(it.total_receivable, 0) AS total_billed,
        COALESCE(it.total_collected, 0) AS total_collected,
        COALESCE(it.total_receivable, 0) AS total_receivable,
        COALESCE(it.overdue_debt, 0) AS overdue_debt,
        COALESCE(lc.total_labor_cost, 0) AS total_labor_cost,
        COALESCE(lc.total_hours_consumed, 0) AS total_hours_consumed,
        COALESCE(oc.total_other_cost, 0) + COALESCE(pc.total_purchase_cost, 0) AS total_material_operational_cost
    FROM projects p
    LEFT JOIN invoice_totals it ON p.id = it.project_id
    LEFT JOIN labor_costs lc ON p.id = lc.project_id
    LEFT JOIN other_costs oc ON p.id = oc.project_id
    LEFT JOIN purchase_costs pc ON p.id = pc.project_id
)
SELECT 
    pf.project_id,
    pf.project_name,
    pf.client_name,
    pf.budgeted_cost,
    pf.total_billed,
    pf.total_collected,
    pf.total_receivable,
    pf.overdue_debt,
    pf.total_hours_consumed,
    (pf.total_labor_cost + pf.total_material_operational_cost) AS total_real_cost,
    pf.budgeted_cost - (pf.total_labor_cost + pf.total_material_operational_cost) AS estimated_margin_amount,
    CASE 
        WHEN pf.budgeted_cost > 0 THEN 
            ROUND(((pf.budgeted_cost - (pf.total_labor_cost + pf.total_material_operational_cost)) / pf.budgeted_cost) * 100, 2)
        ELSE 0.00
    END AS real_margin_percentage
FROM project_financials pf;

CREATE UNIQUE INDEX idx_mv_financial_pulse_project ON mv_financial_pulse(project_id);

-- Man-hours (HH) Aggregations Materialized View
CREATE MATERIALIZED VIEW mv_project_hh_summary AS
SELECT 
    p.id AS project_id,
    p.name AS project_name,
    p.budgeted_hh,
    COALESCE(SUM(wl.normal_hours), 0) AS normal_hours_consumed,
    COALESCE(SUM(wl.overtime_hours_50), 0) AS ot_50_hours_consumed,
    COALESCE(SUM(wl.overtime_hours_100), 0) AS ot_100_hours_consumed,
    COALESCE(SUM(wl.normal_hours + wl.overtime_hours_50 + wl.overtime_hours_100), 0) AS total_hours_consumed,
    -- Projected HH (Extrapolation based on latest progress)
    CASE 
        WHEN COALESCE(latest_prog.progress_percentage, 0) > 0 THEN
            ROUND((COALESCE(SUM(wl.normal_hours + wl.overtime_hours_50 + wl.overtime_hours_100), 0) / (latest_prog.progress_percentage / 100)), 2)
        ELSE 0
    END AS projected_hours_total,
    -- Deviation KPI
    COALESCE(SUM(wl.normal_hours + wl.overtime_hours_50 + wl.overtime_hours_100), 0) - p.budgeted_hh AS hours_deviation
FROM projects p
LEFT JOIN work_logs wl ON p.id = wl.project_id AND wl.approved_at IS NOT NULL
LEFT JOIN LATERAL (
    SELECT progress_percentage 
    FROM project_progress 
    WHERE project_id = p.id 
    ORDER BY recorded_at DESC 
    LIMIT 1
) latest_prog ON TRUE
GROUP BY p.id, p.name, p.budgeted_hh, latest_prog.progress_percentage;

CREATE UNIQUE INDEX idx_mv_project_hh_summary_project ON mv_project_hh_summary(project_id);

-- Refresh function to run on scheduler or updates
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_financial_pulse;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_project_hh_summary;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger refresh on progress changes or hourly work additions
CREATE TRIGGER refresh_mvs_on_progress
AFTER INSERT OR UPDATE OR DELETE ON project_progress
FOR EACH STATEMENT EXECUTE FUNCTION refresh_materialized_views();

CREATE TRIGGER refresh_mvs_on_work_log
AFTER INSERT OR UPDATE OR DELETE ON work_logs
FOR EACH STATEMENT EXECUTE FUNCTION refresh_materialized_views();

CREATE TRIGGER refresh_mvs_on_invoice
AFTER INSERT OR UPDATE OR DELETE ON invoices
FOR EACH STATEMENT EXECUTE FUNCTION refresh_materialized_views();


-- =========================================================================
-- 5. AUTOMATIONS, TRIGGERS & CONSTRAINTS
-- =========================================================================

-- Trigger to update updated_at timestamp on alerts table
CREATE OR REPLACE FUNCTION update_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_alerts_timestamp
BEFORE UPDATE ON alerts
FOR EACH ROW EXECUTE FUNCTION update_alerts_updated_at();

-- Trigger to keep history of alert state changes
CREATE OR REPLACE FUNCTION log_alert_history()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO alert_history (alert_id, status, changed_by, comment)
        VALUES (NEW.id, NEW.status, auth.uid(), 'Estado cambiado automáticamente o por usuario');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_alert_history
AFTER UPDATE ON alerts
FOR EACH ROW EXECUTE FUNCTION log_alert_history();

-- Trigger: Block invalid employee assignments to crews based on certification requirements
CREATE OR REPLACE FUNCTION check_employee_crew_assignment_validity()
RETURNS TRIGGER AS $$
DECLARE
    v_project_id UUID;
    v_missing_certs INTEGER;
BEGIN
    -- 1. Find if the crew is assigned to a project
    SELECT project_id INTO v_project_id 
    FROM crews 
    WHERE id = NEW.crew_id;

    -- If the crew is currently assigned to a project, validate certifications
    IF v_project_id IS NOT NULL THEN
        -- Verify if employee has active safety & industry certifications.
        -- Imeca requires all employees on sites to have 'seguridad_industrial' + specializations (like altura/confinado/soldadura)
        -- In this template, we verify if they have AT LEAST active 'seguridad_industrial'
        -- and if the project name contains 'soldadura' or 'cañería', they must have active 'soldadura_3g' or 'soldadura_6g'.
        
        SELECT COUNT(*) INTO v_missing_certs
        FROM (
            SELECT 'seguridad_industrial'::certification_type AS required_type
            UNION
            -- Conditional required certifications based on project characteristics
            SELECT 'soldadura_6g'::certification_type
            WHERE EXISTS (
                SELECT 1 FROM projects 
                WHERE id = v_project_id AND (name ILIKE '%soldadura%' OR name ILIKE '%tubería%' OR name ILIKE '%cañería%')
            )
        ) req
        WHERE req.required_type NOT IN (
            SELECT c.type 
            FROM employee_certifications ec
            JOIN certifications c ON ec.certification_id = c.id
            WHERE ec.employee_id = NEW.employee_id 
              AND ec.expiry_date >= CURRENT_DATE
        );

        IF v_missing_certs > 0 THEN
            RAISE EXCEPTION 'Asignación Bloqueada: El empleado no posee las certificaciones de seguridad o soldadura requeridas y vigentes para este tipo de obra.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_crew_assignment
BEFORE INSERT OR UPDATE ON crew_assignments
FOR EACH ROW EXECUTE FUNCTION check_employee_crew_assignment_validity();

-- Automation: Trigger to Auto-Generate Alerts
CREATE OR REPLACE FUNCTION evaluate_and_generate_alerts()
RETURNS TRIGGER AS $$
DECLARE
    v_project_name VARCHAR;
    v_budgeted_hh NUMERIC;
    v_consumed_hh NUMERIC;
    v_due_date DATE;
    v_invoice_number VARCHAR;
    v_client_name VARCHAR;
BEGIN
    -- ALERT A: Overbudget HH detection on Work Log approvals
    IF TG_TABLE_NAME = 'work_logs' AND NEW.approved_at IS NOT NULL AND OLD.approved_at IS NULL THEN
        SELECT name, budgeted_hh INTO v_project_name, v_budgeted_hh 
        FROM projects WHERE id = NEW.project_id;
        
        SELECT SUM(normal_hours + overtime_hours_50 + overtime_hours_100) INTO v_consumed_hh 
        FROM work_logs 
        WHERE project_id = NEW.project_id AND approved_at IS NOT NULL;
        
        IF v_consumed_hh > v_budgeted_hh THEN
            -- Check if alert already exists to prevent duplicate alert spam
            IF NOT EXISTS (
                SELECT 1 FROM alerts 
                WHERE project_id = NEW.project_id 
                  AND type = 'hh_exceeded' 
                  AND status = 'active'
            ) THEN
                INSERT INTO alerts (project_id, type, severity, priority, message, suggested_action)
                VALUES (
                    NEW.project_id,
                    'hh_exceeded',
                    'critical',
                    'high',
                    format('Sobreconsumo de HH en la obra %s. Consumidas: %s, Presupuestadas: %s.', v_project_name, v_consumed_hh, v_budgeted_hh),
                    'Revisar distribución de tareas, eficiencia de la cuadrilla y suspender horas extra no críticas.'
                );
            END IF;
        END IF;
    END IF;

    -- ALERT B: Invoice Overdue detection (when invoice is marked as emitted / status updated)
    IF TG_TABLE_NAME = 'invoices' AND NEW.status = 'vencida' AND OLD.status != 'vencida' THEN
        SELECT p.name, p.client_name INTO v_project_name, v_client_name
        FROM projects p WHERE p.id = NEW.project_id;

        INSERT INTO alerts (project_id, type, severity, priority, message, suggested_action)
        VALUES (
            NEW.project_id,
            'invoice_expired',
            'critical',
            'high',
            format('Factura Vencida Impaga N° %s por cliente %s. Monto: %s.', NEW.invoice_number, v_client_name, NEW.amount),
            'Iniciar reclamo administrativo con departamento de compras del cliente y evaluar paralización de obra.'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_alerts_work_log
AFTER UPDATE ON work_logs
FOR EACH ROW EXECUTE FUNCTION evaluate_and_generate_alerts();

CREATE TRIGGER trg_alerts_invoice
AFTER UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION evaluate_and_generate_alerts();


-- =========================================================================
-- 6. SYSTEM AUDIT TRIGGER (Universal Logging)
-- =========================================================================

CREATE OR REPLACE FUNCTION process_audit_logging()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_old_json JSONB := NULL;
    v_new_json JSONB := NULL;
    v_record_id UUID;
BEGIN
    -- Extract auth.uid() safely if execution happens inside Supabase transaction context
    BEGIN
        v_user_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF (TG_OP = 'DELETE') THEN
        v_old_json := to_jsonb(OLD);
        v_record_id := OLD.id;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_old_json := to_jsonb(OLD);
        v_new_json := to_jsonb(NEW);
        v_record_id := NEW.id;
    ELSIF (TG_OP = 'INSERT') THEN
        v_new_json := to_jsonb(NEW);
        v_record_id := NEW.id;
    END IF;

    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (v_user_id, TG_OP, TG_TABLE_NAME, v_record_id, v_old_json, v_new_json);

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply Audit Trigger to Critical Tables
CREATE TRIGGER audit_projects AFTER INSERT OR UPDATE OR DELETE ON projects FOR EACH ROW EXECUTE FUNCTION process_audit_logging();
CREATE TRIGGER audit_employees AFTER INSERT OR UPDATE OR DELETE ON employees FOR EACH ROW EXECUTE FUNCTION process_audit_logging();
CREATE TRIGGER audit_employee_certifications AFTER INSERT OR UPDATE OR DELETE ON employee_certifications FOR EACH ROW EXECUTE FUNCTION process_audit_logging();
CREATE TRIGGER audit_work_logs AFTER INSERT OR UPDATE OR DELETE ON work_logs FOR EACH ROW EXECUTE FUNCTION process_audit_logging();
CREATE TRIGGER audit_invoices AFTER INSERT OR UPDATE OR DELETE ON invoices FOR EACH ROW EXECUTE FUNCTION process_audit_logging();
CREATE TRIGGER audit_crew_assignments AFTER INSERT OR UPDATE OR DELETE ON crew_assignments FOR EACH ROW EXECUTE FUNCTION process_audit_logging();


-- =========================================================================
-- 7. SECURITY: ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable Row Level Security on all core tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper Function to resolve current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
DECLARE
    v_role user_role;
BEGIN
    SELECT role INTO v_role 
    FROM public.users 
    WHERE id = auth.uid();
    
    RETURN COALESCE(v_role, 'operador'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- POLICIES FOR PROJECTS (OBRAS) ---
-- Presidente, Director, Gerencia & Finanzas can do all actions (CRUD)
CREATE POLICY projects_executive_all ON projects
    FOR ALL
    TO authenticated
    USING (get_current_user_role() IN ('presidente', 'director', 'gerencia', 'finanzas'))
    WITH CHECK (get_current_user_role() IN ('presidente', 'director', 'gerencia', 'finanzas'));

-- Jefe de Obra can read all, and edit progress details on their assigned projects
CREATE POLICY projects_jefe_read ON projects
    FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY projects_jefe_update_assigned ON projects
    FOR UPDATE
    TO authenticated
    USING (get_current_user_role() = 'jefe_de_obra' AND manager_id = auth.uid())
    WITH CHECK (get_current_user_role() = 'jefe_de_obra' AND manager_id = auth.uid());

-- Supervisor and Operadores can only view projects
CREATE POLICY projects_read_only ON projects
    FOR SELECT
    TO authenticated
    USING (TRUE);

-- --- POLICIES FOR ALERTS ---
-- All authenticated users can view active alerts (needed for global SCADA alerts)
CREATE POLICY alerts_select_all ON alerts
    FOR SELECT
    TO authenticated
    USING (TRUE);

-- Presidente, Director, Gerencia can modify alerts state (Acknowledge / Resolve)
CREATE POLICY alerts_update_exec ON alerts
    FOR UPDATE
    TO authenticated
    USING (get_current_user_role() IN ('presidente', 'director', 'gerencia', 'finanzas'))
    WITH CHECK (get_current_user_role() IN ('presidente', 'director', 'gerencia', 'finanzas'));

-- Jefe de obra can update alerts directly linked to their assigned projects
CREATE POLICY alerts_update_jefe ON alerts
    FOR UPDATE
    TO authenticated
    USING (
        get_current_user_role() = 'jefe_de_obra' AND 
        project_id IN (SELECT id FROM projects WHERE manager_id = auth.uid())
    )
    WITH CHECK (
        get_current_user_role() = 'jefe_de_obra' AND 
        project_id IN (SELECT id FROM projects WHERE manager_id = auth.uid())
    );

-- --- POLICIES FOR FINANCIALS (INVOICES, PAYMENTS, COSTS) ---
-- ONLY Presidente, Director, Gerencia and Finanzas have access to financial metrics
CREATE POLICY financials_exec_select ON invoices
    FOR SELECT TO authenticated
    USING (get_current_user_role() IN ('presidente', 'director', 'gerencia', 'finanzas'));

CREATE POLICY financials_exec_all ON invoices
    FOR ALL TO authenticated
    USING (get_current_user_role() IN ('presidente', 'director', 'gerencia', 'finanzas'))
    WITH CHECK (get_current_user_role() IN ('presidente', 'director', 'gerencia', 'finanzas'));

CREATE POLICY payments_exec_all ON payments
    FOR ALL TO authenticated
    USING (get_current_user_role() IN ('presidente', 'director', 'gerencia', 'finanzas'))
    WITH CHECK (get_current_user_role() IN ('presidente', 'director', 'gerencia', 'finanzas'));

-- Jefes de Obra, Supervisores, and Operadores CANNOT read or write any financial tables (Blocked by default under RLS SELECT restriction)

-- --- POLICIES FOR RRHH & WORK LOGS ---
-- RRHH role can do everything on employees & certifications
CREATE POLICY rrhh_employees_all ON employees
    FOR ALL TO authenticated
    USING (get_current_user_role() IN ('presidente', 'director', 'gerencia', 'rrhh'))
    WITH CHECK (get_current_user_role() IN ('presidente', 'director', 'gerencia', 'rrhh'));

CREATE POLICY rrhh_certifications_all ON employee_certifications
    FOR ALL TO authenticated
    USING (get_current_user_role() IN ('presidente', 'director', 'gerencia', 'rrhh'))
    WITH CHECK (get_current_user_role() IN ('presidente', 'director', 'gerencia', 'rrhh'));

-- Work logs: Jefes de obra and supervisors can insert work logs (partes diarios)
CREATE POLICY work_logs_insert_supervisor ON work_logs
    FOR INSERT TO authenticated
    WITH CHECK (get_current_user_role() IN ('jefe_de_obra', 'supervisor'));

-- ONLY Gerencia, Director, or Presidente can APPROVE work logs (updating approved_at)
CREATE POLICY work_logs_approve_exec ON work_logs
    FOR UPDATE TO authenticated
    USING (get_current_user_role() IN ('presidente', 'director', 'gerencia'))
    WITH CHECK (get_current_user_role() IN ('presidente', 'director', 'gerencia'));

-- Enable Supabase Realtime for Dashboard alerts and projects
-- Realtime triggers are handled by adding tables to supabase_realtime publication
alter publication supabase_realtime add table projects, project_progress, alerts, work_logs, invoices;
