import { spawn } from 'node:child_process';

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error('Usage: node scripts/run-with-env.mjs <command> [...args]');
  process.exit(1);
}

const child = spawn(command, args, {
  env: {
    ...process.env,
    BROWSERSLIST_IGNORE_OLD_DATA: '1',
    NEXT_TELEMETRY_DISABLED: '1',
  },
  shell: true,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
