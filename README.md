# Meu Apê com Rosa

Portal imobiliário de Rosa Oliveira, voltado ao primeiro imóvel e a oportunidades na Zona Sul de São Paulo.

## Stack

- Next.js App Router, React e TypeScript
- Tailwind CSS
- Supabase Auth, Database e Storage
- Vercel

## Configuração local

1. Copie `.env.example` para `.env.local`.
2. Preencha as chaves do projeto Supabase `wjhgkqczmqvwodjdsutq`.
3. Aplique, em ordem, as migrations de `supabase/migrations`.
4. Crie a usuária `rosacorretora16@gmail.com` no Supabase Auth.
5. Insira o perfil dessa usuária em `public.profiles` com a função `admin`.
6. Execute `npm run dev`.

Nunca versione `.env.local`, service role ou outros secrets.

## Verificações

```bash
npm run lint
npm run type-check
npm run build
```

## Contato profissional

Rosa Oliveira · CRECI 117.140-SP · São Paulo - SP
