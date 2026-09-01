import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Erros que significam "a conexao morreu antes da consulta sair".
 *
 * O Neon suspende o banco depois de alguns minutos parado e derruba as conexoes
 * TCP abertas. O pool do Prisma so descobre isso quando tenta usar o socket,
 * e ai devolve ConnectionReset. Repetir a consulta abre uma conexao nova e
 * resolve, sem o barbeiro ver erro nenhum.
 */
const CONNECTION_ERROR_CODES = new Set([
  'P1001', // nao conseguiu alcancar o banco
  'P1002', // o banco demorou demais para responder
  'P1017', // o servidor fechou a conexao
]);

const CONNECTION_ERROR_PATTERNS = [
  'ConnectionReset',
  'Connection reset',
  'ECONNRESET',
  'EPIPE',
  'Connection closed',
  'Timed out fetching a new connection',
];

function isConnectionError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    CONNECTION_ERROR_CODES.has(error.code)
  ) {
    return true;
  }
  if (error instanceof Prisma.PrismaClientInitializationError) return true;

  const message = error instanceof Error ? error.message : String(error);
  return CONNECTION_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function createClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn'] : ['error'],
  });

  return client.$extends({
    query: {
      async $allOperations({ args, query }) {
        let lastError: unknown;

        // Tres tentativas cobrem o tempo que o Neon leva para acordar.
        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            return await query(args);
          } catch (error) {
            // So repetimos quando a conexao caiu: nesse caso a consulta nem
            // chegou ao banco, entao repetir nao duplica nada.
            if (!isConnectionError(error)) throw error;
            lastError = error;
            await sleep(300 * (attempt + 1));
          }
        }

        throw lastError;
      },
    },
  });
}

type ExtendedPrismaClient = ReturnType<typeof createClient>;

const globalForPrisma = globalThis as unknown as { prisma?: ExtendedPrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
