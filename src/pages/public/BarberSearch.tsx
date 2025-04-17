import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Clock, Scissors, Loader2, Navigation } from 'lucide-react';
import { BackButton } from '../../components/BackButton';

interface Barber {
  id: string;
  name: string;
  establishment_name?: string;
  address_details: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  latitude: number;
  longitude: number;
  banner_url?: string;
  profile_url?: string;
  distance?: number;
  working_hours: {
    [key: string]: {
      start: string;
      end: string;
      enabled: boolean;
    };
  };
}

interface Location {
  latitude: number;
  longitude: number;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function BarberSearch() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    loadBarbers();
  }, [location, searchQuery]);

  async function loadBarbers() {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/barber_profiles', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Erro ao buscar barbearias');
      const data = await response.json();
      setBarbers(data);
    } catch (error) {
      console.error('Error loading barbers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function getCurrentLocation() {
    setGettingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocalização não é suportada pelo seu navegador');
      setGettingLocation(false);
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    } catch (error: any) {
      console.error('Error getting location:', error);
      setLocationError(
        error.code === 1
          ? 'Permissão de localização negada'
          : 'Erro ao obter sua localização'
      );
    } finally {
      setGettingLocation(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <BackButton to="/" />
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-3 h-6 w-6 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, cidade ou bairro"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300"
              />
            </div>
            <button
              onClick={getCurrentLocation}
              disabled={gettingLocation}
              className={`flex items-center px-4 py-3 rounded-lg ${
                location
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              } ${gettingLocation ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {gettingLocation ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : location ? (
                <Navigation className="h-5 w-5" />
              ) : (
                <MapPin className="h-5 w-5" />
              )}
              <span className="ml-2">
                {location ? 'Localização Ativa' : 'Perto de Mim'}
              </span>
            </button>
          </div>
          {locationError && (
            <div className="mt-2 text-sm text-red-600">
              {locationError}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
          </div>
        ) : barbers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Nenhuma barbearia encontrada{searchQuery ? ' para sua busca' : ''}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {barbers.map((barber) => (
              <Link to={`/establishment/${barber.id}`} key={barber.id} className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <img
                  src={barber.profile_url ? (barber.profile_url.startsWith('/') ? `http://localhost:3001${barber.profile_url}` : barber.profile_url) : `https://source.unsplash.com/480x360/?barber-profile&sig=${barber.id}`}
                  alt={barber.establishment_name || barber.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {barber.establishment_name || barber.name}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                        <MapPin className="h-4 w-4" />
                        <span>{barber.address_details.street}, {barber.address_details.number} - {barber.address_details.neighborhood}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}