import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Mail, Scissors, User, Phone, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres')
});

const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  address: z.string().min(5, 'Endereço deve ter no mínimo 5 caracteres'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Você precisa aceitar os termos de uso'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

const termsOfService = `
TERMOS DE USO E POLÍTICA DE PRIVACIDADE

1. ACEITAÇÃO DOS TERMOS
Ao utilizar a plataforma MeuBarbeiro.com, você concorda com estes termos.

2. SERVIÇOS
2.1. A plataforma oferece serviços de agendamento online para barbearias.
2.2. Os barbeiros são responsáveis pelas informações fornecidas.

3. RESPONSABILIDADES
3.1. O barbeiro é responsável por manter seus dados atualizados.
3.2. O barbeiro deve comparecer nos horários agendados.
3.3. Cancelamentos devem ser feitos com antecedência mínima de 2 horas.

4. PRIVACIDADE
4.1. Seus dados serão protegidos conforme a LGPD.
4.2. Utilizamos seus dados apenas para a prestação dos serviços.

5. PAGAMENTOS
5.1. A plataforma não realiza cobranças dos clientes.
5.2. Os pagamentos são feitos diretamente ao barbeiro.

6. CANCELAMENTO
6.1. Você pode cancelar sua conta a qualquer momento.
6.2. Dados de agendamentos serão mantidos por 6 meses.
`;

export function AuthForm() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { register: registerLogin, handleSubmit: handleSubmitLogin, formState: { errors: loginErrors, isSubmitting: isSubmittingLogin } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const { register: registerSignup, handleSubmit: handleSubmitSignup, formState: { errors: registerErrors, isSubmitting: isSubmittingRegister } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmitLogin = async (data: LoginFormData) => {
    try {
      setLoading(true);
      setError(null);
      // 1. Login no Firebase
      await handleLogin(data.email, data.password);
      // 2. Obter UID do usuário autenticado
      const user = auth.currentUser;
      if (!user) throw new Error('Usuário não autenticado');
      // 3. Login no backend para obter JWT
      const loginRes = await fetch('https://backaend-production.up.railway.app/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, email: user.email })
      });
      if (!loginRes.ok) throw new Error('Falha ao autenticar no backend');
      const loginData = await loginRes.json();
      // 4. Salvar token JWT no localStorage
      localStorage.setItem('token', loginData.token);
      navigate('/barber/profile');
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError('Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitRegister = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      setError(null);
      await handleRegister(data.email, data.password);
      alert('Cadastro realizado com sucesso!');
      setIsRegistering(false);
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Erro ao realizar cadastro');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 1. Obter UID do usuário autenticado
      if (!user) throw new Error('Usuário não autenticado');
      // 2. Login no backend para obter JWT
      const loginRes = await fetch('https://backaend-production.up.railway.app/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, email: user.email })
      });
      if (!loginRes.ok) throw new Error('Falha ao autenticar no backend');
      const loginData = await loginRes.json();
      // 3. Salvar token JWT no localStorage
      localStorage.setItem('token', loginData.token);

      // 4. Verifica se já existe perfil do barbeiro, senão cria um cadastro prévio
      const profileRes = await fetch(`https://backaend-production.up.railway.app/api/barber_profiles/${user.uid}`, {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
      });
      if (profileRes.status === 404) {
        // Cadastro prévio do perfil
        await fetch('https://backaend-production.up.railway.app/api/barber_profiles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${loginData.token}`
          },
          body: JSON.stringify({
            uid: user.uid,
            name: user.displayName || '',
            email: user.email || '',
            phone: user.phoneNumber || '',
            address: ''
          })
        });
      }
      navigate('/barber/profile');
    } catch (error: any) {
      console.error('Google authentication error:', error);
      setError('Erro ao fazer login com Google');
    } finally {
      setLoading(false);
    }
  };

  async function handleLogin(email: string, password: string) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  }

  async function handleRegister(email: string, password: string) {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  }

  // Função para logout: remove o token JWT do localStorage e faz signOut do Firebase
  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <Link to="/" className="flex items-center justify-center mb-6">
            <Scissors className="h-8 w-8 text-gray-900" />
            <span className="ml-2 text-xl font-bold text-gray-900">MeuBarbeiro.com</span>
          </Link>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Área do Barbeiro
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isRegistering ? 'Crie sua conta para começar' : 'Acesse sua conta para gerenciar sua agenda'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {!isRegistering ? (
          // Login Form
          <form className="mt-8 space-y-6" onSubmit={handleSubmitLogin(onSubmitLogin)}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerLogin('email')}
                    type="email"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                    placeholder="Email"
                  />
                </div>
                {loginErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{loginErrors.email.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerLogin('password')}
                    type="password"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                    placeholder="Senha"
                  />
                </div>
                {loginErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{loginErrors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmittingLogin || loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingLogin || loading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>

            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setIsRegistering(true);
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Não tem uma conta? Cadastre-se
              </button>
            </div>
          </form>
        ) : (
          // Register Form
          <form className="mt-8 space-y-6" onSubmit={handleSubmitSignup(onSubmitRegister)}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="name" className="sr-only">Nome da Barbearia</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerSignup('name')}
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                    placeholder="Nome da Barbearia"
                  />
                </div>
                {registerErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{registerErrors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="sr-only">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerSignup('email')}
                    type="email"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                    placeholder="Email"
                  />
                </div>
                {registerErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{registerErrors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="sr-only">Telefone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerSignup('phone')}
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                    placeholder="Telefone"
                  />
                </div>
                {registerErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{registerErrors.phone.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="address" className="sr-only">Endereço</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerSignup('address')}
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                    placeholder="Endereço completo"
                  />
                </div>
                {registerErrors.address && (
                  <p className="mt-1 text-sm text-red-600">{registerErrors.address.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="sr-only">Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerSignup('password')}
                    type="password"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                    placeholder="Senha"
                  />
                </div>
                {registerErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{registerErrors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="sr-only">Confirmar Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerSignup('confirmPassword')}
                    type="password"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                    placeholder="Confirmar Senha"
                  />
                </div>
                {registerErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{registerErrors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  {...registerSignup('acceptTerms')}
                  type="checkbox"
                  id="acceptTerms"
                  className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 rounded"
                />
                <label htmlFor="acceptTerms" className="text-sm text-gray-600">
                  Eu aceito os{' '}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-gray-900 underline"
                  >
                    termos de uso
                  </button>
                </label>
              </div>
              {registerErrors.acceptTerms && (
                <p className="mt-1 text-sm text-red-600">{registerErrors.acceptTerms.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmittingRegister || loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingRegister || loading ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </div>

            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setIsRegistering(false);
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Já tem uma conta? Faça login
              </button>
            </div>
          </form>
        )}

        {/* Terms of Service Modal */}
        {showTerms && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
              <h3 className="text-xl font-bold mb-4">Termos de Uso</h3>
              <div className="prose prose-sm">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-600">
                  {termsOfService}
                </pre>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowTerms(false)}
                  className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Social Login Section */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Ou continue com</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleSignIn}
              type="button"
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>
          </div>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 px-4 py-2 rounded-md"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}