import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Scissors, Calendar, MapPin, TrendingUp, Users, DollarSign } from 'lucide-react';
import { FeaturedBarbers } from '../../components/FeaturedBarbers';

export function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Scissors className="h-8 w-8 text-gray-900" />
            <span className="ml-2 text-xl font-bold text-gray-900">MeuBarbeiro.com</span>
          </div>
          <Link
            to="/barber/login"
            className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
          >
            Área do Barbeiro
          </Link>
        </div>
      </header>

      <main>
        {/* Featured Barbers Banner */}
        <FeaturedBarbers />

        {/* Hero Section */}
        <div className="bg-gray-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-6 flex items-center justify-center">
                <img
                  src="https://i.postimg.cc/ftSq70Z7/maquina-cabelo.png"
                  alt="Máquina de Cabelo"
                  className="w-12 h-12 mr-4"
                />
                Encontre o melhor barbeiro perto de você
              </h1>
              <p className="text-xl text-gray-300 mb-8">Agende seu horário online de forma rápida e fácil</p>
              <div className="max-w-2xl mx-auto">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-3 h-6 w-6 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Digite seu endereço ou CEP"
                      className="w-full pl-12 pr-4 py-3 rounded-lg text-gray-900"
                    />
                  </div>
                  <Link
                    to="/buscar"
                    className="bg-white text-gray-900 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 flex items-center"
                  >
                    <Search className="h-5 w-5 mr-2" />
                    Buscar
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-gray-900" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Encontre Barbeiros</h3>
                <p className="text-gray-600">Busque por localização e veja avaliações de outros clientes</p>
              </div>
              <div className="text-center">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-gray-900" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Agende Online</h3>
                <p className="text-gray-600">Escolha o horário que funciona melhor para você</p>
              </div>
              <div className="text-center">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scissors className="h-8 w-8 text-gray-900" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Serviço de Qualidade</h3>
                <p className="text-gray-600">Profissionais verificados e avaliados pela comunidade</p>
              </div>
            </div>
          </div>
        </div>

        {/* Promotional Area */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <img
                  src="https://source.unsplash.com/800x600/?barbershop,haircut"
                  alt="Barbearia Profissional"
                  className="rounded-lg shadow-xl"
                />
              </div>
              <div className="text-white">
                <h2 className="text-3xl font-bold mb-6">Promoção do Mês</h2>
                <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
                  <h3 className="text-2xl font-bold mb-2">Combo Completo</h3>
                  <p className="text-xl mb-4">Corte + Barba + Hidratação</p>
                  <div className="flex items-center mb-6">
                    <span className="text-gray-400 line-through text-xl">R$ 120</span>
                    <span className="text-3xl font-bold ml-4">R$ 89,90</span>
                  </div>
                  <Link
                    to="/buscar"
                    className="inline-block bg-white text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-100"
                  >
                    Encontrar Barbeiro
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Become a Partner */}
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Seja um Parceiro</h2>
              <p className="text-xl text-gray-600">Aumente sua visibilidade e ganhe mais clientes</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <div className="bg-gray-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Mais Clientes</h3>
                <p className="text-gray-600">Alcance novos clientes e fidelize os existentes com nossa plataforma</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <div className="bg-gray-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Gestão Simplificada</h3>
                <p className="text-gray-600">Gerencie sua agenda e atendimentos de forma prática e eficiente</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <div className="bg-gray-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Crescimento</h3>
                <p className="text-gray-600">Acompanhe métricas e evolua seu negócio com nossas ferramentas</p>
              </div>
            </div>
            <div className="text-center mt-12">
              <Link
                to="/barber/login"
                className="inline-flex items-center bg-gray-900 text-white px-8 py-4 rounded-lg font-medium hover:bg-gray-800"
              >
                <DollarSign className="h-5 w-5 mr-2" />
                Começar Agora
              </Link>
              <p className="mt-4 text-gray-600">Cadastro rápido e sem mensalidade</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}