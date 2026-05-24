import { create } from 'zustand';
import { Project, Employee, Alert, Crew, Equipment, FinancialPulse, ProjectStatus, AlertSeverity, AlertPriority, AlertState, UserRole, CertificationType } from '../types';

interface DataState {
  projects: Project[];
  employees: Employee[];
  alerts: Alert[];
  crews: Crew[];
  equipment: Equipment[];
  financials: FinancialPulse;
  
  // Real-time mutations
  updateProjectProgress: (projectId: string, progressPercentage: number, comments?: string, recordedBy?: string) => void;
  updateProjectStatus: (projectId: string, status: ProjectStatus) => void;
  acknowledgeAlert: (alertId: string, employeeId: string, comment?: string) => void;
  resolveAlert: (alertId: string, employeeId: string, comment?: string) => void;
  assignEmployeeToCrew: (employeeId: string, crewId: string) => { success: boolean; error?: string };
  removeEmployeeFromCrew: (employeeId: string, crewId: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  triggerRealtimeUpdate: (payload: any) => void;
}

// Helper to generate 60 realistic employees
const firstNames = ['Carlos', 'Juan', 'Luis', 'Pedro', 'Miguel', 'Jorge', 'Diego', 'Jose', 'Andres', 'Alejandro', 'Gabriel', 'Roberto', 'Daniel', 'Javier', 'Oscar', 'Ruben', 'Marcelo', 'Gustavo', 'Eduardo', 'Federico', 'Gaston', 'Mauricio', 'Claudio', 'Héctor', 'Julio', 'Ricardo', 'Walter', 'Mario', 'Hernan', 'Pablo'];
const lastNames = ['Gomez', 'Rodriguez', 'Fernandez', 'Gonzalez', 'Martinez', 'Lopez', 'Diaz', 'Perez', 'Sanchez', 'Romero', 'Alvarez', 'Ruiz', 'Ramirez', 'Torres', 'Acosta', 'Benitez', 'Medina', 'Herrera', 'Aguirre', 'Guzman', 'Ledesma', 'Maldonado', 'Pereira', 'Castro', 'Sosa', 'Gimenez', 'Silva', 'Suarez', 'Rios', 'Ortega'];

const generateEmployees = (): Employee[] => {
  const list: Employee[] = [];
  
  // 1. Executives (4)
  list.push({ id: 'emp-exec-1', first_name: 'Alberto', last_name: 'Imeca', dni: '14.234.876', role: 'presidente', is_active: true, hourly_rate: 150, certifications: [] });
  list.push({ id: 'emp-exec-2', first_name: 'Lucas', last_name: 'Imeca', dni: '22.876.543', role: 'director', is_active: true, hourly_rate: 120, certifications: [] });
  list.push({ id: 'emp-exec-3', first_name: 'Martin', last_name: 'Ghirardi', dni: '25.321.654', role: 'gerencia', is_active: true, hourly_rate: 90, certifications: [] });
  list.push({ id: 'emp-exec-4', first_name: 'Sofia', last_name: 'Peralta', dni: '29.765.432', role: 'finanzas', is_active: true, hourly_rate: 70, certifications: [] });
  list.push({ id: 'emp-exec-5', first_name: 'Valeria', last_name: 'Mendez', dni: '31.456.987', role: 'rrhh', is_active: true, hourly_rate: 65, certifications: [] });

  // 2. Jefes de Obra (10)
  for (let i = 1; i <= 10; i++) {
    list.push({
      id: `emp-mgr-${i}`,
      first_name: firstNames[i % firstNames.length],
      last_name: lastNames[i % lastNames.length] + ' (PM)',
      dni: `20.${100000 + i * 452}`,
      role: 'jefe_de_obra',
      is_active: true,
      hourly_rate: 55,
      certifications: [
        {
          id: `cert-mgr-${i}`,
          employee_id: `emp-mgr-${i}`,
          certification_id: 'c-seg',
          certification_name: 'Seguridad Industrial Avanzada',
          type: 'seguridad_industrial',
          issue_date: '2025-01-10',
          expiry_date: '2027-01-10',
          is_valid: true
        }
      ]
    });
  }

  // 3. Supervisors (8)
  for (let i = 1; i <= 8; i++) {
    list.push({
      id: `emp-sup-${i}`,
      first_name: firstNames[(i + 5) % firstNames.length],
      last_name: lastNames[(i + 8) % lastNames.length] + ' (Sup)',
      dni: `23.${200000 + i * 831}`,
      role: 'supervisor',
      is_active: true,
      hourly_rate: 45,
      certifications: [
        {
          id: `cert-sup-${i}`,
          employee_id: `emp-sup-${i}`,
          certification_id: 'c-seg',
          certification_name: 'Seguridad Industrial',
          type: 'seguridad_industrial',
          issue_date: '2025-03-15',
          expiry_date: '2026-03-15',
          is_valid: true
        }
      ]
    });
  }

  // 4. Operators / Soldadores / Montadores (37)
  const certTypes: { type: CertificationType; name: string }[] = [
    { type: 'soldadura_3g', name: 'Soldadura Calificada 3G' },
    { type: 'soldadura_6g', name: 'Soldadura Alta Presión 6G' },
    { type: 'espacios_confinados', name: 'Ingreso a Espacios Confinados' },
    { type: 'altura', name: 'Trabajo en Altura Habilitado' },
    { type: 'gruas', name: 'Operación de Grúas Pesadas' },
    { type: 'izaje', name: 'Rigging e Izajes Críticos' }
  ];

  for (let i = 1; i <= 37; i++) {
    const fn = firstNames[(i + 10) % firstNames.length];
    const ln = lastNames[(i + 12) % lastNames.length];
    
    // Assign 1 or 2 certifications randomly
    const certIndex = i % certTypes.length;
    const certIndex2 = (i + 2) % certTypes.length;
    const isExpired = i === 12; // Force employee 12 to have expired certification for alert triggering
    const isExpiringSoon = i === 25; // Force employee 25 to expire soon
    
    const expDate = isExpired 
      ? '2026-02-15' // Expired
      : isExpiringSoon 
      ? '2026-06-10' // Expiring in ~2 weeks from current mock date
      : '2027-08-20';

    const empId = `emp-op-${i}`;
    const certs = [
      {
        id: `c-1-${i}`,
        employee_id: empId,
        certification_id: `cat-${certIndex}`,
        certification_name: certTypes[certIndex].name,
        type: certTypes[certIndex].type,
        issue_date: '2025-06-01',
        expiry_date: expDate,
        is_valid: !isExpired
      },
      {
        id: `c-2-${i}`,
        employee_id: empId,
        certification_id: 'c-seg',
        certification_name: 'Seguridad Industrial Básica',
        type: 'seguridad_industrial' as CertificationType,
        issue_date: '2025-01-01',
        expiry_date: '2027-01-01',
        is_valid: true
      }
    ];

    list.push({
      id: empId,
      first_name: fn,
      last_name: ln,
      dni: `32.${300000 + i * 597}`,
      role: 'operador',
      is_active: true,
      hourly_rate: 35,
      certifications: certs
    });
  }

  return list;
};

// Initial Projects Dataset (10 Projects)
const initialProjects: Project[] = [
  {
    id: 'prj-1',
    name: 'Ampliación Compresión El Zaimán - Techint',
    code: 'OB-2026-001',
    client_name: 'Techint / YPF Gas',
    manager_id: 'emp-mgr-1',
    manager_name: 'Carlos Gomez',
    status: 'en_plazo',
    start_date: '2026-01-15',
    end_date_estimated: '2026-10-30',
    end_date_contractual: '2026-11-15',
    budgeted_hh: 8500,
    consumed_hh: 3200,
    projected_hh: 8200,
    budgeted_cost: 38000000,
    real_cost: 14200000,
    margin_estimated: 28.5,
    real_margin: 29.8,
    potential_penalties: 0,
    risks_active: ['Interferencias con ducto existente', 'Demora climática por lluvias']
  },
  {
    id: 'prj-2',
    name: 'Montaje Tuberías de Proceso Refinería Luján de Cuyo',
    code: 'OB-2026-002',
    client_name: 'YPF S.A.',
    manager_id: 'emp-mgr-2',
    manager_name: 'Juan Fernandez',
    status: 'en_riesgo',
    start_date: '2025-11-01',
    end_date_estimated: '2026-07-15',
    end_date_contractual: '2026-07-20',
    budgeted_hh: 12000,
    consumed_hh: 11400,
    projected_hh: 14250, // Projected overrun
    budgeted_cost: 54000000,
    real_cost: 51200000,
    margin_estimated: 22.0,
    real_margin: 5.2, // Drastically reduced margin
    potential_penalties: 5000000,
    risks_active: ['Sobreconsumo crítico de HH soldadura', 'Demora de entrega spools por parte del proveedor']
  },
  {
    id: 'prj-3',
    name: 'Tanque Almacenamiento Crudo TK-500 Shell',
    code: 'OB-2026-003',
    client_name: 'Shell / Raízen',
    manager_id: 'emp-mgr-3',
    manager_name: 'Luis Lopez',
    status: 'atrasada',
    start_date: '2025-09-01',
    end_date_estimated: '2026-08-30', // Delayed
    end_date_contractual: '2026-06-30', // Breached contractual date!
    budgeted_hh: 16000,
    consumed_hh: 14500,
    projected_hh: 18500,
    budgeted_cost: 72000000,
    real_cost: 65250000,
    margin_estimated: 25.0,
    real_margin: 9.3,
    potential_penalties: 12500000,
    risks_active: ['Penalidades por entrega atrasada', 'Conflicto gremial por horas extras']
  },
  {
    id: 'prj-4',
    name: 'Parada de Planta Dow Chemical 2026',
    code: 'OB-2026-004',
    client_name: 'Dow Chemical Argentina',
    manager_id: 'emp-mgr-4',
    manager_name: 'Pedro Martinez',
    status: 'detenida',
    start_date: '2026-05-01',
    end_date_estimated: '2026-06-15',
    end_date_contractual: '2026-06-05',
    budgeted_hh: 4500,
    consumed_hh: 2100,
    projected_hh: 5100,
    budgeted_cost: 21000000,
    real_cost: 11000000,
    margin_estimated: 32.0,
    real_margin: 30.2,
    potential_penalties: 8000000,
    risks_active: ['Operación detenida por incidente de seguridad', 'Plan de izaje observado']
  },
  {
    id: 'prj-5',
    name: 'Línea de Vapor Alta Presión Axion Dock Sud',
    code: 'OB-2026-005',
    client_name: 'Axion Energy',
    manager_id: 'emp-mgr-5',
    manager_name: 'Miguel Gonzalez',
    status: 'en_plazo',
    start_date: '2026-03-10',
    end_date_estimated: '2026-09-15',
    end_date_contractual: '2026-09-30',
    budgeted_hh: 7500,
    consumed_hh: 2800,
    projected_hh: 7300,
    budgeted_cost: 32500000,
    real_cost: 11800000,
    margin_estimated: 26.5,
    real_margin: 27.5,
    potential_penalties: 0,
    risks_active: ['Falta de repuestos para grúa en obra']
  },
  {
    id: 'prj-6',
    name: 'Montaje Estructuras Nave de Embarque Aluar',
    code: 'OB-2026-006',
    client_name: 'Aluar Aluminio Argentino',
    manager_id: 'emp-mgr-6',
    manager_name: 'Diego Lopez',
    status: 'por_cerrar',
    start_date: '2025-08-15',
    end_date_estimated: '2026-05-30',
    end_date_contractual: '2026-05-25',
    budgeted_hh: 14000,
    consumed_hh: 13900,
    projected_hh: 14000,
    budgeted_cost: 61000000,
    real_cost: 59500000,
    margin_estimated: 24.0,
    real_margin: 22.1,
    potential_penalties: 500000,
    risks_active: ['Retenciones de fondos por cierre contractual']
  },
  {
    id: 'prj-7',
    name: 'Adecuación Gasoducto Néstor Kirchner (Tramo II)',
    code: 'OB-2026-007',
    client_name: 'TGS (Transportadora Gas del Sur)',
    manager_id: 'emp-mgr-7',
    manager_name: 'Jose Diaz',
    status: 'en_plazo',
    start_date: '2026-04-01',
    end_date_estimated: '2026-12-15',
    end_date_contractual: '2026-12-31',
    budgeted_hh: 9800,
    consumed_hh: 1200,
    projected_hh: 9600,
    budgeted_cost: 48500000,
    real_cost: 5900000,
    margin_estimated: 27.0,
    real_margin: 27.8,
    potential_penalties: 0,
    risks_active: []
  },
  {
    id: 'prj-8',
    name: 'Prefabricado Spools Taller Campana',
    code: 'OB-2026-008',
    client_name: 'Imeca Interno (Stock)',
    manager_id: 'emp-mgr-8',
    manager_name: 'Andres Sanchez',
    status: 'en_plazo',
    start_date: '2026-02-01',
    end_date_estimated: '2026-08-30',
    end_date_contractual: '2026-08-30',
    budgeted_hh: 5000,
    consumed_hh: 2900,
    projected_hh: 4950,
    budgeted_cost: 19500000,
    real_cost: 11100000,
    margin_estimated: 30.0,
    real_margin: 31.5,
    potential_penalties: 0,
    risks_active: ['Suba de costo en chapa de acero']
  },
  {
    id: 'prj-9',
    name: 'Montaje Turbina de Vapor Central Costanera',
    code: 'OB-2026-009',
    client_name: 'Enel / Central Costanera',
    manager_id: 'emp-mgr-9',
    manager_name: 'Alejandro Romero',
    status: 'en_riesgo',
    start_date: '2026-02-15',
    end_date_estimated: '2026-11-15',
    end_date_contractual: '2026-10-31',
    budgeted_hh: 11000,
    consumed_hh: 5800,
    projected_hh: 12200,
    budgeted_cost: 49000000,
    real_cost: 26500000,
    margin_estimated: 25.5,
    real_margin: 20.8,
    potential_penalties: 2000000,
    risks_active: ['Demoras aduaneras en repuestos de turbina', 'Espacio físico reducido de maniobras']
  },
  {
    id: 'prj-10',
    name: 'Mantenimiento Ductos Bahía Blanca',
    code: 'OB-2026-010',
    client_name: 'Pampa Energía',
    manager_id: 'emp-mgr-10',
    manager_name: 'Gabriel Alvarez',
    status: 'en_plazo',
    start_date: '2026-05-01',
    end_date_estimated: '2026-07-31',
    end_date_contractual: '2026-07-31',
    budgeted_hh: 3500,
    consumed_hh: 600,
    projected_hh: 3500,
    budgeted_cost: 15800000,
    real_cost: 2700000,
    margin_estimated: 29.0,
    real_margin: 29.0,
    potential_penalties: 0,
    risks_active: []
  }
];

const initialAlerts: Alert[] = [
  {
    id: 'alt-1',
    project_id: 'prj-4',
    project_name: 'Parada de Planta Dow Chemical 2026',
    type: 'safety_incident',
    severity: 'critical',
    priority: 'high',
    message: 'Operación suspendida: Caída de andamio auxiliar en zona de reactores. Sin heridos graves, pero el área de seguridad (HSE) de Dow ordenó clausura del sector hasta peritaje.',
    suggested_action: 'Enviar de forma urgente al Gerente de Seguridad e Higiene para auditar andamiajes y presentar plan de remediación ante Dow.',
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'alt-2',
    project_id: 'prj-2',
    project_name: 'Montaje Tuberías de Proceso Refinería Luján de Cuyo',
    type: 'hh_exceeded',
    severity: 'critical',
    priority: 'high',
    message: 'Desvío Crítico en Mano de Obra: HH acumuladas (11,400 HH) alcanzando 95% del total presupuestado (12,000 HH) con solo 80% de avance real certificado.',
    suggested_action: 'Paralizar horas extra no aprobadas por gerencia. Evaluar eficiencia de soldadores de la cuadrilla A y desplazar personal auxiliar.',
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'alt-3',
    project_id: 'prj-3',
    project_name: 'Tanque Almacenamiento Crudo TK-500 Shell',
    type: 'project_delayed',
    severity: 'critical',
    priority: 'high',
    message: 'Riesgo Contractual Grave: Desvío acumulado en cronograma indica finalización para el 30/08/2026, superando la fecha límite contractual del 30/06/2026 en 60 días. Multa diaria de USD 5,000 activa a partir del 01/07.',
    suggested_action: 'Negociar adenda contractual con Shell citando interferencias climáticas aprobadas e inyectar cuadrilla de montaje adicional para doblar turnos.',
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(), // 24 hours ago
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'alt-4',
    project_id: 'prj-2',
    project_name: 'Montaje Tuberías de Proceso Refinería Luján de Cuyo',
    type: 'certification_expired',
    severity: 'warning',
    priority: 'medium',
    message: 'Operario Inhabilitado en Obra: El soldador Carlos Benitez (emp-op-12) está prestando tareas en la cuadrilla asignada a cañerías con su Certificación "Soldadura Alta Presión 6G" vencida el 15/02/2026.',
    suggested_action: 'Retirar al empleado de tareas de soldadura de presión inmediatamente. Programar recertificación en taller y reasignarlo a montaje general.',
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: 'alt-5',
    project_id: 'prj-5',
    project_name: 'Línea de Vapor Alta Presión Axion Dock Sud',
    type: 'maintenance_expired',
    severity: 'warning',
    priority: 'medium',
    message: 'Mantenimiento de Equipo Crítico Vencido: La Grúa Hidráulica Terex RT-780 (EQ-GRU-01) en obra superó la fecha de servicio programada el 15/05/2026 sin registro de inspección de cables.',
    suggested_action: 'Coordinar inspección in-situ con el supervisor mecánico el próximo fin de semana para no detener el ritmo de izajes.',
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: 'alt-6',
    project_id: 'prj-1',
    project_name: 'Ampliación Compresión El Zaimán - Techint',
    type: 'invoice_expired',
    severity: 'critical',
    priority: 'high',
    message: 'Deuda Crítica Excedida: Factura N° F-0001-0004382 a Techint por ARS 18.500.000 se encuentra impaga con 45 días de atraso sobre fecha de vencimiento contractual.',
    suggested_action: 'Solicitar reunión de crédito con compras de Techint y enviar carta de reclamo formal avalada legalmente.',
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 30).toISOString()
  }
];

const initialEquipment: Equipment[] = [
  { id: 'eq-1', name: 'Grúa Hidráulica Terex RT-780', code: 'EQ-GRU-01', type: 'Grúa', brand: 'Terex', model: 'RT-780', status: 'en_obra', project_id: 'prj-5', project_name: 'Línea de Vapor Alta Presión Axion Dock Sud', last_maintenance_date: '2025-11-15', next_maintenance_date: '2026-05-15', is_rented: false, rental_cost_monthly: 0, location: 'Dock Sud' },
  { id: 'eq-2', name: 'Grúa Todoterreno Grove GMK 5250', code: 'EQ-GRU-02', type: 'Grúa', brand: 'Grove', model: 'GMK 5250', status: 'mantenimiento', last_maintenance_date: '2026-05-10', next_maintenance_date: '2026-11-10', is_rented: true, rental_cost_monthly: 1200000, location: 'Taller Central Campana' },
  { id: 'eq-3', name: 'Generador Eléctrico Caterpillar 500kVA', code: 'EQ-GEN-01', type: 'Generador', brand: 'Caterpillar', model: 'C15', status: 'en_obra', project_id: 'prj-1', project_name: 'Ampliación Compresión El Zaimán - Techint', last_maintenance_date: '2026-02-10', next_maintenance_date: '2026-08-10', is_rented: false, rental_cost_monthly: 0, location: 'El Zaimán' },
  { id: 'eq-4', name: 'Manipulador Telescópico JCB 540-170', code: 'EQ-MAN-01', type: 'Manipulador', brand: 'JCB', model: '540-170', status: 'disponible', last_maintenance_date: '2026-03-20', next_maintenance_date: '2026-09-20', is_rented: false, rental_cost_monthly: 0, location: 'Taller Central Campana' },
  { id: 'eq-5', name: 'Equipo de Roscado e Izajes Hidráulicos', code: 'EQ-HER-08', type: 'Herramienta Crítica', brand: 'Enerpac', model: 'H-Suite', status: 'en_obra', project_id: 'prj-2', project_name: 'Montaje Tuberías de Proceso Refinería Luján de Cuyo', last_maintenance_date: '2026-01-05', next_maintenance_date: '2026-07-05', is_rented: false, rental_cost_monthly: 0, location: 'Luján de Cuyo' }
];

const initialCrews = (): Crew[] => [
  { id: 'crw-1', name: 'Cuadrilla Cañerías A (Luján)', leader_id: 'emp-sup-1', leader_name: 'Pedro (Sup)', project_id: 'prj-2', project_name: 'Montaje Tuberías de Proceso Refinería Luján de Cuyo', members_count: 12 },
  { id: 'crw-2', name: 'Cuadrilla Soldadura Alta Presión B', leader_id: 'emp-sup-2', leader_name: 'Juan (Sup)', project_id: 'prj-2', project_name: 'Montaje Tuberías de Proceso Refinería Luján de Cuyo', members_count: 8 },
  { id: 'crw-3', name: 'Cuadrilla Tanques & Estructura 1', leader_id: 'emp-sup-3', leader_name: 'Luis (Sup)', project_id: 'prj-3', project_name: 'Tanque Almacenamiento Crudo TK-500 Shell', members_count: 15 },
  { id: 'crw-4', name: 'Cuadrilla Montaje Mecánico Zaimán', leader_id: 'emp-sup-4', leader_name: 'Carlos (Sup)', project_id: 'prj-1', project_name: 'Ampliación Compresión El Zaimán - Techint', members_count: 10 },
  { id: 'crw-5', name: 'Cuadrilla Disponibilidad Taller', leader_id: 'emp-sup-5', leader_name: 'Gaston (Sup)', members_count: 5 }
];

const initialFinancials: FinancialPulse = {
  billing_monthly: 128500000,
  billing_target: 150000000,
  billing_projected: 139000000,
  gross_margin_avg: 24.2,
  accumulated_hh_cost: 41250000,
  overdue_debt: 28500000,
  pending_invoices: 19800000,
  accounts_receivable: 58900000,
  estimated_cashflow: 65400000
};

export const useDataStore = create<DataState>((set, get) => ({
  projects: initialProjects,
  employees: generateEmployees(),
  alerts: initialAlerts,
  crews: initialCrews(),
  equipment: initialEquipment,
  financials: initialFinancials,
  
  updateProjectProgress: (projectId, progressPercentage, comments, recordedBy) => set((state) => {
    const updatedProjects = state.projects.map((p) => {
      if (p.id === projectId) {
        // Calculate dynamic real cost adjustments on progress change
        const pctDiff = progressPercentage - (p.consumed_hh / p.projected_hh * 100);
        return {
          ...p,
          real_margin: Number((p.margin_estimated + (pctDiff * 0.1)).toFixed(1))
        };
      }
      return p;
    });
    
    // Automatically trigger alert evaluation on state update
    return { projects: updatedProjects };
  }),
  
  updateProjectStatus: (projectId, status) => set((state) => ({
    projects: state.projects.map((p) => p.id === projectId ? { ...p, status } : p)
  })),
  
  acknowledgeAlert: (alertId, employeeId, comment) => set((state) => {
    const emp = state.employees.find(e => e.id === employeeId);
    const updatedAlerts = state.alerts.map((a) => {
      if (a.id === alertId) {
        return {
          ...a,
          status: 'acknowledged' as AlertState,
          assignee_id: employeeId,
          assignee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Asignado',
          updated_at: new Date().toISOString()
        };
      }
      return a;
    });
    
    return { alerts: updatedAlerts };
  }),
  
  resolveAlert: (alertId, employeeId, comment) => set((state) => ({
    alerts: state.alerts.map((a) => {
      if (a.id === alertId) {
        return {
          ...a,
          status: 'resolved' as AlertState,
          updated_at: new Date().toISOString()
        };
      }
      return a;
    })
  })),
  
  assignEmployeeToCrew: (employeeId, crewId) => {
    const state = get();
    const emp = state.employees.find((e) => e.id === employeeId);
    const crew = state.crews.find((c) => c.id === crewId);
    
    if (!emp || !crew) {
      return { success: false, error: 'Empleado o Cuadrilla no encontrada.' };
    }
    
    // Check certifications logic (corresponds to trigger check_employee_crew_assignment_validity)
    if (crew.project_id) {
      const proj = state.projects.find((p) => p.id === crew.project_id);
      const requires6G = proj && (proj.name.includes('Tuberías') || proj.name.includes('Vapor'));
      
      const hasSecurity = emp.certifications.some(c => c.type === 'seguridad_industrial' && c.is_valid);
      const has6G = emp.certifications.some(c => c.type === 'soldadura_6g' && c.is_valid);
      
      if (!hasSecurity) {
        return { 
          success: false, 
          error: `Asignación Rechazada: El empleado ${emp.first_name} no tiene certificación activa de 'Seguridad Industrial'.` 
        };
      }
      
      if (requires6G && !has6G) {
        return { 
          success: false, 
          error: `Asignación Rechazada: Obra de Cañerías de Alta Presión requiere certificación vigente de 'Soldadura 6G'.` 
        };
      }
    }
    
    // Perform update
    set((state) => ({
      crews: state.crews.map((c) => {
        if (c.id === crewId) {
          return { ...c, members_count: c.members_count + 1 };
        }
        return c;
      })
    }));
    
    return { success: true };
  },
  
  removeEmployeeFromCrew: (employeeId, crewId) => set((state) => ({
    crews: state.crews.map((c) => {
      if (c.id === crewId) {
        return { ...c, members_count: Math.max(0, c.members_count - 1) };
      }
      return c;
    })
  })),
  
  triggerRealtimeUpdate: (payload) => set((state) => {
    // Process Supabase Realtime payloads on client-side state
    const { table, eventType, new: newRecord, old: oldRecord } = payload;
    
    if (table === 'alerts') {
      if (eventType === 'INSERT') {
        return { alerts: [newRecord, ...state.alerts] };
      } else if (eventType === 'UPDATE') {
        return { alerts: state.alerts.map(a => a.id === newRecord.id ? { ...a, ...newRecord } : a) };
      }
    } else if (table === 'projects') {
      if (eventType === 'UPDATE') {
        return { projects: state.projects.map(p => p.id === newRecord.id ? { ...p, ...newRecord } : p) };
      }
    }
    
    return state;
  })
}));
