# 💈 Barbearia Navalha

Site completo (público + loja virtual + painel administrativo) para uma barbearia,
com **agendamento online confirmado via WhatsApp**, **catálogo de produtos com
carrinho e pedido finalizado no WhatsApp** e **pagamento sempre presencial**.

| Camada | Tecnologia |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, React 19, Turbopack) |
| Linguagem | TypeScript (strict) |
| Estilos | Tailwind CSS v4 |
| Banco | PostgreSQL / [Supabase](https://supabase.com) (Auth + Postgres + RLS) |
| Mensageria | WhatsApp (links `wa.me` com mensagem pronta) |
| Versionamento | Git + GitHub |

---

## ✨ Funcionalidades

### Site público

- **Página inicial** — hero, diferenciais, serviços em destaque, equipe, galeria,
  vitrine da loja e CTA de agendamento.
- **Serviços** (`/servicos`) — catálogo com filtro por categoria e página de
  detalhes por serviço (preço, duração, profissionais que executam).
- **Preços** (`/precos`) — tabela completa agrupada por categoria.
- **Equipe** (`/profissionais`) — perfis, especialidades e tabela
  serviço × profissional.
- **Galeria** (`/galeria`) — trabalhos com filtro por categoria.
- **Onde estamos** (`/localizacao`) — mapa do Google, endereço, formas de chegada
  e estacionamento.
- **Horários** (`/horarios`) — expediente por dia, regras da agenda online.
- **Contato** (`/contato`) — formulário que monta a mensagem e abre o WhatsApp,
  telefone, e-mail e Instagram.

### Agendamento (`/agendar`)

Assistente em 4 etapas:

1. **Serviço** — escolha do procedimento (preço e duração).
2. **Profissional** — escolha de quem executa.
3. **Data e horário** — até 21 dias à frente; slots de 30 min gerados a partir do
   expediente e **horários já ocupados são desabilitados** em tempo real.
4. **Seus dados** — nome, WhatsApp, e-mail e observações.

Ao enviar, o agendamento entra no banco com status `pending` e a tela exibe o
**código da reserva** (ex.: `AG-ELRVSUC7U`) e o botão
**“Solicitar confirmação no WhatsApp”**, que abre o WhatsApp com a mensagem já
preenchida (código, cliente, serviço, profissional, data, hora, valor).

### Loja virtual (`/loja`, `/loja/[slug]`, `/carrinho`, `/checkout`)

- Catálogo com busca e filtro por categoria, respeitando o **estoque real**.
- Página de produto com preço, preço “de”, quantidade, disponibilidade e produtos
  relacionados.
- **Carrinho persistido em `localStorage`**, com controle de quantidade e total.
- **Checkout** que grava o pedido (`pending`) e gera o link de WhatsApp com os
  itens, o total e o aviso de **pagamento presencial**.
- No painel, ao **confirmar** o pedido, o estoque é baixado automaticamente e a
  movimentação é registrada.

### Painel administrativo (`/admin`)

| Módulo | O que faz |
| --- | --- |
| **Visão geral** | Faturamento, ticket médio, pendências, gráfico diário, top serviços, próximos agendamentos e últimos pedidos. |
| **Agendamentos** | Lista filtrável por status; **confirmar**, concluir ou cancelar; atalho para WhatsApp e ligação do cliente. |
| **Clientes** | Base com busca, total de agendamentos, valor gasto e observações editáveis. |
| **Equipe** | Editar nome, função, bio, especialidades e ativar/desativar profissionais. |
| **Serviços** | Editar nome, descrição, preço, duração e visibilidade. |
| **Produtos** | Editar nome, descrição, preço, preço “de”, SKU, categoria e visibilidade. |
| **Estoque** | Entradas, saídas e ajustes com histórico de movimentações e alerta de estoque baixo. |
| **Pedidos** | Filtrar por status, confirmar, marcar pronto, entregar ou cancelar. |
| **Relatórios** | Faturamento total e diário, ticket médio, serviços e produtos mais vendidos. |

### Autenticação

- `src/proxy.ts` protege `/admin/*` usando a sessão do Supabase Auth.
- `/admin/login` com e-mail e senha.
- Sem Supabase configurado o painel abre em **modo demonstração**, com dados
  locais de exemplo — útil para avaliar o produto antes de criar o banco.

---

## 🚀 Começando

### 1. Instalação

```bash
npm install
```

### 2. Variáveis de ambiente

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

NEXT_PUBLIC_WHATSAPP_NUMBER=5511987654321
NEXT_PUBLIC_WHATSAPP_MESSAGE=Olá! Gostaria de informações sobre os serviços.
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> **Sem essas variáveis** o app roda em modo demonstração: todas as páginas,
> o agendamento, o carrinho e o painel funcionam com dados locais em memória.

### 3. Banco de dados (Supabase)

1. Crie um projeto em <https://supabase.com/dashboard>.
2. Abra o **SQL Editor** e execute `supabase/schema.sql`.
3. (Opcional) Execute `supabase/seed.sql` para cadastrar o catálogo inicial.
4. Em **Authentication → Users**, crie um usuário para o painel e registre-o
   como administrador:

```sql
insert into public.admin_users (id, email, name, role)
select id, 'admin@barbearianavalha.com.br', 'Administrador', 'admin'
from auth.users where email = 'admin@barbearianavalha.com.br';
```

### 4. Rodando

```bash
npm run dev      # http://localhost:3000
npm run build    # build de produção
npm run start    # serve o build
npm run lint     # ESLint
```

### 5. Imagens

As imagens do site são SVGs gerados por script (funcionam offline e são
leves). Para usar as fotos reais, sobrescreva os arquivos em `public/images/`
ou troque as URLs gravadas no banco.

```bash
node scripts/generate-placeholders.mjs
```

---

## 🗂️ Estrutura

```
src/
├── app/
│   ├── (site)/              # páginas públicas
│   │   ├── page.tsx         # inicial
│   │   ├── servicos/        # catálogo + [slug]
│   │   ├── precos/
│   │   ├── profissionais/
│   │   ├── galeria/
│   │   ├── localizacao/
│   │   ├── horarios/
│   │   ├── contato/
│   │   ├── agendar/
│   │   ├── loja/            # catálogo + [slug]
│   │   ├── carrinho/
│   │   └── checkout/
│   ├── (admin)/admin/       # painel administrativo
│   │   ├── page.tsx         # visão geral
│   │   ├── agendamentos/ clientes/ equipe/
│   │   ├── servicos/ produtos/ estoque/
│   │   ├── pedidos/ relatorios/
│   │   └── login/
│   ├── layout.tsx           # html/body, fontes, CartProvider
│   ├── globals.css          # tema Tailwind v4 + tokens da marca
│   ├── sitemap.ts robots.ts manifest.ts not-found.tsx
├── actions/                 # Server Actions (booking, orders, admin, auth)
├── components/
│   ├── site/                # header, footer, cards, formulários
│   ├── booking/             # assistente de agendamento
│   ├── store/               # carrinho, vitrine, checkout
│   └── admin/               # tabelas e gestores do painel
├── lib/
│   ├── data.ts              # camada de dados (Supabase ⇄ demo)
│   ├── demo-data.ts         # base local de demonstração
│   ├── demo-store.ts        # armazenamento em memória (modo demo)
│   ├── whatsapp.ts          # templates e links do WhatsApp
│   ├── site-config.ts       # dados da barbearia (endereço, contato, navegação)
│   ├── types.ts admin-ui.ts utils.ts auth.ts
│   └── supabase/            # clients (browser/server/admin) + RLS
└── proxy.ts                 # proteção de /admin
supabase/
├── schema.sql               # tabelas, RLS, functions
└── seed.sql                 # catálogo inicial
```

---

## 🔐 Modelo de dados

`schema.sql` cria:

- `services`, `professionals`, `gallery`, `business_hours` — catálogo público.
- `clients` — clientes (criados automaticamente no primeiro agendamento/pedido).
- `bookings` — agendamentos com `status` (`pending`, `confirmed`, `completed`,
  `cancelled`, `no_show`) e índice único por profissional/data/hora para evitar
  conflitos de horário.
- `products`, `stock_movements` — loja e histórico de estoque.
- `orders`, `order_items` — pedidos da loja virtual.
- `admin_users` — usuários do painel.

Duas funções auxiliares:

- `finalize_order(order_id)` — baixa o estoque e grava as movimentações.
- `admin_revenue_summary(from, to)` — consolidado para relatórios.

**RLS:** leitura pública do catálogo; escrita pública apenas em `bookings` e
`orders` **sempre com status `pending`**; acesso completo para usuários
autenticados. As Server Actions do painel checam a sessão antes de escrever.

---

## 📲 Fluxo do WhatsApp

| Situação | Mensagem gerada |
| --- | --- |
| Agendamento | Código da reserva, cliente, serviço, profissional, data, hora, valor e observações. |
| Pedido da loja | Código do pedido, itens, total, endereço e aviso de pagamento presencial. |
| Contato | Mensagem padrão do `.env` ou a mensagem montada no formulário. |
| Produto | Consulta de disponibilidade de um item específico. |

O número usado vem de `NEXT_PUBLIC_WHATSAPP_NUMBER` (somente dígitos, com DDI e
DDD). Os links são `https://wa.me/<numero>?text=<mensagem codificada>`.

---

## 🚀 Deploy

O projeto é um Next.js padrão e pode ir para **Vercel**, **Render**, **Railway**
ou qualquer plataforma Node 20+.

```bash
npm run build
npm run start
```

Configure as mesmas variáveis de ambiente do `.env.local` no painel da plataforma.

---

## 🐙 Git e GitHub

O repositório já vem com histórico Git e dois workflows em `.github/workflows/`:

| Workflow | O que faz |
| --- | --- |
| `ci.yml` | Lint, checagem de tipos e build a cada push/PR. |
| `deploy-vercel.yml` | Publica na Vercel (só roda se `VERCEL_TOKEN` estiver configurado). |

Para publicar no seu GitHub:

```bash
# 1. Crie o repositório vazio no GitHub (sem README) e conecte
git remote add origin https://github.com/<seu-usuario>/barbearia-navalha.git

# 2. Envie tudo
git branch -M main
git push -u origin main
```

Depois é só configurar os secrets no GitHub (Settings → Secrets and variables →
Actions) caso queira o deploy automático:

| Secret | Descrição |
| --- | --- |
| `VERCEL_TOKEN` | Token da Vercel. |
| `VERCEL_ORG_ID` | ID da organização na Vercel. |
| `VERCEL_PROJECT_ID` | ID do projeto na Vercel. |

> **Nota:** neste ambiente o `gh` (GitHub CLI) não está instalado e não há
> credenciais configuradas, então o `push` precisa ser feito da sua máquina
> (ou instale o CLI com `winget install GitHub.cli` e rode `gh auth login`).

---

## 📄 Licença

MIT — use, altere e distribua livremente.
