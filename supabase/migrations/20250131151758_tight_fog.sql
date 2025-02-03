/*
  # Adicionar colunas para imagens

  1. Alterações
    - Adiciona coluna `banner_url` para imagem de capa
    - Adiciona coluna `profile_url` para imagem de perfil
    - Adiciona coluna `address_details` para informações detalhadas do endereço
    - Adiciona coluna `google_calendar_tokens` para tokens do Google Calendar
    - Adiciona coluna `google_calendar_connected` para status da conexão

  2. Segurança
    - Mantém as políticas RLS existentes
*/

-- Adicionar novas colunas à tabela barber_profiles
ALTER TABLE barber_profiles 
ADD COLUMN IF NOT EXISTS banner_url text,
ADD COLUMN IF NOT EXISTS profile_url text,
ADD COLUMN IF NOT EXISTS address_details jsonb,
ADD COLUMN IF NOT EXISTS google_calendar_tokens jsonb,
ADD COLUMN IF NOT EXISTS google_calendar_connected boolean DEFAULT false;

-- Criar bucket para armazenamento de imagens se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('barber-images', 'barber-images', true)
ON CONFLICT (id) DO NOTHING;

-- Criar política para permitir upload de imagens
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'barber-images' AND
  (storage.foldername(name))[1] = 'public'
);

-- Criar política para permitir leitura pública de imagens
CREATE POLICY "Allow public read access to images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'barber-images' AND (storage.foldername(name))[1] = 'public');

-- Criar política para permitir que usuários deletem suas próprias imagens
CREATE POLICY "Allow users to delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'barber-images' AND (storage.foldername(name))[1] = 'public');