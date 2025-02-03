import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, Save, Settings, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BackButton } from '../../components/BackButton';

const profileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  phone: z.string().min(10, 'Telefone inválido'),
  bio: z.string().optional(),
  email: z.string().email('Email inválido'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface Establishment {
  id: string;
  name: string;
  phone: string;
  bio: string;
  address_details: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  working_hours: {
    [key: string]: {
      start: string;
      end: string;
      enabled: boolean;
    };
  };
  banner_url?: string;
  profile_url?: string;
}

export function BarberProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema)
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/barber/login');
        return;
      }

      // First load barber profile
      const { data: profile } = await supabase
        .from('barber_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setValue('name', profile.name);
        setValue('phone', profile.phone);
        setValue('bio', profile.bio || '');
        setValue('email', user.email || '');

        // Then try to load establishment details
        const { data: establishmentData, error: establishmentError } = await supabase
          .from('establishment_details')
          .select('*')
          .eq('barber_id', user.id)
          .maybeSingle();

        if (establishmentError && establishmentError.code !== 'PGRST116') {
          console.error('Error loading establishment:', establishmentError);
          setError('Erro ao carregar dados do estabelecimento');
          return;
        }

        if (establishmentData) {
          setEstablishment(establishmentData);
        } else {
          // Create new establishment if it doesn't exist
          const { data: newEstablishment, error: createError } = await supabase
            .from('establishment_details')
            .insert({
              barber_id: user.id,
              name: profile.name,
              phone: profile.phone,
              bio: profile.bio || '',
              address_details: {
                street: '',
                number: '',
                neighborhood: '',
                city: '',
                state: ''
              },
              working_hours: {
                monday: { start: '09:00', end: '18:00', enabled: true },
                tuesday: { start: '09:00', end: '18:00', enabled: true },
                wednesday: { start: '09:00', end: '18:00', enabled: true },
                thursday: { start: '09:00', end: '18:00', enabled: true },
                friday: { start: '09:00', end: '18:00', enabled: true },
                saturday: { start: '09:00', end: '13:00', enabled: true },
                sunday: { start: '09:00', end: '18:00', enabled: false }
              }
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating establishment:', createError);
            setError('Erro ao criar estabelecimento');
            return;
          }

          if (newEstablishment) {
            setEstablishment(newEstablishment);
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(data: ProfileFormData) {
    try {
      setSaving(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Usuário não autenticado');
        return;
      }

      // Update barber profile
      const { error: profileError } = await supabase
        .from('barber_profiles')
        .upsert({
          id: user.id,
          name: data.name,
          phone: data.phone,
          bio: data.bio || ''
        });

      if (profileError) throw profileError;

      // If there's an establishment, update it too
      if (establishment) {
        const { error: establishmentError } = await supabase
          .from('establishment_details')
          .update({
            name: data.name,
            phone: data.phone,
            bio: data.bio || ''
          })
          .eq('id', establishment.id);

        if (establishmentError) throw establishmentError;
      }

      alert('Perfil atualizado com sucesso!');
      await loadProfile(); // Reload data
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Erro ao atualizar perfil');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <BackButton to="/" />
            <h1 className="text-3xl font-bold">Perfil do Barbeiro</h1>
          </div>
          <button
            onClick={() => navigate('/barber/establishment')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurações do Estabelecimento
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Informações Básicas</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    type="text"
                    {...register('name')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    {...register('email')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                    disabled
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefone</label>
                  <input
                    type="text"
                    {...register('phone')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  <textarea
                    {...register('bio')}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                  />
                  {errors.bio && (
                    <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
                  )}
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar Perfil
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Establishment Info */}
          <div>
            {establishment ? (
              <div className="bg-white rounded-lg shadow">
                {establishment.profile_url && (
                  <img
                    src={establishment.profile_url}
                    alt={establishment.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">{establishment.name}</h2>
                  <div className="space-y-3 text-gray-600">
                    {establishment.address_details?.street && (
                      <p className="flex items-center">
                        <MapPin className="h-5 w-5 mr-2" />
                        {establishment.address_details.street}, {establishment.address_details.number}
                        <br />
                        {establishment.address_details.neighborhood}
                        <br />
                        {establishment.address_details.city}, {establishment.address_details.state}
                      </p>
                    )}
                    <p className="flex items-center">
                      <Phone className="h-5 w-5 mr-2" />
                      {establishment.phone}
                    </p>
                    <div className="border-t pt-3 mt-3">
                      <h3 className="font-medium flex items-center mb-2">
                        <Clock className="h-5 w-5 mr-2" />
                        Horário de Funcionamento
                      </h3>
                      <div className="space-y-1 text-sm">
                        {Object.entries(establishment.working_hours).map(([day, hours]) => (
                          hours.enabled && (
                            <div key={day} className="flex justify-between">
                              <span className="capitalize">{day}</span>
                              <span>{hours.start} - {hours.end}</span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Configure seu Estabelecimento
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Adicione informações sobre seu estabelecimento para que os clientes possam encontrá-lo.
                  </p>
                  <button
                    onClick={() => navigate('/barber/establishment')}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar Agora
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}