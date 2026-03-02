import axios, { AxiosResponse } from 'axios';

// En producción usa rutas relativas para que Nginx haga el proxy
// En desarrollo usa localhost:5605
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// TYPES
// ============================================================================

// User & Auth Types
export interface User {
  id: number;
  username: string;
  full_name?: string;
  role: 'admin' | 'operator';
  permissions?: Record<string, boolean>;
}

// Operator Types
export interface Operator {
  person_id: number;
  name: string;
  is_active: boolean;
  is_paused: boolean;
  assignment_paused: boolean;
  notifications_enabled: boolean;
  whatsapp_number: string | null;
  paused_reason: string | null;
  paused_at: string | null;
  ticket_count: number;
  schedules?: Schedule[];
}

export interface Schedule {
  id: number;
  person_id: number;
  day_of_week: number; // 0 = Monday, 6 = Sunday
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  schedule_type: 'work' | 'assignment' | 'alert';
  is_active: boolean;
}

export interface OperatorConfig {
  is_paused?: boolean;
  assignment_paused?: boolean;
  notifications_enabled?: boolean;
  whatsapp_number?: string;
  paused_reason?: string;
  paused_by?: string;
  performed_by?: string;
}

// Dashboard & Stats Types
export interface DashboardStats {
  operators: {
    total: number;
    active: number;
    paused: number;
  };
  assignments: {
    total: number;
    today: number;
  };
  tickets: {
    unresolved: number;
    overdue: number;
    avg_response_time_minutes: number;
  };
  operator_stats: OperatorStats[];
}

export interface OperatorStats {
  person_id: number;
  name: string;
  is_active: boolean;
  is_paused: boolean;
  current_assignments: number;
  total_handled: number;
  unresolved: number;
  avg_response_time: number;
}

export interface SystemStatus {
  paused: boolean;
  paused_reason?: string;
  paused_at?: string;
  paused_by?: string;
}

// Assignment Types
export interface AssignmentStats {
  total_assignments: number;
  round_robin_index: number;
  last_assignment?: string;
}

// Config Types
export interface ConfigItem {
  key: string;
  value: string | number | boolean;
  description?: string;
  category?: string;
}

// Audit Types
export interface AuditLog {
  id: number;
  action: string;
  table_name: string;
  record_id: number;
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  performed_by: string;
  timestamp: string;
}

export interface ReassignmentHistory {
  id: number;
  ticket_id: number;
  from_operator_id: number | null;
  from_operator_name: string | null;
  to_operator_id: number | null;
  to_operator_name: string | null;
  reason: string;
  reassignment_type: 'manual' | 'auto_unassign' | 'end_of_shift' | 'splynx_sync';
  notification_sent: boolean;
  created_by: string;
  created_at: string;
}

// Metrics Types
export interface OperatorMetrics {
  person_id: number;
  name: string;
  total_tickets: number;
  resolved_tickets: number;
  avg_response_time: number;
  performance_score: number;
}

// Message Template Types
export interface MessageTemplate {
  id: number;
  name: string;
  message_type: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Device Analysis Types
export interface DeviceAnalysisRequest {
  device_id: number;
  analysis_type: string;
  parameters?: Record<string, any>;
}

export interface DeviceAnalysisResult {
  analysis_id: number;
  device_id: number;
  status: 'pending' | 'completed' | 'failed';
  results?: Record<string, any>;
  created_at: string;
  completed_at?: string;
}

export interface DeviceAnalysisFeedback {
  helpful: boolean;
  comment?: string;
}

// WhatsApp Types
export interface WhatsAppHealthStatus {
  status: string;
  evolution_api: boolean;
  instance: string;
}

export interface WhatsAppOperatorConfig {
  person_id: number;
  name: string;
  whatsapp_number: string | null;
  notifications_enabled: boolean;
  is_valid: boolean;
}

export interface WhatsAppSendTextRequest {
  phone_number: string;
  message: string;
}

export interface WhatsAppOverdueAlertTicket {
  id: string;
  subject: string;
  customer_name: string;
  response_time: number;
}

export interface WhatsAppOverdueAlertRequest {
  person_id: number;
  tickets_list: WhatsAppOverdueAlertTicket[];
}

export interface WhatsAppShiftSummaryRequest {
  person_id: number;
  tickets_list: WhatsAppOverdueAlertTicket[];
}

export interface WhatsAppAssignmentRequest {
  person_id: number;
  ticket_id: string;
  subject: string;
  customer_name: string;
}

export interface WhatsAppCustomRequest {
  person_id: number;
  message: string;
}

export interface WhatsAppBulkRequest {
  person_ids: number[];
  message: string;
}

export interface WhatsAppSendResponse {
  success: boolean;
  message: string;
  data: {
    person_id?: number;
    operator_name?: string;
    tickets_count?: number;
    success: boolean;
  };
}

// Ticket Extended Fields (for reopen and pre-alert)
export interface TicketExtendedFields {
  numero_ticket_gr: number | null;
  splynx_closed_at: string | null;
  pre_alert_sent_at: string | null;
  recreado: number;
}

// Logs Types
export interface LogEntry {
  id: number;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  message: string;
  timestamp: string;
  source?: string;
}

export interface LogStats {
  total_logs: number;
  by_level: Record<string, number>;
  recent_errors: number;
}

// Generic API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const adminApi = {
  // Operators
  getOperators: (): Promise<AxiosResponse<{ operators: Operator[] }>> =>
    api.get('/api/admin/operators'),

  getOperator: (personId: number): Promise<AxiosResponse<{ operator: Operator }>> =>
    api.get(`/api/admin/operators/${personId}`),

  updateOperator: (personId: number, data: Partial<Operator>): Promise<AxiosResponse> =>
    api.put(`/api/admin/operators/${personId}`, data),

  updateOperatorConfig: (personId: number, data: OperatorConfig): Promise<AxiosResponse> =>
    api.patch(`/api/admin/operators/${personId}/config`, data),

  pauseOperator: (personId: number, data: { reason: string; paused_by: string; performed_by: string }): Promise<AxiosResponse> =>
    api.post(`/api/admin/operators/${personId}/pause`, data),

  resumeOperator: (personId: number): Promise<AxiosResponse> =>
    api.post(`/api/admin/operators/${personId}/resume`),

  createOperator: (data: Partial<Operator>): Promise<AxiosResponse> =>
    api.post('/api/admin/operators/create', data),

  // Schedules
  createSchedule: (data: Partial<Schedule> & { performed_by: string }): Promise<AxiosResponse> =>
    api.post('/api/admin/schedules', data),

  updateSchedule: (scheduleId: number, data: Partial<Schedule> & { performed_by: string }): Promise<AxiosResponse> =>
    api.put(`/api/admin/schedules/${scheduleId}`, data),

  deleteSchedule: (scheduleId: number): Promise<AxiosResponse> =>
    api.delete(`/api/admin/schedules/${scheduleId}`),

  // Assignment
  resetCounters: (data: { performed_by: string }): Promise<AxiosResponse> =>
    api.post('/api/admin/assignment/reset', data),

  getAssignmentStats: (): Promise<AxiosResponse<{ stats: AssignmentStats }>> =>
    api.get('/api/admin/assignment/stats'),

  // Configuration
  getSystemConfig: (category?: string): Promise<AxiosResponse<{ config: ConfigItem[] }>> =>
    api.get('/api/admin/config', { params: { category } }),

  getConfigValue: (key: string): Promise<AxiosResponse<{ config: ConfigItem }>> =>
    api.get(`/api/admin/config/${key}`),

  updateConfig: (key: string, data: { value: any; performed_by: string }): Promise<AxiosResponse> =>
    api.put(`/api/admin/config/${key}`, data),

  // Audit
  getAuditLogs: (params?: Record<string, any>): Promise<AxiosResponse<{ logs: AuditLog[] }>> =>
    api.get('/api/admin/audit', { params }),

  getReassignmentHistory: (params?: Record<string, any>): Promise<AxiosResponse<{ history: ReassignmentHistory[] }>> =>
    api.get('/api/admin/reassignment-history', { params }),

  // Dashboard
  getDashboardStats: (): Promise<AxiosResponse<{ stats: DashboardStats }>> =>
    api.get('/api/admin/dashboard/stats'),

  // Metrics
  getOperatorMetrics: (personId: number, days: number): Promise<AxiosResponse<{ metrics: OperatorMetrics }>> =>
    api.get(`/api/admin/metrics/operator/${personId}`, { params: { days } }),

  getMetrics: (): Promise<AxiosResponse<{ metrics: OperatorMetrics[] }>> =>
    api.get('/api/admin/metrics'),

  // Incidents & Tickets
  getIncidents: (params?: Record<string, any>): Promise<AxiosResponse> =>
    api.get('/api/admin/incidents', { params }),

  updateTicketThreshold: (ticketId: number, data: Record<string, any>): Promise<AxiosResponse> =>
    api.put(`/api/admin/tickets/${ticketId}/threshold`, data),

  deleteTicket: (ticketId: number): Promise<AxiosResponse> =>
    api.delete(`/api/admin/tickets/${ticketId}`),

  // Audit Tickets
  requestTicketAudit: (ticketId: number, data: Record<string, any>): Promise<AxiosResponse> =>
    api.post(`/api/admin/tickets/${ticketId}/request-audit`, data),

  getAuditTickets: (): Promise<AxiosResponse> =>
    api.get('/api/admin/audit-tickets'),

  markAuditNotified: (ticketId: number): Promise<AxiosResponse> =>
    api.post(`/api/admin/tickets/${ticketId}/mark-audit-notified`),

  approveAudit: (ticketId: number): Promise<AxiosResponse> =>
    api.post(`/api/admin/tickets/${ticketId}/approve-audit`),

  rejectAudit: (ticketId: number): Promise<AxiosResponse> =>
    api.post(`/api/admin/tickets/${ticketId}/reject-audit`),

  deleteAudit: (ticketId: number): Promise<AxiosResponse> =>
    api.delete(`/api/admin/tickets/${ticketId}/delete-audit`),
};

export const systemApi = {
  getStatus: (): Promise<AxiosResponse<{ status: SystemStatus }>> =>
    api.get('/api/system/status'),

  pause: (data: { reason: string; paused_by: string }): Promise<AxiosResponse> =>
    api.post('/api/system/pause', data),

  resume: (data: { resumed_by: string }): Promise<AxiosResponse> =>
    api.post('/api/system/resume', data),
};

export const messagesApi = {
  getCurrentMessages: (): Promise<AxiosResponse<{ messages: MessageTemplate[] }>> =>
    api.get('/api/admin/messages/current'),

  getTemplates: (): Promise<AxiosResponse<{ templates: MessageTemplate[] }>> =>
    api.get('/api/admin/messages/templates'),

  getTemplate: (id: number): Promise<AxiosResponse<{ template: MessageTemplate }>> =>
    api.get(`/api/admin/messages/templates/${id}`),

  updateTemplate: (id: number, data: Partial<MessageTemplate>): Promise<AxiosResponse> =>
    api.put(`/api/admin/messages/templates/${id}`, data),

  createTemplate: (data: Partial<MessageTemplate>): Promise<AxiosResponse> =>
    api.post('/api/admin/messages/templates', data),
};

export const logsApi = {
  getLogs: (params?: Record<string, any>): Promise<AxiosResponse<{ logs: LogEntry[] }>> =>
    api.get('/api/logs', { params }),

  getStats: (params?: Record<string, any>): Promise<AxiosResponse<{ stats: LogStats }>> =>
    api.get('/api/logs/stats', { params }),

  clearLogs: (): Promise<AxiosResponse> =>
    api.post('/api/logs/clear'),
};

export const deviceAnalysisApi = {
  analyzeComplete: (data: DeviceAnalysisRequest): Promise<AxiosResponse<{ result: DeviceAnalysisResult }>> =>
    api.post('/api/device-analysis/analyze-complete', data),

  getMetrics: (params?: Record<string, any>): Promise<AxiosResponse> =>
    api.get('/api/device-analysis/metrics', { params }),

  submitFeedback: (analysisId: number, data: DeviceAnalysisFeedback): Promise<AxiosResponse> =>
    api.post(`/api/device-analysis/feedback/${analysisId}`, data),

  getHistory: (params?: Record<string, any>): Promise<AxiosResponse> =>
    api.get('/api/device-analysis/history', { params }),

  getStats: (): Promise<AxiosResponse> =>
    api.get('/api/device-analysis/stats'),

  getApiLogs: (params?: Record<string, any>): Promise<AxiosResponse> =>
    api.get('/api/device-analysis/api-logs', { params }),

  getApiLogsStats: (params?: Record<string, any>): Promise<AxiosResponse> =>
    api.get('/api/device-analysis/api-logs/stats', { params }),
};

export const whatsappApi = {
  // Health
  healthCheck: (): Promise<AxiosResponse<ApiResponse<WhatsAppHealthStatus>>> =>
    api.get('/api/whatsapp/health'),

  // Operator Config
  getOperatorsConfig: (): Promise<AxiosResponse<ApiResponse<{ operators: WhatsAppOperatorConfig[] }>>> =>
    api.get('/api/whatsapp/operators/config'),

  validateOperator: (personId: number): Promise<AxiosResponse<ApiResponse<WhatsAppOperatorConfig>>> =>
    api.get(`/api/whatsapp/operators/${personId}/validate`),

  // Send Messages
  sendText: (data: WhatsAppSendTextRequest): Promise<AxiosResponse<ApiResponse<WhatsAppSendResponse>>> =>
    api.post('/api/whatsapp/send/text', data),

  sendOverdueAlert: (data: WhatsAppOverdueAlertRequest): Promise<AxiosResponse<ApiResponse<WhatsAppSendResponse>>> =>
    api.post('/api/whatsapp/send/overdue-alert', data),

  sendShiftSummary: (data: WhatsAppShiftSummaryRequest): Promise<AxiosResponse<ApiResponse<WhatsAppSendResponse>>> =>
    api.post('/api/whatsapp/send/shift-summary', data),

  sendAssignment: (data: WhatsAppAssignmentRequest): Promise<AxiosResponse<ApiResponse<WhatsAppSendResponse>>> =>
    api.post('/api/whatsapp/send/assignment', data),

  sendCustom: (data: WhatsAppCustomRequest): Promise<AxiosResponse<ApiResponse<WhatsAppSendResponse>>> =>
    api.post('/api/whatsapp/send/custom', data),

  sendBulk: (data: WhatsAppBulkRequest): Promise<AxiosResponse<ApiResponse<WhatsAppSendResponse[]>>> =>
    api.post('/api/whatsapp/send/bulk', data),
};

export default api;
