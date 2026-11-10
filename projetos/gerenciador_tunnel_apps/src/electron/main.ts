import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  shell,
  ipcMain,
  dialog,
  nativeImage,
  Notification,
} from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Sinalizar que o servidor está rodando dentro do Electron (evita auto-boot duplicado no import)
process.env.OLIVELAS_ELECTRON_MODE = '1';

// Evitar erro de SUID chrome-sandbox no Ubuntu 24.04+ / Linux quando executado sem root
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-setuid-sandbox');
}

import { startServer, ProcessManager, db } from '../server/index.js';
import { ensureExtendedPath } from '../server/services/processManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let serverPort = 3002;
let isQuitting = false;

// Garantir que apenas uma instância do aplicativo desktop rode por vez
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (!mainWindow.isVisible()) mainWindow.show();
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// Resolver diretório de dados persistente (SQLite)
function resolveDataDirectory(): string {
  if (process.env.OLIVELAS_DATA_DIR) {
    return path.resolve(process.env.OLIVELAS_DATA_DIR);
  }
  const localDataDir = path.resolve(process.cwd(), 'data');
  if (!app.isPackaged) {
    return localDataDir;
  }

  // Candidatos portáteis: pasta ./data ao lado do AppImage, na raiz do projeto ou no diretório padrão do projeto local
  const candidates: string[] = [];
  if (process.env.APPIMAGE) {
    const appImageDir = path.dirname(process.env.APPIMAGE);
    candidates.push(path.resolve(appImageDir, 'data'));
    candidates.push(path.resolve(appImageDir, '..', 'data'));
  }
  candidates.push(localDataDir);
  candidates.push(path.join(app.getPath('home'), 'Downloads', 'projetos', 'olivelas-local-tunnel', 'data'));

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(path.join(candidate, 'local_tunnel.db'))) {
        fs.accessSync(candidate, fs.constants.W_OK);
        return candidate;
      }
    } catch {}
  }

  return path.join(app.getPath('userData'), 'data');
}

// Resolver ícone da aplicação/bandeja
function getAppIcon() {
  const candidates = [
    path.resolve(__dirname, '../../build/icons/icon.png'),
    path.resolve(process.cwd(), 'build/icons/icon.png'),
    path.resolve(process.resourcesPath || '', 'build/icons/icon.png'),
  ];

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const img = nativeImage.createFromPath(p);
        if (!img.isEmpty()) return img;
      }
    } catch {}
  }

  // Fallback: ícone PNG 32x32 embutido em Base64 (azul/roxo Olivelas Tunnel)
  const fallbackBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAbUlEQVR4nO2WMQoAIAwD8/9P9+qg4iLSdG5B0I5NStI0AADN7gKsABbACmABrIAn4J2R+69wR8z8r7gH4JzxB3A1sAJYACuABbACtgR2p28H7A5gBawAFsAKYAGsgBXAAlgBLIAV8ADe9g4X51n02wAAAABJRU5ErkJggg==';
  return nativeImage.createFromDataURL(`data:image/png;base64,${fallbackBase64}`);
}

function getPreloadPath(): string {
  const candidates = [
    path.resolve(__dirname, 'preload.cjs'),
    path.resolve(process.cwd(), 'src/electron/preload.cjs'),
    path.resolve(process.resourcesPath || '', 'app.asar.unpacked/src/electron/preload.cjs'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return path.resolve(__dirname, 'preload.cjs');
}

function updateTrayMenu() {
  if (!tray) return;

  const runningCount = ProcessManager.getRunningCount();
  const activeSummary = ProcessManager.getActiveSummary();

  const statusLabel =
    runningCount > 0
      ? `🟢 ${runningCount} aplicação(ões)/túnel(is) em execução`
      : '⚪ Nenhum processo em execução';

  const activeItems: Electron.MenuItemConstructorOptions[] = activeSummary
    .filter((item) => item.publicUrl)
    .map((item) => ({
      label: `🌐 Abrir ${item.publicUrl}`,
      click: () => {
        if (item.publicUrl) shell.openExternal(item.publicUrl);
      },
    }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Olivelas Local Tunnel & App Runner',
      enabled: false,
    },
    {
      label: statusLabel,
      enabled: false,
    },
    ...(activeItems.length > 0
      ? [{ type: 'separator' as const }, ...activeItems]
      : []),
    { type: 'separator' },
    {
      label: '🖥️ Abrir Painel de Controle',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createMainWindow();
        }
      },
    },
    {
      label: '🌐 Abrir no Navegador Web',
      click: () => {
        shell.openExternal(`http://localhost:${serverPort}`);
      },
    },
    { type: 'separator' },
    {
      label: '▶️ Iniciar Todas as Aplicações Ativas',
      click: async () => {
        try {
          await ProcessManager.startAll();
          updateTrayMenu();
        } catch (err) {
          console.error('Erro ao iniciar todas pela bandeja:', err);
        }
      },
    },
    {
      label: '⏹️ Parar Todos os Processos e Túneis',
      enabled: runningCount > 0,
      click: async () => {
        try {
          await ProcessManager.stopAll();
          updateTrayMenu();
        } catch (err) {
          console.error('Erro ao parar todas pela bandeja:', err);
        }
      },
    },
    { type: 'separator' },
    {
      label: '❌ Sair Completamente',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip(`Olivelas Local Tunnel (${runningCount} ativos)`);
  tray.setContextMenu(contextMenu);
}

function setupTray() {
  if (tray) return;
  try {
    const icon = getAppIcon();
    const trayIcon =
      process.platform === 'darwin'
        ? icon.resize({ width: 18, height: 18 })
        : icon.resize({ width: 24, height: 24 });

    tray = new Tray(trayIcon);
    updateTrayMenu();

    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.focus();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      } else {
        createMainWindow();
      }
    });

    // Atualizar o menu da bandeja periodicamente para refletir processos ativos e URLs geradas
    setInterval(() => {
      updateTrayMenu();
    }, 3000);
  } catch (err) {
    console.warn('Aviso: Não foi possível inicializar o ícone da bandeja do sistema:', err);
  }
}

function createMainWindow() {
  const icon = getAppIcon();

  mainWindow = new BrowserWindow({
    width: 1340,
    height: 860,
    minWidth: 920,
    minHeight: 620,
    title: 'Olivelas Local Tunnel & App Runner',
    backgroundColor: '#090d16',
    icon,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // URL a carregar: servidor Vite em modo dev (se definido) ou o servidor Express embutido
  const targetUrl = process.env.ELECTRON_DEV_URL || `http://localhost:${serverPort}`;
  mainWindow.loadURL(targetUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Abrir links externos (ex: *.trycloudflare.com, *.ngrok-free.app, ou portas de outras aplicações) no navegador padrão
  const isInternalAppUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
      if (!isLocal) return false;
      const devPort = process.env.ELECTRON_DEV_URL
        ? new URL(process.env.ELECTRON_DEV_URL).port
        : '';
      return parsed.port === String(serverPort) || (Boolean(devPort) && parsed.port === devPort);
    } catch {
      return false;
    }
  };

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!isInternalAppUrl(url)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isInternalAppUrl(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Comportamento ao fechar a janela: se houver túneis/apps rodando e bandeja ativa, minimizar para a bandeja
  mainWindow.on('close', (event) => {
    if (isQuitting) return;

    const runningCount = ProcessManager.getRunningCount();
    if (runningCount > 0 && tray) {
      event.preventDefault();
      mainWindow?.hide();
      updateTrayMenu();

      if (Notification.isSupported()) {
        new Notification({
          title: 'Olivelas Local Tunnel continua ativo',
          body: `${runningCount} processo(s)/túnel(is) continuam rodando em segundo plano na bandeja do sistema.`,
          icon: getAppIcon(),
        }).show();
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Registrar handlers IPC para recursos nativos do Desktop
function registerIpcHandlers() {
  ipcMain.handle('electron:open-external', async (_event, url: string) => {
    if (url && typeof url === 'string') {
      await shell.openExternal(url);
      return true;
    }
    return false;
  });

  ipcMain.handle('electron:select-directory', async (_event, defaultPath?: string) => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Selecionar Diretório do Projeto Local',
      defaultPath: defaultPath && fs.existsSync(defaultPath) ? defaultPath : app.getPath('home'),
      properties: ['openDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  ipcMain.handle('electron:get-app-info', () => {
    return {
      isElectron: true,
      version: app.getVersion(),
      platform: process.platform,
      serverPort,
      dataDir: resolveDataDirectory(),
    };
  });
}

// Inicialização completa da aplicação Electron
app.whenReady().then(async () => {
  ensureExtendedPath();
  registerIpcHandlers();

  const dataDir = resolveDataDirectory();
  const distDir = path.resolve(__dirname, '../../dist/client');

  try {
    const started = await startServer({
      port: Number(process.env.PORT || 3002),
      dataDir,
      distDir: fs.existsSync(distDir) ? distDir : path.resolve(__dirname, '../../dist'),
      allowFallbackPort: true,
    });
    serverPort = started.port;
  } catch (err) {
    console.error('Erro ao iniciar servidor interno no Electron:', err);
  }

  setupTray();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
  try {
    const settings = db.prepare('SELECT auto_stop_on_exit FROM settings WHERE id = 1').get() as any;
    const shouldStopAll = settings ? Boolean(settings.auto_stop_on_exit) : true;
    if (shouldStopAll) {
      ProcessManager.stopAllSync();
    }
  } catch {
    ProcessManager.stopAllSync();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && ProcessManager.getRunningCount() === 0) {
    app.quit();
  }
});
