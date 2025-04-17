// Este arquivo agora só será usado para acesso ao banco, não para autenticação
// A autenticação agora é feita via Firebase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL não está definida no arquivo .env');
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY não está definida no arquivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'X-Client-Info': 'meubarbeiro-web',
    }
  },
  db: {
    schema: 'public'
  }
});

// Removido: Eventos de autenticação do Supabase

// Verificar conexão
supabase
  .from('barber_profiles')
  .select('count', { count: 'exact', head: true })
  .then(() => {
    console.log('Conexão com Supabase estabelecida com sucesso');
  })
  .catch((error) => {
    console.error('Erro ao conectar com Supabase:', error.message);
  });