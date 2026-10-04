-- =============================================================================
-- Seed Data for Nanjai Clothing (Tamil & Spiritual Printed T-shirts)
-- =============================================================================

-- Ensure Default Store Configuration
insert into public.store_config (key, value) values
  ('store_name',      'Nanjai Clothing'),
  ('store_tagline',   'Tamil Heritage & Spiritual Printed Apparel'),
  ('whatsapp_number', '919876543210'),
  ('currency_symbol', '₹'),
  ('delivery_fee',    '50')
on conflict (key) do update set value = excluded.value;

-- Seed Products with deterministic UUIDs so cart doesn't break on db reset
insert into public.products (id, title, description, price, image_url, in_stock, is_active) values
  (
    '00000000-0000-0000-0000-000000000101',
    'Yaadhum Oore Tee',
    'Premium 180 GSM combed cotton unisex oversized tee featuring the iconic Sangam poetry verse "யாதும் ஊரே யாவரும் கேளிர்" (To us all towns are one, all people our kin) in contemporary Tamil calligraphy.',
    549.00,
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop&q=80',
    true,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    'Om Namah Shivaya Tee',
    'Soft-washed pitch black tee crafted from breathable bio-washed cotton, adorned with minimalist Devanagari sacred vibration artwork and textured typography.',
    599.00,
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
    true,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    'Thiruvalluvar Minimalist Tee',
    'Classic ribbed crew neck tee paying homage to the immortal poet-philosopher Thiruvalluvar. Includes subtle Tamil script details on the nape and chest pocket print.',
    499.00,
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
    true,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000104',
    'Veeram (வீரம்) Graphic Tee',
    'Bold maroon graphic streetwear tee capturing the fierce ethos of classical Tamil warrior culture with high-density puff screen print.',
    649.00,
    'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop&q=80',
    true,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000105',
    'Trishul & Damru Spiritual Tee',
    'Heavyweight 220 GSM terry-cotton tee with a modern geometric cosmic Shiva Trishul illustration on charcoal grey fabric.',
    699.00,
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=80',
    true,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000106',
    'Semmozhi (செம்மொழி) Classic Tee',
    'Clean white tee celebrating the antiquity of the classical Tamil language with golden foil typographic accents.',
    549.00,
    'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80',
    true,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000107',
    'Mahadev Cosmic Tandav Tee',
    'Limited edition midnight navy tee inspired by the cosmic Nataraja dance of creation and eternity. Fade-resistant DTF print.',
    649.00,
    'https://images.unsplash.com/photo-1618354691593-57550f24208d?w=800&auto=format&fit=crop&q=80',
    true,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000108',
    'Anbe Sivam (அன்பே சிவம்) Tee',
    'Vintage washed olive green tee emblazoned with the timeless message "Love is Shiva". Breathable and pre-shrunk.',
    529.00,
    'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&auto=format&fit=crop&q=80',
    true,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000109',
    'Chola Imperial Tiger Tee',
    'Regal black streetwear tee inspired by the imperial Chola dynasty naval empire and tiger insignia.',
    749.00,
    'https://images.unsplash.com/photo-1527719327859-c6ce80353573?w=800&auto=format&fit=crop&q=80',
    false, -- Out of stock demo item
    true
  )
on conflict (id) do nothing;

-- Demo galleries (multiple images per product) for the carousel.
update public.products set images = array[
  image_url,
  'https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=800&auto=format&fit=crop&q=80'
] where id in ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000104');

update public.products set images = array[
  image_url,
  'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&auto=format&fit=crop&q=80'
] where id in ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000107');

-- Seed Admin User
insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@nanjai.com',
  extensions.crypt('adminpassword123', extensions.gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
) on conflict (id) do nothing;

insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  format('{"sub":"%s","email":"%s"}', '00000000-0000-0000-0000-000000000001', 'admin@nanjai.com')::jsonb,
  'email',
  now(),
  now(),
  now()
) on conflict (provider, provider_id) do nothing;


-- Add Admin user to public.admins table so they are recognized as an admin by the application
insert into public.admins (user_id) values ('00000000-0000-0000-0000-000000000001') on conflict (user_id) do nothing;
