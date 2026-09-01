# Barbearia

## O que é
Sistema de gestão para barbeiro autônomo / dono de barbearia, usado **principalmente no
celular**, entre um atendimento e outro. Cada barbeiro tem sua própria conta e enxerga
apenas os próprios dados (clientes, cortes, serviços, financeiro, agenda).

## Usuários

**O barbeiro (dono da conta).** Usa o app em pé, com o celular na mão, muitas vezes com
uma das mãos ocupada. Precisa registrar um corte em menos de 10 segundos, ver quanto
fez no dia e saber quem chega em seguida. Não é usuário técnico e não vai ler manual.

**O cliente da barbearia.** Nunca cria conta. Chega pelo link/QR code da barbearia,
escolhe serviço, dia e horário, deixa nome e WhatsApp e pronto. Também está no celular.

## Superfícies

| Superfície | Modo | Quem usa |
|---|---|---|
| Painel (`/dashboard/*`) | Operate | Barbeiro logado |
| Página pública de agendamento (`/b/[slug]`) | Persuade → Operate | Cliente final, sem login |
| Login / cadastro | Operate | Barbeiro |

## Verdades do produto

- **Faturamento ≠ saldo.** O sistema sempre mostra os dois: o que entrou pelos cortes e
  o que sobrou depois das despesas.
- **Todo corte vira dinheiro automaticamente.** Registrar um corte cria a entrada no
  financeiro na mesma transação. O barbeiro nunca lança a mesma coisa duas vezes.
- **A agenda é do barbeiro.** A conta nasce sem nenhum dia de trabalho definido. O
  barbeiro escolhe em quais dias e horários atende antes de a página pública aceitar
  qualquer agendamento, e todo agendamento entra como **pendente** até ele confirmar.
- **Pagamento é presencial.** Pix, dinheiro ou cartão são a *intenção* do cliente. O valor
  real entra no financeiro quando o barbeiro conclui o atendimento.
- **Histórico é imutável.** Apagar um serviço ou cliente não apaga cortes já registrados: o nome e o preço
  ficam gravados no corte.

## Restrições

- Next.js (App Router) + Server Actions, Prisma, PostgreSQL (Neon). Sem backend separado.
- Instalável como PWA no celular; precisa ser utilizável com uma mão só.
- Valores em centavos (`Int`), nunca float. Datas calculadas no fuso `America/Sao_Paulo`.
- Toda consulta filtra por `userId`, é o que garante o isolamento entre contas.

## Fora de escopo
Pagamento online / gateway, SMS de confirmação, múltiplos barbeiros por conta,
comissionamento, estoque de produtos.
