import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Calendar, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { BackButton } from '../../components/BackButton';
import { format, addMinutes, setHours, setMinutes, isBefore, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { auth } from '../../lib/firebase';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
}

interface Establishment {
  id: string;
  name: string;
  banner_url: string;
  working_hours: {
    [key: string]: {
      start: string;
      end: string;
      enabled: boolean;
    };
  };
}

interface Appointment {
  start_time: string;
  end_time: string;
}

export function BookingPage() {
  const { establishmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    loadEstablishmentAndServices();
  }, [establishmentId]);

  useEffect(() => {
    if (selectedDate && establishment) {
      loadAppointments();
      calculateAvailableTimes();
    }
  }, [selectedDate, selectedService, establishment]);

  async function loadEstablishmentAndServices() {
    try {
      setLoading(true);
      setError(null);
      // Buscar detalhes do estabelecimento
      const responseEst = await fetch(`https://backaend-production.up.railway.app/api/establishment_details/${establishmentId}`);
      if (!responseEst.ok) throw new Error('Erro ao buscar estabelecimento');
      const establishmentData = await responseEst.json();
      setEstablishment(establishmentData);
      // Buscar serviços
      const responseServ = await fetch(`https://backaend-production.up.railway.app/api/services/${establishmentId}`);
      if (!responseServ.ok) throw new Error('Erro ao buscar serviços');
      const servicesData = await responseServ.json();
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Erro ao carregar dados do estabelecimento');
    } finally {
      setLoading(false);
    }
  }

  async function loadAppointments() {
    try {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      const response = await fetch(`https://backaend-production.up.railway.app/api/appointments?establishment_id=${establishmentId}&start=${startOfDay.toISOString()}&end=${endOfDay.toISOString()}`);
      if (!response.ok) throw new Error('Erro ao buscar horários');
      const data = await response.json();
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setError('Erro ao carregar horários disponíveis');
    }
  }

  function calculateAvailableTimes() {
    if (!establishment || !selectedService) return;

    const dayOfWeek = format(selectedDate, 'EEEE', { locale: ptBR });
    const workingHours = establishment.working_hours[dayOfWeek.toLowerCase()];

    if (!workingHours || !workingHours.enabled) {
      setAvailableTimes([]);
      return;
    }

    const [startHour, startMinute] = workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = workingHours.end.split(':').map(Number);

    let currentTime = setMinutes(setHours(selectedDate, startHour), startMinute);
    const endTime = setMinutes(setHours(selectedDate, endHour), endMinute);
    const times: string[] = [];

    while (isBefore(currentTime, endTime)) {
      const timeSlotEnd = addMinutes(currentTime, selectedService.duration);
      
      // Check if this time slot overlaps with any existing appointments
      const isOverlapping = appointments.some(appointment => {
        const appointmentStart = new Date(appointment.start_time);
        const appointmentEnd = new Date(appointment.end_time);
        return (
          (isBefore(currentTime, appointmentEnd) && isAfter(timeSlotEnd, appointmentStart)) ||
          (isBefore(appointmentStart, timeSlotEnd) && isAfter(appointmentEnd, currentTime))
        );
      });

      if (!isOverlapping && isBefore(timeSlotEnd, endTime)) {
        times.push(format(currentTime, 'HH:mm'));
      }

      currentTime = addMinutes(currentTime, 30);
    }

    setAvailableTimes(times);
  }

  async function handleBooking() {
    if (!selectedService || !selectedTime || !establishment) {
      setError('Por favor, selecione um serviço e horário');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const user = auth.currentUser;
      if (!user) {
        setError('Você precisa estar logado para agendar');
        return;
      }
      const [hour, minute] = selectedTime.split(':').map(Number);
      const startTime = setMinutes(setHours(selectedDate, hour), minute);
      const endTime = addMinutes(startTime, selectedService.duration);
      const response = await fetch('https://backaend-production.up.railway.app/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: user.uid,
          establishment_id: establishmentId,
          service_id: selectedService.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'scheduled'
        })
      });
      if (!response.ok) throw new Error('Erro ao agendar');
      alert('Agendamento realizado com sucesso!');
      navigate('/client/dashboard');
    } catch (error) {
      console.error('Error booking appointment:', error);
      setError('Erro ao realizar agendamento');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
      </div>
    );
  }

  if (!establishment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Estabelecimento não encontrado</h2>
          <BackButton to="/buscar" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <BackButton to="/buscar" />
            <h1 className="text-3xl font-bold">Agendar Horário</h1>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {establishment.banner_url && (
            <img
              src={establishment.banner_url}
              alt={establishment.name}
              className="w-full h-48 object-cover"
            />
          )}
          
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">{establishment.name}</h2>

            {/* Service Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">1. Escolha o Serviço</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      selectedService?.id === service.id
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{service.name}</h4>
                      <span className="text-gray-900 font-medium">
                        R$ {(service.price / 100).toFixed(2)}
                      </span>
                    </div>
                    {service.description && (
                      <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                    )}
                    <div className="text-sm text-gray-500">
                      <Clock className="inline-block h-4 w-4 mr-1" />
                      {service.duration} minutos
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Selection */}
            {selectedService && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">2. Escolha a Data</h3>
                <div className="flex space-x-4 overflow-x-auto pb-2">
                  {[...Array(7)].map((_, index) => {
                    const date = addMinutes(new Date(), index * 24 * 60);
                    const dayStr = format(date, 'EEEE', { locale: ptBR });
                    const workingHours = establishment.working_hours[dayStr.toLowerCase()];
                    const isAvailable = workingHours?.enabled;

                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedDate(date)}
                        disabled={!isAvailable}
                        className={`flex-shrink-0 p-4 rounded-lg text-center transition-colors ${
                          format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                            ? 'bg-gray-900 text-white'
                            : isAvailable
                            ? 'bg-white border border-gray-200 hover:border-gray-300'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <div className="font-medium">
                          {format(date, 'EEEE', { locale: ptBR })}
                        </div>
                        <div className="text-sm">
                          {format(date, 'dd/MM')}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Time Selection */}
            {selectedService && availableTimes.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">3. Escolha o Horário</h3>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {availableTimes.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`p-2 text-center rounded-lg transition-colors ${
                        selectedTime === time
                          ? 'bg-gray-900 text-white'
                          : 'bg-white border border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Booking Summary */}
            {selectedService && selectedTime && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Resumo do Agendamento</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-5 w-5 mr-2" />
                    {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    {' às '}
                    {selectedTime}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-5 w-5 mr-2" />
                    {selectedService.name} ({selectedService.duration} minutos)
                  </div>
                  <div className="flex items-center text-gray-900 font-medium">
                    <DollarSign className="h-5 w-5 mr-2" />
                    R$ {(selectedService.price / 100).toFixed(2)}
                  </div>
                </div>

                <button
                  onClick={handleBooking}
                  disabled={saving}
                  className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center"
                >
                  {saving ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="h-5 w-5 mr-2" />
                  )}
                  Confirmar Agendamento
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}