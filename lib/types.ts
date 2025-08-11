export interface Doctor {
    id: string;
    name: string;
    title: string;
    specialties: string[];
    availableSlots: TimeSlot[];
  }
  
  export interface TimeSlot {
    date: string;
    time: string;
    available: boolean;
  }
  
  export interface Appointment {
    id: string;
    patientName: string;
    patientAge: number;
    patientPhone: string;
    doctorId: string;
    doctorName: string;
    date: string;
    time: string;
    status: 'confirmed' | 'cancelled' | 'rescheduled';
    createdAt: Date;
    treatment?: string;
  }
  
  export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    functionCall?: {
      name: string;
      arguments: string;
    } | null;
  }