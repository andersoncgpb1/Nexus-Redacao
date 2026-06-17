-- Exemplo para criar uma licenca.
-- Troque o hash pelo valor gerado no helper abaixo:
-- node scripts/hash-license-key.js NEXUS-CLIENTE-2026-0001

insert into public.licenses (
  license_key_hash,
  customer_name,
  customer_email,
  plan,
  status,
  expires_at,
  max_activations
) values (
  'COLE_O_HASH_AQUI',
  'Cliente Exemplo',
  'cliente@email.com',
  'standard',
  'active',
  '2027-06-17 23:59:59-03',
  1
);
