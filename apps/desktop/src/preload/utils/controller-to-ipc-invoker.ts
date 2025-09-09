export function controllerToIpcInvoker<T>(): T {
  const invoker = {};

  return invoker as T;
}
