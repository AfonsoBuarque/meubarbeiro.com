import React from 'react';
import { Calendar, Clock, User, Scissors, Star, MapPin } from 'lucide-react';
import { BackButton } from '../../components/BackButton';

export function ClientDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <BackButton to="/" />
            <h1 className="text-3xl font-bold text-gray-900">Minha Área</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Próximo Agendamento */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-gray-500" />
                Próximo Agendamento
              </h2>
              <div className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Corte de Cabelo + Barba</h3>
                    <div className="mt-2 space-y-2">
                      <p className="flex items-center text-gray-600">
                        <Clock className="mr-2 h-4 w-4" />
                        Hoje, 14:30
                      </p>
                      <p className="flex items-center text-gray-600">
                        <User className="mr-2 h-4 w-4" />
                        Barbeiro João Silva
                      </p>
                      <p className="flex items-center text-gray-600">
                        <MapPin className="mr-2 h-4 w-4" />
                        Rua das Flores, 123
                      </p>
                    </div>
                  </div>
                  <button className="bg-red-100 text-red-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-200">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>

            {/* Histórico de Agendamentos */}
            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Clock className="mr-2 h-5 w-5 text-gray-500" />
                Histórico de Agendamentos
              </h2>
              <div className="space-y-4">
                {[1, 2, 3].map((_, index) => (
                  <div key={index} className="border-b last:border-b-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">Corte de Cabelo</h3>
                        <p className="text-sm text-gray-600">15 de Março, 2024</p>
                        <div className="flex items-center mt-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <Star className="h-4 w-4 text-gray-300 fill-current" />
                        </div>
                      </div>
                      <span className="text-gray-600">R$ 50,00</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Ações Rápidas */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
              <div className="space-y-4">
                <button className="w-full bg-gray-900 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800 flex items-center justify-center">
                  <Scissors className="mr-2 h-5 w-5" />
                  Novo Agendamento
                </button>
                <button className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50 flex items-center justify-center">
                  <User className="mr-2 h-5 w-5" />
                  Editar Perfil
                </button>
              </div>
            </div>

            {/* Barbearias Favoritas */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Barbearias Favoritas</h2>
              <div className="space-y-4">
                {[1, 2].map((_, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Scissors className="h-6 w-6 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-medium">Barbearia do João</h3>
                      <p className="text-sm text-gray-600">4.8 ★ · 2.3km</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}