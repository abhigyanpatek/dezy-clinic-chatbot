import { Doctor } from './types';

export const DOCTORS: Doctor[] = [
  {
    id: 'dr-marshall',
    name: 'Andre P. Marshall',
    title: 'M.D., MPH, F.A.C.S.',
    specialties: ['Rhinoplasty', 'Facelift', 'Lip Fillers'],
    availableSlots: []
  },
  {
    id: 'dr-loflin',
    name: 'Catherine Loflin',
    title: 'MD, FACS',
    specialties: ['Upper Arm Lift', 'Tummy Tuck', 'Facelift'],
    availableSlots: []
  }
];

export const WORKING_HOURS = {
  start: 9,
  end: 18,
  slotDuration: 30
};

export const generateTimeSlots = (date: Date) => {
  const slots = [];
  for (let hour = WORKING_HOURS.start; hour < WORKING_HOURS.end; hour++) {
    slots.push(`${hour}:00`);
    slots.push(`${hour}:30`);
  }
  return slots;
};