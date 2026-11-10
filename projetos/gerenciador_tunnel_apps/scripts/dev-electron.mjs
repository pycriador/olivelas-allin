import { spawn, execSync } from 'child_process';
import net from 'net';

const VITE_PORT = 5174;

function waitForPort(port, timeoutMs = 15000) {
  const start = Date.now();
  return new Promise((resolve) => {
    const check = () => {
      const socket = new net.Socket();
      socket.setTimeout(500);
      socket.once('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) resolve(false);
        else setTimeout(check, 300);
      });
      socket.once('timeout', () => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) resolve(false);
        else setTimeout(check, 300);
      });
      socket.connect(port, '127.0.0.1');
    };
    check();
  });
}

async function run() {
  console.log('🔨 Compilando processo principal do Electron e Backend...');
  execSync('npx tsc -p tsconfig.server.json && node scripts/prepare-build.mjs', {
    stdio: 'inherit',
  });

  console.log('⚡ Iniciando servidor Vite (Frontend HMR)...');
  const viteProc = spawn('npx', ['vite', '--port', String(VITE_PORT)], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  await waitForPort(VITE_PORT);

  const electronArgs =
    process.platform === 'linux'
      ? ['electron', '--no-sandbox', 'dist-server/electron/main.js']
      : ['electron', 'dist-server/electron/main.js'];

  console.log('🖥️ Abrindo janela nativa do ElectronJS...');
  const electronProc = spawn('npx', electronArgs, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      ELECTRON_DEV_URL: `http://localhost:${VITE_PORT}`,
    },
  });

  electronProc.on('close', (code) => {
    viteProc.kill('SIGTERM');
    process.exit(code ?? 0);
  });
}

run().catch((err) => {
  console.error('Erro ao iniciar modo Electron Dev:', err);
  process.exit(1);
});
