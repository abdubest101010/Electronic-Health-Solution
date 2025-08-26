// types/index.ts

export interface AssignedPatient {
  id: number;
  patient: {
    id: number;
    name: string;
    history?: string | null;
  };
  vitals: {
    weight: number | null;
    bpSystolic: number | null;
    bpDiastolic: number | null;
  };
  visitStatus: string;
  examination?: {
    complaints: string;
    diagnosis: string;
    visitDetails: string;
  } | null;
}

export interface LabService {
  id: number;
  name: string;
}