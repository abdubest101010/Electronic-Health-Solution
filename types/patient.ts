export interface Appointment {
    id: number;
    dateTime: string | null;
    status: string;
  }
  
  export interface PatientData {
    id: string;
    name: string;
    createdAt: string | Date;
    appointments: Appointment[];
  }