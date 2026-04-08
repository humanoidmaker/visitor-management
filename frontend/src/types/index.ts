export interface User { id: string; email: string; name: string; role: string; }

export interface Visitor {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  id_type: string;
  id_number: string;
  photo: string;
  visit_count: number;
  last_visit?: string;
  created_at: string;
  updated_at: string;
  visits?: Visit[];
}

export interface Host {
  id: string;
  name: string;
  employee_id: string;
  department: string;
  phone: string;
  email: string;
  designation: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Visit {
  id: string;
  visitor_id: string;
  host_id: string;
  purpose: string;
  expected_duration: string;
  vehicle_number: string;
  items_carried: string;
  photo: string;
  pass_number: string;
  check_in: string;
  check_out: string | null;
  valid_until: string;
  status: string;
  date: string;
  visitor_name?: string;
  visitor_phone?: string;
  visitor_company?: string;
  visitor_photo?: string;
  host_name?: string;
  host_department?: string;
}

export interface BlacklistEntry {
  id: string;
  phone: string;
  name: string;
  reason: string;
  added_by: string;
  created_at: string;
}

export interface VisitStats {
  today_checkins: number;
  active_visitors: number;
  total_visitors: number;
  blacklisted: number;
  total_visits: number;
  last_7_days: { date: string; count: number }[];
  purpose_stats: { purpose: string; count: number }[];
  department_stats: { department: string; count: number }[];
  hour_stats: { hour: number; count: number }[];
  frequent_visitors: { visitor_id: string; name: string; company: string; count: number }[];
}
