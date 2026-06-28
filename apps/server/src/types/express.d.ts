import type { Role } from '@prisma/client';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface AuthContext {
      id: string;
      email: string;
      role: Role;
      sessionId: string;
    }

    interface Request {
      /** Populated by the `requireAuth` / `optionalAuth` middleware. */
      auth?: AuthContext;
      /** Correlation id assigned to every request for tracing. */
      id?: string;
    }
  }
}

export {};
