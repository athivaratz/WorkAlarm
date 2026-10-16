export function createPersistQueue() {
  let chain = Promise.resolve();

  return (task: () => Promise<void>): Promise<void> => {
    const run = chain.then(task, task);
    chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };
}
