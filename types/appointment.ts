// types/index.ts

export interface AssignedPatient {
  id: number;
  patient: {
    name: string;
  };
  vitals: {
    weight: number | null;
    bpSystolic: number | null;
    bpDiastolic: number | null;
  };
  visitStatus: string;
}

export interface LabService {
  id: number;
  name: string;
}