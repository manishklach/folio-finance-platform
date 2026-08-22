import { AsyncLocalStorage } from "node:async_hooks";

const storage = new AsyncLocalStorage();

export function runWithRequestContext(context, callback) {
  return storage.run(context, callback);
}

export function requestContext() {
  return storage.getStore() || { actor: "system", orgId: null, requestId: null, role: "system" };
}

export function currentActor() {
  return requestContext().actor;
}
