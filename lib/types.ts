export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: "admin" | "user"
  status: "pending" | "approved" | "rejected"
  permissions?: Record<string, boolean>
  created_at: string
  updated_at: string
}

export interface Unit {
  id: string
  unit_number: string
  plate_number: string
  brand: string | null
  model: string | null
  year: number | null
  unit_type: string
  status: "active" | "inactive" | "maintenance"
  zeek_device_id: string | null
  owner_id: string | null
  created_at: string
  updated_at: string
}

export interface FuelRecord {
  id: string
  unit_id: string
  date: string
  odometer_reading: number | null
  fuel_liters: number | null
  fuel_cost: number | null
  fuel_type: string
  notes: string | null
  created_at: string
}

export interface Trip {
  id: string
  unit_id: string
  origin: string
  destination: string
  departure_date: string | null
  arrival_date: string | null
  distance_km: number | null
  cargo_description: string | null
  client_name: string | null
  status: "pending" | "in_progress" | "completed" | "cancelled"
  created_at: string
}

export interface MaintenanceRecord {
  id: string
  unit_id: string
  date: string
  maintenance_type: string
  description: string | null
  cost: number | null
  provider: string | null
  next_maintenance_date: string | null
  odometer_at_service: number | null
  created_at: string
}

export interface UserUnit {
  id: string
  user_id: string
  unit_id: string
  created_at: string
}
