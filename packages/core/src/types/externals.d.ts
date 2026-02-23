declare module 'sql.js' {
  export interface Statement {
    bind(params?: unknown[]): boolean;
    step(): boolean;
    getAsObject(params?: Record<string, unknown>): Record<string, unknown>;
    get(params?: unknown[]): unknown[];
    free(): void;
    reset(): void;
  }

  export interface Database {
    run(sql: string, params?: unknown[]): void;
    exec(sql: string, params?: unknown[]): QueryExecResult[];
    prepare(sql: string): Statement;
    getRowsModified(): number;
    export(): Uint8Array;
    close(): void;
  }

  export interface QueryExecResult {
    columns: string[];
    values: unknown[][];
  }

  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number>) => Database;
  }

  export default function initSqlJs(config?: Record<string, unknown>): Promise<SqlJsStatic>;
}

declare module 'gray-matter' {
  interface GrayMatterFile {
    data: { [key: string]: any };
    content: string;
    excerpt?: string;
    orig: string;
  }

  function matter(input: string): GrayMatterFile;

  namespace matter {
    function stringify(content: string, data: object): string;
  }

  export default matter;
}

declare module 'isomorphic-git' {
  import type { FsClient } from 'isomorphic-git';

  export interface GitHttpRequest {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: AsyncIterableIterator<Uint8Array>;
  }

  export interface GitHttpResponse {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: AsyncIterableIterator<Uint8Array>;
    statusCode: number;
    statusMessage: string;
  }

  export interface HttpClient {
    request(request: GitHttpRequest): Promise<GitHttpResponse>;
  }

  export interface ServerRef {
    ref: string;
    oid: string;
  }

  export interface ReadCommitResult {
    oid: string;
    commit: {
      message: string;
      tree: string;
      parent: string[];
      author: { name: string; email: string; timestamp: number };
      committer: { name: string; email: string; timestamp: number };
    };
    payload: string;
  }

  export function clone(args: {
    fs: typeof import('node:fs');
    http: HttpClient;
    dir: string;
    url: string;
    ref?: string;
    singleBranch?: boolean;
    depth?: number;
    onProgress?: (progress: { phase: string; loaded: number; total: number }) => void;
  }): Promise<void>;

  export function log(args: {
    fs: typeof import('node:fs');
    dir: string;
    depth?: number;
    ref?: string;
  }): Promise<ReadCommitResult[]>;

  export function listServerRefs(args: {
    http: HttpClient;
    url: string;
    prefix?: string;
    symrefs?: boolean;
  }): Promise<ServerRef[]>;

  export function statusMatrix(args: {
    fs: typeof import('node:fs');
    dir: string;
    ref?: string;
  }): Promise<[string, number, number, number][]>;

  export function fetch(args: {
    fs: typeof import('node:fs');
    http: HttpClient;
    dir: string;
    url?: string;
    ref?: string;
    singleBranch?: boolean;
  }): Promise<{ defaultBranch: string | null; fetchHead: string | null }>;

  export function fastForward(args: {
    fs: typeof import('node:fs');
    http?: HttpClient;
    dir: string;
    ref?: string;
    singleBranch?: boolean;
  }): Promise<void>;

  export function merge(args: {
    fs: typeof import('node:fs');
    dir: string;
    ours?: string;
    theirs: string;
    author?: { name: string; email: string };
  }): Promise<{ oid: string; alreadyMerged?: boolean; fastForward?: boolean }>;

  export function commit(args: {
    fs: typeof import('node:fs');
    dir: string;
    message: string;
    author?: { name: string; email: string };
  }): Promise<string>;

  export function push(args: {
    fs: typeof import('node:fs');
    http: HttpClient;
    dir: string;
    url?: string;
    remote?: string;
    ref?: string;
  }): Promise<void>;

  export function add(args: {
    fs: typeof import('node:fs');
    dir: string;
    filepath: string;
  }): Promise<void>;

  export function remove(args: {
    fs: typeof import('node:fs');
    dir: string;
    filepath: string;
  }): Promise<void>;

  export default {
    clone,
    log,
    listServerRefs,
    statusMatrix,
    fetch,
    fastForward,
    merge,
    commit,
    push,
    add,
    remove,
  };
}

declare module 'isomorphic-git/http/node' {
  import type { HttpClient } from 'isomorphic-git';
  const http: HttpClient;
  export default http;
}
