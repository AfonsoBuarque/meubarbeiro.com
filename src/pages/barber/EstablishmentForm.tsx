import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { getAuthUrl } from '../../lib/google-calendar';
import { Loader2, Save, Plus, Trash2, Calendar, Upload, Image as ImageIcon } from 'lucide-react';
import { BackButton } from '../../components/BackButton';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const establishmentSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  phone: z.string().min(10, 'Telefone inválido'),
  bio: z.string().min(10, 'Bio deve ter no mínimo 10 caracteres'),
  street: z.string().min(5, 'Rua deve ter no mínimo 5 caracteres'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(3, 'Bairro deve ter no mínimo 3 caracteres'),
  city: z.string().min(3, 'Cidade deve ter no mínimo 3 caracteres'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres'),
  zipcode: z.string().length(8, 'CEP deve ter 8 números'),
  workingHours: z.object({
    monday: z.object({ start: z.string(), end: z.string(), enabled: z.boolean() }),
    tuesday: z.object({ start: z.string(), end: z.string(), enabled: z.boolean() }),
    wednesday: z.object({ start: z.string(), end: z.string(), enabled: z.boolean() }),
    thursday: z.object({ start: z.string(), end: z.string(), enabled: z.boolean() }),
    friday: z.object({ start: z.string(), end: z.string(), enabled: z.boolean() }),
    saturday: z.object({ start: z.string(), end: z.string(), enabled: z.boolean() }),
    sunday: z.object({ start: z.string(), end: z.string(), enabled: z.boolean() })
  })
});

const defaultWorkingHours = {
  monday: { start: '09:00', end: '18:00', enabled: true },
  tuesday: { start: '09:00', end: '18:00', enabled: true },
  wednesday: { start: '09:00', end: '18:00', enabled: true },
  thursday: { start: '09:00', end: '18:00', enabled: true },
  friday: { start: '09:00', end: '18:00', enabled: true },
  saturday: { start: '09:00', end: '13:00', enabled: true },
  sunday: { start: '09:00', end: '18:00', enabled: false }
};

type EstablishmentFormData = z.infer<typeof establishmentSchema>;

export function EstablishmentForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<EstablishmentFormData>({
    resolver: zodResolver(establishmentSchema),
    defaultValues: {
      workingHours: defaultWorkingHours
    }
  });

  useEffect(() => {
    loadProfile();
    checkGoogleCalendarConnection();
  }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Primeiro, buscar os detalhes do estabelecimento
      const { data: establishmentData, error: establishmentError } = await supabase
        .from('establishment_details')
        .select('*')
        .eq('barber_id', user.id);

      if (establishmentError) {
        console.error('Error loading establishment:', establishmentError);
        setError('Erro ao carregar dados do estabelecimento');
        return;
      }

      // Se encontrou um estabelecimento existente
      if (establishmentData && establishmentData.length > 0) {
        const establishment = establishmentData[0];
        setEstablishmentId(establishment.id);
        setValue('name', establishment.name);
        setValue('phone', establishment.phone);
        setValue('bio', establishment.bio || '');
        setValue('street', establishment.address_details.street || '');
        setValue('number', establishment.address_details.number || '');
        setValue('complement', establishment.address_details.complement || '');
        setValue('neighborhood', establishment.address_details.neighborhood || '');
        setValue('city', establishment.address_details.city || '');
        setValue('state', establishment.address_details.state || '');
        setValue('zipcode', establishment.address_details.zipcode || '');
        setValue('workingHours', establishment.working_hours || defaultWorkingHours);

        // Buscar imagens do estabelecimento
        const { data: imagesData } = await supabase
          .from('establishment_images')
          .select('*')
          .eq('establishment_id', establishment.id);

        if (imagesData) {
          const bannerImg = imagesData.find(img => img.type === 'banner');
          const profileImg = imagesData.find(img => img.type === 'profile');
          
          if (bannerImg) setBannerImage(bannerImg.url);
          if (profileImg) setProfileImage(profileImg.url);
        }
      } else {
        // Se não encontrou estabelecimento, carregar dados do perfil antigo
        const { data: profile } = await supabase
          .from('barber_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setValue('name', profile.name);
          setValue('phone', profile.phone);
          setValue('bio', profile.bio || '');
          setValue('street', profile.address_details?.street || '');
          setValue('number', profile.address_details?.number || '');
          setValue('complement', profile.address_details?.complement || '');
          setValue('neighborhood', profile.address_details?.neighborhood || '');
          setValue('city', profile.address_details?.city || '');
          setValue('state', profile.address_details?.state || '');
          setValue('zipcode', profile.address_details?.zipcode || '');
          setValue('workingHours', profile.working_hours || defaultWorkingHours);
          setBannerImage(profile.banner_url || null);
          setProfileImage(profile.profile_url || null);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  }

  async function checkGoogleCalendarConnection() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('barber_profiles')
        .select('google_calendar_connected')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setIsGoogleCalendarConnected(data?.google_calendar_connected || false);
    } catch (error) {
      console.error('Error checking Google Calendar connection:', error);
    }
  }

  async function handleGoogleCalendarConnect() {
    try {
      const authUrl = await getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      setError('Erro ao conectar com o Google Calendar');
    }
  }

  async function handleImageUpload(file: File, type: 'banner' | 'profile') {
    if (!file) return null;
    
    if (file.size > MAX_FILE_SIZE) {
      setError('Arquivo muito grande. Tamanho máximo: 5MB');
      return null;
    }
    
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError('Tipo de arquivo não suportado. Use: JPG, PNG ou WebP');
      return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !establishmentId) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${type}_${establishmentId}_${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `public/${type}s/${fileName}`;

    try {
      type === 'banner' ? setUploadingBanner(true) : setUploadingProfile(true);

      const { error: uploadError } = await supabase.storage
        .from('barber-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('barber-images')
        .getPublicUrl(filePath);

      // Save image reference in establishment_images table
      const { error: imageError } = await supabase
        .from('establishment_images')
        .upsert({
          establishment_id: establishmentId,
          type,
          url: publicUrl
        }, {
          onConflict: 'establishment_id,type'
        });

      if (imageError) throw imageError;

      return publicUrl;
    } catch (error) {
      console.error(`Error uploading ${type} image:`, error);
      setError(`Erro ao fazer upload da imagem de ${type === 'banner' ? 'capa' : 'perfil'}`);
      return null;
    } finally {
      type === 'banner' ? setUploadingBanner(false) : setUploadingProfile(false);
    }
  }

  async function onSubmit(data: EstablishmentFormData) {
    try {
      console.log('Starting form submission...', { formData: data });
      setSaving(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        setError('Usuário não autenticado');
        return;
      }

      const addressDetails = {
        street: data.street,
        number: data.number,
        complement: data.complement || '',
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        zipcode: data.zipcode
      };

      const establishmentData = {
        barber_id: user.id,
        name: data.name,
        phone: data.phone,
        bio: data.bio || '',
        address_details: addressDetails,
        working_hours: data.workingHours
      };

      let result;
      if (establishmentId) {
        // Atualizar estabelecimento existente
        console.log('Updating existing establishment...', { id: establishmentId });
        result = await supabase
          .from('establishment_details')
          .update(establishmentData)
          .eq('id', establishmentId)
          .select()
          .single();
      } else {
        // Criar novo estabelecimento
        console.log('Creating new establishment...');
        result = await supabase
          .from('establishment_details')
          .insert(establishmentData)
          .select()
          .single();
      }

      if (result.error) {
        console.error('Error saving establishment:', result.error);
        throw result.error;
      }

      if (result.data) {
        setEstablishmentId(result.data.id);
      }

      console.log('Establishment saved successfully');
      alert('Estabelecimento salvo com sucesso!');
    } catch (error: any) {
      console.error('Error saving establishment:', error);
      setError(error.message || 'Erro ao salvar estabelecimento');
    } finally {
      console.log('Form submission completed');
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
            <BackButton to="/barber/profile" />
            <h1 className="text-3xl font-bold">Configurações do Estabelecimento</h1>
          </div>
          <button
            onClick={handleGoogleCalendarConnect}
            className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
              isGoogleCalendarConnected
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {isGoogleCalendarConnected ? 'Google Calendar Conectado' : 'Conectar Google Calendar'}
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Imagens</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagem de Capa (1920x480px recomendado)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg relative">
              {bannerImage ? (
                <div className="w-full relative">
                  <img
                    src={bannerImage}
                    alt="Banner"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setBannerImage(null)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1 text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-gray-900 hover:text-gray-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-gray-500">
                      <span>Upload da imagem de capa</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = await handleImageUpload(file, 'banner');
                            if (url) setBannerImage(url);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, WebP até 5MB</p>
                </div>
              )}
              {uploadingBanner && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagem de Perfil (400x400px recomendado)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg relative">
              {profileImage ? (
                <div className="relative">
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-32 h-32 object-cover rounded-full"
                  />
                  <button
                    onClick={() => setProfileImage(null)}
                    className="absolute top-0 right-0 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1 text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-gray-900 hover:text-gray-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-gray-500">
                      <span>Upload da imagem de perfil</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = await handleImageUpload(file, 'profile');
                            if (url) setProfileImage(url);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, WebP até 5MB</p>
                </div>
              )}
              {uploadingProfile && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
                </div>
              )}
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-6">Informações Básicas</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome do Estabelecimento</label>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Rua</label>
                <input
                  type="text"
                  {...register('street')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                />
                {errors.street && (
                  <p className="mt-1 text-sm text-red-600">{errors.street.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Número</label>
                <input
                  type="text"
                  {...register('number')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                />
                {errors.number && (
                  <p className="mt-1 text-sm text-red-600">{errors.number.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Complemento</label>
                <input
                  type="text"
                  {...register('complement')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Bairro</label>
                <input
                  type="text"
                  {...register('neighborhood')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                />
                {errors.neighborhood && (
                  <p className="mt-1 text-sm text-red-600">{errors.neighborhood.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Cidade</label>
                <input
                  type="text"
                  {...register('city')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <input
                  type="text"
                  {...register('state')}
                  maxLength={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                />
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">CEP</label>
                <input
                  type="text"
                  {...register('zipcode')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                />
                {errors.zipcode && (
                  <p className="mt-1 text-sm text-red-600">{errors.zipcode.message}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Horário de Funcionamento</h3>
              <div className="space-y-4">
                {Object.entries(watch('workingHours')).map(([day, hours]) => (
                  <div key={day} className="flex items-center space-x-4">
                    <div className="w-32">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          {...register(`workingHours.${day}.enabled` as any)}
                          className="rounded border-gray-300 text-gray-900 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </span>
                      </label>
                    </div>
                    <div className="flex space-x-2 items-center">
                      <input
                        type="time"
                        {...register(`workingHours.${day}.start` as any)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                        disabled={!watch(`workingHours.${day}.enabled`)}
                      />
                      <span className="text-gray-500">até</span>
                      <input
                        type="time"
                        {...register(`workingHours.${day}.end` as any)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                        disabled={!watch(`workingHours.${day}.enabled`)}
                      />
                    </div>
                  </div>
                ))}
              </div>
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
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EstablishmentForm;