/**
 * IPC Protocol types for sidecar communication.
 * Uses JSON Lines (one JSON object per line) over stdin/stdout.
 * Follows JSON-RPC 2.0 conventions for request/response correlation.
 */

export interface IpcRequest {
  /** Unique request identifier for response correlation */
  id: string;
  /** RPC method name (e.g., "journal.list", "entry.save") */
  method: string;
  /** Optional parameters for the method */
  params?: Record<string, unknown>;
}

export interface IpcSuccessResponse {
  id: string;
  result: unknown;
}

export interface IpcErrorResponse {
  id: string;
  error: string;
}

export type IpcResponse = IpcSuccessResponse | IpcErrorResponse;

/** All available RPC methods */
export type IpcMethod =
  // Legacy TODO (preserved until scaffold removal)
  | "todo.list"
  | "todo.get"
  | "todo.create"
  | "todo.update"
  | "todo.delete"
  // App lifecycle
  | "ping"
  | "app.bootstrap"
  | "app.setSetting"
  | "app.getSetting"
  // Journal domain
  | "journal.list"
  | "journal.create"
  | "journal.open"
  | "journal.rename"
  | "journal.delete"
  | "journal.unlock"
  | "journal.lock"
  // Entry domain
  | "entry.getByDate"
  | "entry.save"
  | "entry.delete"
  | "entry.listMonth";

// ── Legacy TODO params (preserved) ────────────────────────────────────

/** Params for todo.create */
export interface CreateTodoParams {
  title: string;
  description?: string;
}

/** Params for todo.update */
export interface UpdateTodoParams {
  id: number;
  title?: string;
  description?: string | null;
  completed?: boolean;
}

/** Params for todo.get / todo.delete */
export interface TodoByIdParams {
  id: number;
}

/** Params for todo.list */
export interface ListTodosParams {
  completed?: boolean;
  search?: string;
}

/** Params for todo.get / todo.delete */
export interface TodoByIdParams {
  id: number;
}

/** Params for todo.list (optional filters) */
export interface ListTodosParams {
  completed?: boolean;
  search?: string;
}
