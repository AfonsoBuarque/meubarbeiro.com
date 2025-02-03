/*
  # Seed de dados para barbearias

  1. Dados Inseridos
    - 5 barbearias com:
      - Usuários na tabela auth.users
      - Perfil completo
      - Serviços oferecidos
      - Localização
      - Horário de funcionamento
*/

-- Inserir usuários na tabela auth.users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
VALUES
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'vintage@meubarbeiro.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Barbearia Vintage"}'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'kings@meubarbeiro.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Barber Shop Kings"}'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    'oldschool@meubarbeiro.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Barbearia Old School"}'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003',
    'studio@meubarbeiro.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Studio Hair Men"}'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440004',
    'elite@meubarbeiro.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Barber Elite"}'
  );

-- Inserir perfis de barbeiros
INSERT INTO barber_profiles (id, name, phone, bio, address, latitude, longitude)
VALUES
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'Barbearia Vintage',
    '(11) 98765-4321',
    'Especialistas em cortes clássicos e modernos, com mais de 15 anos de experiência.',
    'Rua Augusta, 1500 - Jardins, São Paulo - SP',
    -23.561684,
    -46.656139
  ),
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'Barber Shop Kings',
    '(11) 97654-3210',
    'O melhor em cortes degradê e desenhos na barba. Ambiente descontraído e cerveja gelada.',
    'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    -23.564834,
    -46.652266
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    'Barbearia Old School',
    '(11) 96543-2109',
    'Tradição em cortes masculinos desde 1995. Ambiente familiar e acolhedor.',
    'Rua Oscar Freire, 750 - Jardins, São Paulo - SP',
    -23.562714,
    -46.669787
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003',
    'Studio Hair Men',
    '(11) 95432-1098',
    'Barbearia moderna com profissionais premiados. Especialistas em barbas longas.',
    'Av. Brigadeiro Faria Lima, 2000 - Itaim Bibi, São Paulo - SP',
    -23.567253,
    -46.693753
  ),
  (
    '550e8400-e29b-41d4-a716-446655440004',
    'Barber Elite',
    '(11) 94321-0987',
    'Experiência premium em cuidados masculinos. Tratamentos especiais para barba e cabelo.',
    'Rua dos Pinheiros, 500 - Pinheiros, São Paulo - SP',
    -23.566416,
    -46.678871
  );

-- Inserir serviços para cada barbearia
INSERT INTO barber_services (barber_id, name, price, duration, description)
VALUES
  -- Barbearia Vintage
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'Corte Clássico',
    60,
    45,
    'Corte tradicional com acabamento perfeito'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'Barba Completa',
    45,
    30,
    'Alinhamento e hidratação da barba'
  ),
  -- Barber Shop Kings
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'Degradê Personalizado',
    70,
    60,
    'Degradê com design exclusivo'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'Desenho na Barba',
    50,
    45,
    'Arte e precisão no desenho da sua barba'
  ),
  -- Barbearia Old School
  (
    '550e8400-e29b-41d4-a716-446655440002',
    'Corte Tradicional',
    55,
    40,
    'Corte clássico com técnicas tradicionais'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    'Combo Pai e Filho',
    100,
    90,
    'Corte para pai e filho com preço especial'
  ),
  -- Studio Hair Men
  (
    '550e8400-e29b-41d4-a716-446655440003',
    'Corte Premium',
    80,
    60,
    'Corte exclusivo com produtos importados'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003',
    'Tratamento para Barba',
    65,
    45,
    'Hidratação profunda e modelagem'
  ),
  -- Barber Elite
  (
    '550e8400-e29b-41d4-a716-446655440004',
    'Corte VIP',
    90,
    60,
    'Experiência completa com bebida inclusa'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440004',
    'Spa Day Masculino',
    150,
    120,
    'Corte, barba, hidratação e massagem'
  );