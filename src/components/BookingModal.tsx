import React from 'react';

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  services: { id: string; name: string; price: number; duration: number }[];
  barbers: { id: string; name: string }[];
  selectedBarberId: string;
  onBarberChange: (barberId: string) => void;
  getAvailableTimes: () => string[];
  onBook: (data: { serviceId: string; date: string; time: string; barberId: string }) => void;
}

const BookingModal: React.FC<BookingModalProps> = ({
  open,
  onClose,
  selectedDate,
  services,
  barbers,
  selectedBarberId,
  onBarberChange,
  getAvailableTimes,
  onBook
}) => {
  const [serviceId, setServiceId] = React.useState('');
  const [time, setTime] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setServiceId('');
    setTime('');
    setError(null);
  }, [open, selectedDate]);

  if (!open || !selectedDate) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId || !time || !selectedBarberId) {
      setError('Selecione o barbeiro, serviço e o horário!');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      onBook({ serviceId, date: selectedDate.toISOString().slice(0, 10), time, barberId: selectedBarberId });
      onClose();
    } catch (err: any) {
      setError('Erro ao agendar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const availableTimes = getAvailableTimes();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-500 hover:text-gray-700">&times;</button>
        <h2 className="text-xl font-bold mb-4">Agendar horário</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Barbeiro</label>
            <select
              className="w-full border rounded p-2"
              value={selectedBarberId}
              onChange={e => onBarberChange(e.target.value)}
              required
            >
              <option value="">Selecione...</option>
              {barbers.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Serviço</label>
            <select
              className="w-full border rounded p-2"
              value={serviceId}
              onChange={e => setServiceId(e.target.value)}
              required
            >
              <option value="">Selecione...</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data</label>
            <input
              type="text"
              className="w-full border rounded p-2 bg-gray-100"
              value={selectedDate.toLocaleDateString('pt-BR')}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Horário</label>
            <select
              className="w-full border rounded p-2"
              value={time}
              onChange={e => setTime(e.target.value)}
              required
            >
              <option value="">Selecione...</option>
              {availableTimes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button
            type="submit"
            className="bg-blue-600 text-white rounded p-2 font-semibold hover:bg-blue-700 disabled:opacity-60"
            disabled={loading}
          >{loading ? 'Agendando...' : 'Confirmar Agendamento'}</button>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
