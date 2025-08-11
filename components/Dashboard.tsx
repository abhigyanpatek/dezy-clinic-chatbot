'use client';

import { Calendar, Clock, User, Phone, CheckCircle, XCircle } from 'lucide-react';
import { useAppointmentStore } from '@/lib/store';
import { DOCTORS } from '@/lib/constants';

export default function Dashboard() {
  const { appointments } = useAppointmentStore();

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
    today: appointments.filter(a => {
      const aptDate = new Date(a.date);
      const today = new Date();
      return aptDate.toDateString() === today.toDateString();
    }).length
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Appointments Dashboard</h1>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Appointments</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <Calendar className="text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Confirmed</p>
              <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
            </div>
            <CheckCircle className="text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            </div>
            <XCircle className="text-red-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Today</p>
              <p className="text-2xl font-bold text-blue-600">{stats.today}</p>
            </div>
            <Clock className="text-blue-500" />
          </div>
        </div>
      </div>

      {/* Doctor Schedules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {DOCTORS.map((doctor) => {
          const doctorAppointments = appointments.filter(
            apt => apt.doctorId === doctor.id && apt.status === 'confirmed'
          );

          return (
            <div key={doctor.id} className="bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <h2 className="text-xl text-gray-800 font-semibold">{doctor.name}</h2>
                <p className="text-gray-600">{doctor.title}</p>
                <p className="text-sm text-gray-500">
                  {doctor.specialties.join(' • ')}
                </p>
              </div>

              <div className="space-y-3">
                {doctorAppointments.length > 0 ? (
                  doctorAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-medium text-gray-800 flex items-center">
                            <User size={16} className="mr-1" />
                            {apt.patientName}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Calendar size={14} className="mr-1" />
                            {new Date(apt.date).toLocaleDateString()}
                            <Clock size={14} className="ml-2 mr-1" />
                            {apt.time}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Phone size={14} className="mr-1" />
                            {apt.patientPhone}
                          </p>
                          {apt.treatment && (
                            <p className="text-sm text-blue-600">
                              Treatment: {apt.treatment}
                            </p>
                          )}
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No appointments scheduled
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}