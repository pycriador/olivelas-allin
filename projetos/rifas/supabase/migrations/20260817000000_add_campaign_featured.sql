-- Campanha fixada na pagina inicial (escolhida pelo Administrador Global).
alter table public.campaigns
  add column if not exists is_featured boolean not null default false;

-- Garante que apenas UMA campanha fica fixada por vez.
create unique index if not exists campaigns_single_featured
  on public.campaigns (is_featured)
  where is_featured;
