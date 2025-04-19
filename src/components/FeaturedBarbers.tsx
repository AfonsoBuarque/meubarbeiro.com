import React, { useEffect, useState } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface Barber {
  id: string;
  rating?: number;
  banner_url?: string;
  establishment_name?: string;
  address_details?: any;
}

export function FeaturedBarbers() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFeaturedBarbers();
  }, []);

  async function loadFeaturedBarbers() {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch('https://backaend-production.up.railway.app/api/barber_profiles', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Erro ao buscar barbeiros');
      const data = await response.json();
      setBarbers(data);
    } catch (err) {
      console.error('Erro ao carregar barbeiros:', err);
      setError('Não foi possível carregar os barbeiros. Por favor, tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === barbers.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? barbers.length - 1 : prev - 1));
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [barbers.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-900">
        <div className="text-white">Carregando barbeiros...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-900">
        <div className="text-white text-center">
          <p>{error}</p>
          <button
            onClick={loadFeaturedBarbers}
            className="mt-4 px-4 py-2 bg-white text-gray-900 rounded-md hover:bg-gray-100"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (barbers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-900">
        <div className="text-white">Nenhum barbeiro encontrado.</div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gray-900 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Barbeiros em Destaque
        </h2>
        
        <div className="relative">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {barbers.map((barber, index) => (
              <div
                key={barber.id}
                className="w-full flex-shrink-0 px-4"
              >
                <div className="bg-white rounded-lg overflow-hidden shadow-xl">
                  <img
                    src={barber.banner_url ? `https://backaend-production.up.railway.app${barber.banner_url}` : `https://source.unsplash.com/800x400/?barbershop,haircut&sig=${index}`}
                    alt={barber.establishment_name || 'Estabelecimento sem nome'}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {barber.establishment_name || 'Estabelecimento sem nome'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {barber.address_details ?
                        `${barber.address_details.street || ''} ${barber.address_details.number || ''}, ${barber.address_details.neighborhood || ''}, ${barber.address_details.city || ''} - ${barber.address_details.state || ''}`.replace(/, ,/g, ',').trim() :
                        'Endereço não cadastrado'}
                    </p>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= (barber.rating || 4.5)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-gray-600">
                        {barber.rating || 4.5}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
          >
            <ChevronLeft className="h-6 w-6 text-gray-900" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
          >
            <ChevronRight className="h-6 w-6 text-gray-900" />
          </button>

          {/* Slide Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {barbers.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  currentSlide === index ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}