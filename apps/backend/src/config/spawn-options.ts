import { SpawnOptionsWithStdioTuple, StdioPipe } from 'child_process';

export function spawnOptions(): SpawnOptionsWithStdioTuple<
  StdioPipe,
  StdioPipe,
  StdioPipe
> {
  // When running under Electron, spawning process.execPath will
  // start another Electron instance which shows up in the Dock and can hang.
  // This forces Electron to run as a Node interpreter for spawned children.
  const isElectron = !!process.versions.electron;

  const env = {
    ...process.env,
    ...(isElectron ? { ELECTRON_RUN_AS_NODE: '1' } : {}),
  } as NodeJS.ProcessEnv;

  const options: SpawnOptionsWithStdioTuple<StdioPipe, StdioPipe, StdioPipe> = {
    stdio: ['pipe', 'pipe', 'pipe'],
    env,
    windowsHide: true,
  };

  return options;
}
