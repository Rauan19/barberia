export type ActionState = {
  ok: boolean;
  error?: string;
  message?: string;
};

export const idleState: ActionState = { ok: false };

export function fail(error: string): ActionState {
  return { ok: false, error };
}

export function succeed(message?: string): ActionState {
  return { ok: true, message };
}
