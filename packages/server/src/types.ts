import type { openDatabase } from '@nori/core';

type Database = Awaited<ReturnType<typeof openDatabase>>;

export type AppEnv = {
  Variables: {
    db: Database;
    saveDb: () => void;
  };
};
