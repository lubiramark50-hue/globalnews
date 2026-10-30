-- Dedicated GlobalNews Supabase project only
create extension if not exists pgcrypto;
create table if not exists public.news_articles(
 id uuid primary key default gen_random_uuid(),
 external_id text not null,
 headline text not null,
 excerpt text,
 source_name text not null,
 source_url text not null unique,
 image_url text,
 category text not null default 'World',
 region_code text,
 regional boolean not null default false,
 published_at timestamptz,
 ingested_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 check(source_url ~ '^https?://')
);
create index if not exists news_published on public.news_articles(published_at desc);
create index if not exists news_country on public.news_articles(region_code,published_at desc);
create index if not exists news_category on public.news_articles(category,published_at desc);
alter table public.news_articles enable row level security;
revoke all on public.news_articles from anon,authenticated;
create policy "Public news excerpts" on public.news_articles for select to anon,authenticated using (true);
grant select on public.news_articles to anon,authenticated;
