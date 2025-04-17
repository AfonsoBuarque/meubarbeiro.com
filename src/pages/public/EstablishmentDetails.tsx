import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, MapPin, Clock, Scissors, ArrowLeft } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
}

interface Establishment {
  id: string;
  name: string;
  banner_url?: string;
  profile_url?: string;
  address_details: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  latitude: number;
  longitude: number;
  working_hours: {
    [key: string]: {
      start: string;
      end: string;
      enabled: boolean;
    };
  };
}

export default function EstablishmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetails() {
      setLoading(true);
      setError(null);
      try {
        const estRes = await fetch(`http://localhost:3001/api/establishment_details/${id}`);
        if (!estRes.ok) throw new Error('Erro ao buscar estabelecimento');
        const estData = await estRes.json();
        setEstablishment(estData);
        const servRes = await fetch(`http://localhost:3001/api/barber_services/${id}`);
        if (!servRes.ok) throw new Error('Erro ao buscar serviços');
        const servData = await servRes.json();
        setServices(servData.services || servData);
      } catch (e: any) {
        setError(e.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [id]);

  if (loading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin h-8 w-8 text-gray-900" /></div>;
  if (error) return <div className="text-center text-red-500 py-10">{error}</div>;
  if (!establishment) return null;

  const address = `${establishment.address_details.street}, ${establishment.address_details.number} - ${establishment.address_details.neighborhood}, ${establishment.address_details.city} - ${establishment.address_details.state}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-gray-700 hover:text-gray-900 flex items-center"><ArrowLeft className="h-5 w-5 mr-1" /> Voltar</button>
          <h1 className="text-2xl font-bold text-gray-900">Detalhes do Estabelecimento</h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Banner e perfil */}
        <div className="relative mb-8">
          <img src={establishment.banner_url ? (establishment.banner_url.startsWith('/') ? `http://localhost:3001${establishment.banner_url}` : establishment.banner_url) : `https://source.unsplash.com/800x240/?barbershop,barber`} alt="Banner" className="w-full h-48 object-cover rounded-lg shadow" />
          <img src={establishment.profile_url ? (establishment.profile_url.startsWith('/') ? `http://localhost:3001${establishment.profile_url}` : establishment.profile_url) : `https://source.unsplash.com/120x120/?barber-profile`} alt="Perfil" className="w-32 h-32 rounded-full border-4 border-white shadow-lg absolute left-6 -bottom-16 bg-white object-cover" />
        </div>
        <div className="mt-20 mb-8">
          <h2 className="text-3xl font-bold mb-2">{establishment.name}</h2>
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <MapPin className="h-5 w-5" />
            <span>{address}</span>
          </div>
        </div>
        {/* Horário de funcionamento */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-2 flex items-center"><Clock className="h-5 w-5 mr-1" />Horário de Funcionamento</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(establishment.working_hours).map(([day, wh]) => (
              <div key={day} className="bg-white rounded p-2 border flex items-center gap-2">
                <span className="font-medium capitalize w-20">{day}</span>
                {wh.enabled ? `${wh.start} - ${wh.end}` : <span className="text-gray-400">Fechado</span>}
              </div>
            ))}
          </div>
        </div>
        {/* Serviços */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center"><Scissors className="h-5 w-5 mr-1" />Serviços Oferecidos</h3>
          {services.length === 0 ? (
            <div className="text-gray-500">Nenhum serviço cadastrado.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map(service => (
                <div key={service.id} className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg">{service.name}</span>
                    <span className="text-gray-700 font-semibold">R$ {service.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" /> {service.duration} min
                  </div>
                  {service.description && <div className="text-gray-500 text-sm">{service.description}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Mapa - removido temporariamente */}
        {/* <div className="mb-8">
          <h3 className="text-xl font-semibold mb-2 flex items-center"><MapPin className="h-5 w-5 mr-1" />Localização</h3>
          <div className="w-full h-72 rounded-lg overflow-hidden">
            {typeof establishment.latitude === 'number' && typeof establishment.longitude === 'number' && !isNaN(establishment.latitude) && !isNaN(establishment.longitude) ? (
              <MapContainer center={[establishment.latitude, establishment.longitude]} zoom={16} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[establishment.latitude, establishment.longitude]}>
                  <Popup>{establishment.name}<br />{address}</Popup>
                </Marker>
              </MapContainer>
            ) : (
              <div className="text-red-500 p-2">Localização não disponível</div>
            )}
          </div>
        </div> */}
      </main>
    </div>
  );
}
