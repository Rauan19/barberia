# Barbearia

Sistema de gestão para barbeiro, feito para ser usado **no celular**, entre um
atendimento e outro. Cada barbeiro tem sua conta e enxerga apenas os próprios dados.

## O que tem

**Painel (privado, `/dashboard`)**

- **Dashboard**: cortes, faturamento, clientes e ticket médio de hoje; gráfico dos
  últimos 7 dias; resumo do mês (cortes, outras entradas, despesas, saldo); meta;
  agenda do dia; insights automáticos.
- **Agenda**: dia a dia, agendamentos pendentes para confirmar, encaixe manual,
  concluir atendimento (vira corte + entrada no financeiro).
- **Horários e bloqueios**: agenda semanal com intervalo de almoço, tamanho do
  slot, janela de agendamento e bloqueios pontuais (folga, consulta, feriado).
- **Clientes**: cadastro, busca, histórico, total gasto e último corte.
- **Cortes**: histórico com filtros de período, cliente, serviço e pagamento.
- **Serviços**: nome, preço, duração e se aparece no agendamento público.
- **Financeiro**: entradas e saídas, saldo, gráfico do período, quebra por forma
  de pagamento e por categoria de despesa.
- **Relatórios**: fechamento mês a mês, ranking de clientes e serviços.
- **Metas**: meta de faturamento e de cortes por mês, com progresso.
- **Configurações**: perfil, senha, logo da barbearia e página pública.

**Página pública (`/b/<slug>`)**: o cliente escolhe serviço, dia e horário, deixa
nome e WhatsApp e escolhe a forma de pagamento. O agendamento entra como
**pendente** e só ocupa a agenda depois que você confirma.

**PWA**: instalável na tela inicial do celular, abre sem barra do navegador.

## Stack

Next.js (App Router) + TypeScript · Tailwind CSS · Prisma · PostgreSQL (Neon) ·
Server Actions (sem backend separado) · Recharts.

## Rodando

```bash
npm install
npm run db:push
npm run dev
```

Acesse `http://localhost:3000` e crie sua conta em `/cadastro`. A conta nasce com os
serviços mais comuns cadastrados e **sem nenhum dia de trabalho definido**: você escolhe
em quais dias e horários atende antes de a página de agendamento aceitar qualquer cliente.

### Variáveis de ambiente

Copie `.env.example` para `.env`:

| Variável | Para que serve |
|---|---|
| `DATABASE_URL` | String de conexão do PostgreSQL (Neon), no endpoint com `-pooler` |
| `AUTH_SECRET` | Chave de assinatura do cookie de sessão |

Mantenha `connect_timeout=15&pool_timeout=20` na `DATABASE_URL`. O Neon suspende o
banco depois de alguns minutos parado e leva uns 2 segundos para acordar; sem essa
folga a primeira consulta depois da ociosidade falha.

Gere um `AUTH_SECRET` novo com:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run db:push` | Aplica o schema no banco |
| `npm run db:studio` | Abre o Prisma Studio |

## Como as coisas se conectam

```
Corte registrado ──► FinancialTransaction (INCOME / CORTE)
                     └─ some junto se o corte for apagado

Agendamento público ──► PENDENTE
                        └─ você confirma ──► CONFIRMADO
                                             └─ conclui ──► Corte + entrada
```

- **Faturamento ≠ saldo.** Faturamento é o que entrou pelos cortes; saldo é o que sobrou depois das despesas.
- **Histórico não se perde.** Apagar um serviço ou cliente não apaga cortes antigos: o nome e o preço ficam gravados no corte.
- **Valores em centavos.** Nunca `float`. Datas são calculadas no fuso
  `America/Sao_Paulo`.
- **Isolamento por conta.** Toda consulta filtra por `userId`.

## Banco que dorme

No plano free, o Neon suspende o compute depois de ~5 minutos sem uso e derruba as
conexões TCP abertas. O pool do Prisma só descobre isso ao tentar usar o socket, e
devolve `ConnectionReset`. Por isso [lib/db.ts](lib/db.ts) repete automaticamente as
consultas que falham por erro de conexão: nesses casos a consulta nem chegou ao banco,
então repetir é seguro e não duplica nada.

A primeira requisição depois de um período parado leva uns 2 segundos. As seguintes
ficam na casa dos 150 ms, que é a distância até a região do banco.

## Deploy (Vercel)

1. Suba o repositório no GitHub.
2. Importe na Vercel.
3. Configure `DATABASE_URL` e `AUTH_SECRET` nas variáveis de ambiente do projeto.
4. Rode `npx prisma db push` uma vez contra o banco de produção.
