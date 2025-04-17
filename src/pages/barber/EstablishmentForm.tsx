import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getAuthUrl } from '../../lib/google-calendar';
import { Loader2, Save, Plus, Trash2, Calendar, Upload, Image as ImageIcon } from 'lucide-react';
import { BackButton } from '../../components/BackButton';
import { auth } from '../../lib/firebase';

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

type BarberService = {
  id: string;
  barber_id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  created_at?: string;
  updated_at?: string;
};

interface BarberEmployee {
  id?: string;
  name: string;
  email: string;
  phone: string;
  photo?: string;
}

interface BarberProfile {
  id: string;
  auth_uid: string;
  name: string;
  phone: string;
  bio?: string;
  email: string;
}

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
  const [barberId, setBarberId] = useState<string | null>(null);

  const [services, setServices] = useState<BarberService[]>([]);
  const [serviceForm, setServiceForm] = useState<{
    id: string | null;
    name: string;
    price: string;
    duration: string;
    description: string;
  }>({ id: null, name: '', price: '', duration: '', description: '' });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [serviceError, setServiceError] = useState('');
  const [serviceSuccess, setServiceSuccess] = useState('');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<BarberService | null>(null);

  const [barbers, setBarbers] = useState<BarberEmployee[]>([]);
  const [barberForm, setBarberForm] = useState<{ name: string; email: string; phone: string; photo: File | null }>({ name: '', email: '', phone: '', photo: null });
  const [barberLoading, setBarberLoading] = useState(false);
  const [barberError, setBarberError] = useState<string | null>(null);
  const [barberSuccess, setBarberSuccess] = useState<string | null>(null);
  const [editingBarberId, setEditingBarberId] = useState<string | null>(null);

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

  useEffect(() => {
    if (establishmentId) fetchServices();
    if (!loading) fetchBarbers();
    // eslint-disable-next-line
  }, [establishmentId, loading, barberId, establishmentId]);

  async function loadProfile() {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Primeiro, buscar os detalhes do estabelecimento
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/establishment_details', {
        method: 'GET',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Content-Type': 'application/json'
        }
      });
      const establishmentData = await response.json();

      if (establishmentData.error) {
        console.error('Error loading establishment:', establishmentData.error);
        setError('Erro ao carregar dados do estabelecimento');
        return;
      }

      // Agora trata como objeto
      if (establishmentData && !establishmentData.error) {
        const establishment = establishmentData;
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
        setBannerImage(establishment.banner_url || null);
        setProfileImage(establishment.profile_url || null);
      } else {
        // Se não encontrou estabelecimento, carregar dados do perfil antigo
        const profileResponse = await fetch('http://localhost:3001/api/barber_profiles', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const profile = await profileResponse.json();

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
      const user = auth.currentUser;
      if (!user) return;

      const response = await fetch('http://localhost:3001/api/barber_profiles', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();

      if (data.error) throw data.error;
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

    const user = auth.currentUser;
    if (!user || !establishmentId) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${type}_${establishmentId}_${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `public/${type}s/${fileName}`;

    try {
      type === 'banner' ? setUploadingBanner(true) : setUploadingProfile(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('establishment_id', establishmentId);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/upload_image', {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });
      const data = await response.json();

      if (data.error) throw data.error;

      return data.url;
    } catch (error) {
      console.error(`Error uploading ${type} image:`, error);
      setError(`Erro ao fazer upload da imagem de ${type === 'banner' ? 'capa' : 'perfil'}`);
      return null;
    } finally {
      type === 'banner' ? setUploadingBanner(false) : setUploadingProfile(false);
    }
  }

  async function onSubmit(data: EstablishmentFormData) {
    setSaving(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuário não autenticado');
      // Substituir insert/update do Supabase por chamada ao backend Express
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/establishment_details', {
        method: establishmentId ? 'PUT' : 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          banner_url: bannerImage,
          profile_url: profileImage,
          user_id: user.uid,
          id: establishmentId
        })
      });
      if (!response.ok) throw new Error('Erro ao salvar estabelecimento');
      alert('Estabelecimento salvo com sucesso!');
      navigate('/barber/profile');
    } catch (error) {
      setError('Erro ao salvar estabelecimento');
    } finally {
      setSaving(false);
    }
  }

  async function fetchServices() {
    setServiceLoading(true);
    setServiceError('');
    setServiceSuccess('');
    try {
      // Buscar barber_id do usuário autenticado
      const token = localStorage.getItem('token');
      // Primeiro, buscar barber_id
      const profileRes = await fetch('http://localhost:3001/api/establishment_details', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profile = await profileRes.json();
      if (!profile.barber_id) throw new Error('Barber_id não encontrado');
      setBarberId(profile.barber_id);
      const res = await fetch(`http://localhost:3001/api/barber_services/${profile.barber_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setServices(data.services || []);
    } catch (e) {
      setServiceError('Erro ao carregar serviços');
    } finally {
      setServiceLoading(false);
    }
  }

  async function handleSaveService() {
    setServiceLoading(true);
    setServiceError('');
    setServiceSuccess('');
    try {
      const token = localStorage.getItem('token');
      // Buscar barber_id do usuário autenticado
      let barber_id = serviceForm.id ? serviceForm.barber_id : undefined;
      if (!barber_id) {
        const profileRes = await fetch('http://localhost:3001/api/establishment_details', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const profile = await profileRes.json();
        barber_id = profile.barber_id;
      }
      const method = serviceForm.id ? 'PUT' : 'POST';
      const url = serviceForm.id
        ? `http://localhost:3001/api/barber_services/${serviceForm.id}`
        : `http://localhost:3001/api/barber_services`;
      const body = {
        name: serviceForm.name,
        price: parseInt(serviceForm.price),
        duration: parseInt(serviceForm.duration),
        description: serviceForm.description,
        barber_id
      };
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Erro ao salvar serviço');
      setServiceSuccess(serviceForm.id ? 'Serviço atualizado com sucesso!' : 'Serviço adicionado com sucesso!');
      resetServiceForm();
      fetchServices();
    } catch (e) {
      setServiceError('Erro ao salvar serviço');
    } finally {
      setServiceLoading(false);
      setTimeout(() => setServiceSuccess(''), 2000);
    }
  }

  function resetServiceForm() {
    setServiceForm({ id: null, name: '', price: '', duration: '', description: '' });
    setEditingServiceId(null);
    setShowServiceForm(false);
  }

  function handleEditService(service: BarberService) {
    setServiceForm({
      id: service.id,
      name: service.name,
      price: service.price.toString(),
      duration: service.duration?.toString() || '',
      description: service.description,
      barber_id: service.barber_id
    });
    setEditingServiceId(service.id);
    setShowServiceForm(true);
  }

  function handleAddService() {
    resetServiceForm();
    setShowServiceForm(true);
  }

  async function handleDeleteServiceConfirm() {
    if (!serviceToDelete) return;
    setServiceLoading(true);
    setServiceError('');
    setServiceSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/barber_services/${serviceToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erro ao remover serviço');
      setServiceSuccess('Serviço removido com sucesso!');
      setServiceToDelete(null);
      fetchServices();
    } catch (e) {
      setServiceError('Erro ao remover serviço');
    } finally {
      setServiceLoading(false);
      setTimeout(() => setServiceSuccess(''), 2000);
    }
  }

  function handleServiceFormChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setServiceForm((prev) => ({ ...prev, [name]: value }));
  }
  function handleCancelEditService() {
    resetServiceForm();
  }

  async function fetchBarbers() {
    setBarberLoading(true);
    setBarberError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/barber_employees', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.warning === 'BARBEIROS NÃO CADASTRADOS') {
        setBarbers([]);
        setBarberError('BARBEIROS NÃO CADASTRADOS');
        return;
      }
      if (Array.isArray(data)) {
        setBarbers(data); // Mostra todos os funcionários cadastrados
        setBarberError(null);
      } else {
        setBarbers([]);
        setBarberError('Erro ao carregar funcionários');
      }
    } catch (err) {
      setBarberError('Erro ao carregar funcionários');
    } finally {
      setBarberLoading(false);
    }
  }

  async function handleAddBarber(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setBarberLoading(true);
    setBarberError(null);
    setBarberSuccess(null);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', barberForm.name);
      formData.append('email', barberForm.email);
      formData.append('phone', barberForm.phone);
      if (barberForm.photo) {
        formData.append('photo', barberForm.photo);
      }
      const response = await fetch('http://localhost:3001/api/barber_employees', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined, // NÃO definir Content-Type!
        body: formData,
      });
      if (!response.ok) throw new Error('Erro ao cadastrar funcionário barbeiro');
      setBarberSuccess('Funcionário cadastrado com sucesso!');
      setBarberForm({ name: '', email: '', phone: '', photo: null });
      fetchBarbers();
    } catch (err) {
      setBarberError('Erro ao cadastrar funcionário');
    } finally {
      setBarberLoading(false);
    }
  }

  function handleEditBarber(barber: BarberEmployee) {
    setBarberForm({
      name: barber.name,
      email: barber.email,
      phone: barber.phone,
      photo: null
    });
    setEditingBarberId(barber.id);
  }

  async function handleDeleteBarber(barber: BarberEmployee) {
    if (!window.confirm(`Deseja realmente excluir o barbeiro ${barber.name}?`)) return;
    setBarberLoading(true);
    setBarberError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/barber_profiles/${barber.id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (response.status === 404) {
        setBarberError('Barbeiro já foi removido ou não encontrado.');
        fetchBarbers();
        return;
      }
      if (!response.ok) throw new Error('Erro ao excluir barbeiro');
      setBarberSuccess('Barbeiro excluído com sucesso!');
      fetchBarbers();
    } catch (err) {
      setBarberError('Erro ao excluir barbeiro');
    } finally {
      setBarberLoading(false);
      setTimeout(() => setBarberSuccess(null), 2000);
    }
  }

  function handleCancelEditBarber() {
    setEditingBarberId(null);
    setBarberForm({ name: '', email: '', phone: '', photo: null });
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
                    src={bannerImage ? `http://localhost:3001${bannerImage}` : undefined}
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
                    src={profileImage ? `http://localhost:3001${profileImage}` : undefined}
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

            <div className="mt-10">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Serviços Oferecidos</h3>
              {serviceLoading && <p>Carregando...</p>}
              {serviceError && <p className="text-red-600">{serviceError}</p>}
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700 text-sm">Cadastre os serviços oferecidos, valores e descrições. Isso será exibido para seus clientes!</span>
                <button type="button" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center" onClick={handleAddService} disabled={serviceLoading}>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                  Novo Serviço
                </button>
              </div>
              <div className="overflow-x-auto rounded shadow">
                <table className="min-w-full mb-2 divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left px-3 py-2">Nome</th>
                      <th className="text-left px-3 py-2">Descrição</th>
                      <th className="text-left px-3 py-2">Preço</th>
                      <th className="text-left px-3 py-2">Duração</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.length === 0 && !serviceLoading && (
                      <tr><td colSpan={5} className="text-center text-gray-400 py-4">Nenhum serviço cadastrado</td></tr>
                    )}
                    {services.map((service, idx) => (
                      <tr key={service.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2">{service.name}</td>
                        <td className="px-3 py-2">{service.description}</td>
                        <td className="px-3 py-2">R$ {Number(service.price).toFixed(2)}</td>
                        <td className="px-3 py-2">{service.duration} min</td>
                        <td className="px-3 py-2 flex gap-2">
                          <button type="button" className="text-blue-600 hover:underline flex items-center" onClick={() => handleEditService(service)}>Editar</button>
                          <button type="button" className="text-red-600 hover:underline flex items-center" onClick={() => setServiceToDelete(service)}>Remover</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {serviceLoading && <div className="text-center py-4"><svg className="animate-spin h-6 w-6 text-gray-500 mx-auto" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg></div>}
              </div>
              {showServiceForm && (
                <div className="bg-white rounded shadow-lg p-4 mt-4 max-w-md mx-auto">
                  <div>
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome do serviço *</label>
                      <input
                        type="text"
                        name="name"
                        value={serviceForm.name}
                        onChange={handleServiceFormChange}
                        placeholder="Ex: Corte Masculino"
                        required
                        className="border rounded px-2 py-1 w-full"
                        disabled={serviceLoading}
                      />
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                      <input
                        type="text"
                        name="description"
                        value={serviceForm.description}
                        onChange={handleServiceFormChange}
                        placeholder="Ex: Corte, lavagem, finalização..."
                        className="border rounded px-2 py-1 w-full"
                        disabled={serviceLoading}
                      />
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$) *</label>
                      <input
                        type="number"
                        name="price"
                        value={serviceForm.price}
                        onChange={handleServiceFormChange}
                        placeholder="Ex: 50.00"
                        min="0"
                        step="1"
                        required
                        className="border rounded px-2 py-1 w-full"
                        disabled={serviceLoading}
                      />
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duração (min) *</label>
                      <input
                        type="number"
                        name="duration"
                        value={serviceForm.duration}
                        onChange={handleServiceFormChange}
                        placeholder="Ex: 30"
                        min="1"
                        step="1"
                        required
                        className="border rounded px-2 py-1 w-full"
                        disabled={serviceLoading}
                      />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button type="button" className="bg-gray-900 text-white rounded px-4 py-1" disabled={serviceLoading}
                        onClick={handleSaveService}
                      >
                        {editingServiceId ? 'Salvar' : 'Adicionar'}
                      </button>
                      <button type="button" onClick={handleCancelEditService} className="text-gray-600 px-4 py-1 border rounded" disabled={serviceLoading}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {serviceToDelete && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
                  <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm">
                    <h4 className="text-lg font-semibold mb-3">Remover serviço</h4>
                    <p className="mb-4">Deseja realmente remover o serviço <span className="font-bold">{serviceToDelete.name}</span>?</p>
                    <div className="flex gap-2 justify-end">
                      <button type="button" className="px-3 py-1 rounded border" onClick={() => setServiceToDelete(null)} disabled={serviceLoading}>Cancelar</button>
                      <button type="button" className="bg-red-600 text-white px-3 py-1 rounded" onClick={handleDeleteServiceConfirm} disabled={serviceLoading}>
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Barbeiros do Estabelecimento</h3>
              {barberSuccess && <div className="mb-2 p-2 bg-green-100 text-green-700 rounded">{barberSuccess}</div>}
              {barberError && <div className="mb-2 p-2 bg-red-100 text-red-700 rounded">{barberError}</div>}
              <div className="flex flex-wrap gap-2 mb-4">
                <input type="text" placeholder="Nome" value={barberForm.name} onChange={e => setBarberForm(f => ({ ...f, name: e.target.value }))} required className="border rounded px-2 py-1" disabled={barberLoading} />
                <input type="email" placeholder="E-mail" value={barberForm.email} onChange={e => setBarberForm(f => ({ ...f, email: e.target.value }))} required className="border rounded px-2 py-1" disabled={barberLoading} />
                <input type="tel" placeholder="Telefone" value={barberForm.phone} onChange={e => setBarberForm(f => ({ ...f, phone: e.target.value }))} required className="border rounded px-2 py-1" disabled={barberLoading} />
                <input type="file" accept="image/*" onChange={e => setBarberForm(f => ({ ...f, photo: e.target.files?.[0] || null }))} className="border rounded px-2 py-1" disabled={barberLoading} />
                <button type="button" onClick={handleAddBarber} disabled={barberLoading} className="bg-gray-900 text-white rounded px-4 py-1 hover:bg-gray-800 disabled:opacity-50">
                  {barberLoading ? <Loader2 className="h-4 w-4 animate-spin inline" /> : <Plus className="h-4 w-4 inline mr-1" />} Cadastrar
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>E-mail</th>
                      <th>Telefone</th>
                      <th>Foto</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {barbers.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-2 text-gray-400">Nenhum barbeiro cadastrado.</td></tr>
                    )}
                    {barbers.map((barber) => (
                      <tr key={barber.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{barber.name}</td>
                        <td className="px-4 py-2">{barber.email}</td>
                        <td className="px-4 py-2">{barber.phone}</td>
                        <td className="px-4 py-2">{barber.photo ? <img src={barber.photo.startsWith('/uploads/') ? barber.photo : `/uploads/${barber.photo}`} alt="Foto" style={{ width: 40, height: 40, borderRadius: '50%' }} /> : '-'}</td>
                        <td className="px-4 py-2 flex gap-2">
                          <button
                            className="text-blue-600 hover:underline flex items-center"
                            type="button"
                            onClick={() => handleEditBarber(barber)}
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 00-4-4l-8 8v3z" /></svg>
                            Editar
                          </button>
                          <button
                            className="text-red-600 hover:underline flex items-center"
                            type="button"
                            onClick={() => handleDeleteBarber(barber)}
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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