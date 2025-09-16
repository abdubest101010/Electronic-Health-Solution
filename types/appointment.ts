export interface AssignedPatient {
  id: number;
  patient: {
    id: number;
    name: string;
    history?: string | null;
  };
  vitals: {
    weight?: number | null;
    bpSystolic?: number | null;
    bpDiastolic?: number | null;
    measuredById?: string | null;
    measuredAt?: string | null;
  } | null;
  visitStatus: string;
  examination?: {
    complaints?: string | null;
    diagnosis?: string | null;
    visitDetails?: string | null;
    medicines?: string | null;
    recommendations?: string | null;
  } | null;
  latestAppointment?: {
    id: number;
    dateTime: string | null;
  } | null;
}
export interface LabService {
  id: number;
  name: string;
  description?: string | null;
  type?: 'VITAL' | 'LAB_TEST';
}