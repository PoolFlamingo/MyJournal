import type { IpcRequest, IpcResponse, IpcMethod } from "../types/ipc";
import {
  listTodos,
  getTodo,
  createTodo,
  updateTodo,
  deleteTodo,
} from "./todos";
import {
  bootstrap,
  setSetting,
  getSetting,
  listJournals,
  createJournal,
  openJournal,
  renameJournal,
  deleteJournal,
  unlockJournal,
  lockJournal,
} from "./journals";
import {
  getEntryByDate,
  saveEntry,
  deleteEntry,
  listMonth,
} from "./entries";

type Handler = (params?: Record<string, unknown>) => Promise<unknown>;

const handlers: Record<IpcMethod, Handler> = {
  // Legacy TODO
  "todo.list": (params) =>
    listTodos(params as unknown as Parameters<typeof listTodos>[0]),
  "todo.get": (params) =>
    getTodo(params as unknown as Parameters<typeof getTodo>[0]),
  "todo.create": (params) =>
    createTodo(params as unknown as Parameters<typeof createTodo>[0]),
  "todo.update": (params) =>
    updateTodo(params as unknown as Parameters<typeof updateTodo>[0]),
  "todo.delete": (params) =>
    deleteTodo(params as unknown as Parameters<typeof deleteTodo>[0]),
  // App lifecycle
  ping: async () => ({ pong: true, timestamp: Date.now() }),
  "app.bootstrap": () => bootstrap(),
  "app.setSetting": (params) =>
    setSetting(params as unknown as Parameters<typeof setSetting>[0]),
  "app.getSetting": (params) =>
    getSetting(params as unknown as Parameters<typeof getSetting>[0]),
  // Journal domain
  "journal.list": () => listJournals(),
  "journal.create": (params) =>
    createJournal(params as unknown as Parameters<typeof createJournal>[0]),
  "journal.open": (params) =>
    openJournal(params as unknown as Parameters<typeof openJournal>[0]),
  "journal.rename": (params) =>
    renameJournal(params as unknown as Parameters<typeof renameJournal>[0]),
  "journal.delete": (params) =>
    deleteJournal(params as unknown as Parameters<typeof deleteJournal>[0]),
  "journal.unlock": (params) =>
    unlockJournal(params as unknown as Parameters<typeof unlockJournal>[0]),
  "journal.lock": (params) =>
    lockJournal(params as unknown as Parameters<typeof lockJournal>[0]),
  // Entry domain
  "entry.getByDate": (params) =>
    getEntryByDate(params as unknown as Parameters<typeof getEntryByDate>[0]),
  "entry.save": (params) =>
    saveEntry(params as unknown as Parameters<typeof saveEntry>[0]),
  "entry.delete": (params) =>
    deleteEntry(params as unknown as Parameters<typeof deleteEntry>[0]),
  "entry.listMonth": (params) =>
    listMonth(params as unknown as Parameters<typeof listMonth>[0]),
};

/**
 * Routes an IPC request to the appropriate handler.
 * Returns a properly formatted IPC response.
 */
export async function handleRequest(request: IpcRequest): Promise<IpcResponse> {
  const handler = handlers[request.method as IpcMethod];

  if (!handler) {
    return {
      id: request.id,
      error: `Unknown method: ${request.method}`,
    };
  }

  try {
    const result = await handler(request.params);
    return { id: request.id, result };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return { id: request.id, error: message };
  }
}
