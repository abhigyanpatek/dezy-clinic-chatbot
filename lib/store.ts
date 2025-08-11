import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Appointment } from './types';

interface AppointmentStore {
  appointments: Appointment[];
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => void;
  cancelAppointment: (id: string) => void;
  getAppointmentsByDoctor: (doctorId: string) => Appointment[];
  getAppointmentById: (id: string) => Appointment | undefined;
}

export const useAppointmentStore = create<AppointmentStore>()(
  persist(
    (set, get) => ({
      appointments: [],

      addAppointment: (appointment) =>
        set((state) => ({
          appointments: [...state.appointments, appointment],
        })),

      updateAppointment: (id, updatedData) =>
        set((state) => ({
          appointments: state.appointments.map((apt) =>
            apt.id === id ? { ...apt, ...updatedData } : apt,
          ),
        })),

      cancelAppointment: (id) =>
        set((state) => ({
          appointments: state.appointments.map((apt) =>
            apt.id === id ? { ...apt, status: 'cancelled' as const } : apt,
          ),
        })),

      getAppointmentsByDoctor: (doctorId) =>
        get().appointments.filter(
          (apt) => apt.doctorId === doctorId && apt.status === 'confirmed',
        ),

      getAppointmentById: (id) => get().appointments.find((apt) => apt.id === id),
    }),
    {
      name: 'dezy-appointments',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

// --- Cross-tab synchronisation ---
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'dezy-appointments' && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (parsed?.state?.appointments) {
          useAppointmentStore.setState({ appointments: parsed.state.appointments });
        }
      } catch (_) {
        // ignore malformed
      }
    }
  });
}