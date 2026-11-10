import { spawn, execSync, ChildProcess } from 'child_process';
import net from 'net';
import os from 'os';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { db } from '../db/index.js';
import { events } from './events.js';
import { decryptData } from './crypto.js';

export interface LogEntry {
  id: string;
  appId: number;
  source: 'app' | 'tunnel' | 'system';
  stream: 'stdout' | 'stderr';
  line: string;
  timestamp: string;
}

export interface DetectedUrlItem {
  url: string;
  label: string;
  category: 'local' | 'lan' | 'public';
  port?: number;
  source: 'app' | 'tunnel';
  detectedAt: string;
}

export interface RunningInstance {
  appId: number;
  appProcess: ChildProcess | null;
  tunnelProcess: ChildProcess | null;
  appStatus: 'stopped' | 'starting' | 'running' | 'error';
  tunnelStatus: 'stopped' | 'starting' | 'online' | 'error';
  tunnelProvider: string;
  publicUrl: string | null;
  detectedPort: number | null;
  detectedUrls: DetectedUrlItem[];
  appPid: number | null;
  tunnelPid: number | null;
  startedAt: string;
  historyId: number | null;
  logs: LogEntry[];
  stopping: boolean;
  restartCount: number;
}

export interface ActivePortInfo {
  port: number;
  address: string;
  processName: string;
  pid?: number;
}

const MAX_LOG_LINES = 600;

// Remover códigos de cores ANSI para facilitar regex de URLs e leitura
function stripAnsi(str: string): string {
  return str.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');
}

// Ignorar URLs de documentação, pacotes ou avisos genéricos de ferramentas
const IGNORED_URL_DOMAINS = [
  'nodejs.org',
  'npmjs.com',
  'github.com',
  'cloudflare.com',
  'developers.cloudflare.com',
  'ngrok.com',
  'dashboard.ngrok.com',
  'rolldown.rs',
  'vite.dev',
  'vitejs.dev',
  'w3.org',
  'aka.ms',
  'typescriptlang.org',
  'react.dev',
  'mozilla.org',
  'openssl.org',
  'docker.com',
];

function inferUrlLabel(
  cleanLine: string,
  parsed: URL,
  category: 'local' | 'lan' | 'public',
  source: 'app' | 'tunnel'
): string {
  const lowerLine = cleanLine.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();
  const port = parsed.port ? parseInt(parsed.port, 10) : undefined;

  if (category === 'public') {
    if (parsed.hostname.includes('trycloudflare.com')) return 'Túnel Cloudflared';
    if (parsed.hostname.includes('ngrok')) return 'Túnel Ngrok';
    if (parsed.hostname.includes('loca.lt')) return 'LocalTunnel';
    return 'URL Pública';
  }

  // Extrair prefixo [tag] se existir (ex: [api], [dashboard], [SERVER], [CLIENT])
  const tagMatch = cleanLine.match(/^\s*\[([a-zA-Z0-9_-]+)\]/);
  const prefixTag = tagMatch ? tagMatch[1].toLowerCase() : '';

  if (port === 4040) return 'Ngrok Inspector';
  if (pathname.includes('/swagger') || pathname.includes('/api/docs') || pathname.includes('/docs') || lowerLine.includes('swagger')) {
    return 'Swagger / Docs';
  }
  if (pathname.includes('/health') || lowerLine.includes('endpoints:') || lowerLine.includes('health')) {
    return 'Health / Endpoint';
  }
  if (pathname.includes('/admin/queues') || lowerLine.includes('bull')) {
    return 'Filas (Bull Board)';
  }
  if (pathname.includes('/graphql') || lowerLine.includes('graphql')) {
    return 'GraphQL';
  }
  if (pathname.includes('/webhook') || lowerLine.includes('webhook')) {
    return 'Webhook';
  }

  if (category === 'lan' || lowerLine.includes('network:')) {
    if (prefixTag === 'dashboard' || prefixTag === 'client' || lowerLine.includes('frontend')) {
      return `Rede Local (${prefixTag === 'dashboard' ? 'Dashboard' : 'Frontend'})`;
    }
    return `Rede Local (LAN${port ? ` :${port}` : ''})`;
  }

  // Se a linha possuir um item de lista explícito como "- Clientes: http..." ou "• Frontend: http..."
  const bulletLabelMatch = cleanLine.match(/(?:^|\])\s*[-•*]\s*([^:]{2,28}):\s*https?:\/\//i);
  if (bulletLabelMatch) {
    const rawBullet = bulletLabelMatch[1].trim();
    const lowerBullet = rawBullet.toLowerCase();
    if (lowerBullet === 'frontend') return 'Frontend';
    if (lowerBullet === 'backend') return 'Backend';
    if (lowerBullet === 'endpoints' || lowerBullet === 'health') return 'Health / Endpoint';
    return rawBullet;
  }

  if (lowerLine.includes('openwa is running on')) {
    return 'API Gateway (OpenWA)';
  }
  if (lowerLine.includes('frontend:') || lowerLine.includes('frontend ') || prefixTag === 'client' || prefixTag === 'frontend') {
    return 'Frontend';
  }
  if (lowerLine.includes('dashboard') || prefixTag === 'dashboard') {
    return 'Dashboard';
  }
  if (pathname && pathname !== '/') {
    return `Rota (${parsed.pathname})`;
  }
  if (lowerLine.includes('backend:') || lowerLine.includes('backend ') || prefixTag === 'server' || prefixTag === 'backend' || prefixTag === 'api') {
    return prefixTag === 'api' ? 'API Backend' : 'Backend';
  }
  if (lowerLine.includes('servidor unificado')) {
    return 'Servidor Unificado';
  }
  if (lowerLine.includes('local:')) {
    return 'App Local';
  }

  return source === 'tunnel' ? 'Túnel' : `Serviço Local${port ? ` (:${port})` : ''}`;
}

export function extractAllUrlsFromLine(
  rawLine: string,
  source: 'app' | 'tunnel'
): Array<Omit<DetectedUrlItem, 'detectedAt'>> {
  const cleanLine = stripAnsi(rawLine).trim();
  if (!cleanLine || !cleanLine.includes('http')) return [];

  // Ignorar linhas de erro de conexão de cliente HTTP (ex: polling ou proxy error) para não capturar URLs externas com falha
  const lowerClean = cleanLine.toLowerCase();
  if (
    source === 'app' &&
    (lowerClean.includes('erro ao ') ||
      lowerClean.includes('error:') ||
      lowerClean.includes('proxy error') ||
      lowerClean.includes('econnrefused') ||
      lowerClean.includes('instância respondeu com código'))
  ) {
    return [];
  }

  const matches = cleanLine.match(/https?:\/\/[^\s"'<>`|]+/gi);
  if (!matches) return [];

  const extracted: Array<Omit<DetectedUrlItem, 'detectedAt'>> = [];

  for (const rawMatch of matches) {
    // Remover pontuação final comum em logs
    const cleaned = rawMatch.replace(/[.,;:!?)\]}'"]+$/, '');
    try {
      const parsed = new URL(cleaned);
      const hostLower = parsed.hostname.toLowerCase();

      // Ignorar domínios de documentação / aviso de ferramentas
      if (IGNORED_URL_DOMAINS.some((dom) => hostLower === dom || hostLower.endsWith(`.${dom}`))) {
        continue;
      }

      // Ignorar URLs internas do próprio servidor do Cloudflared metrics (127.0.0.1:20241/metrics)
      if (source === 'tunnel' && (parsed.pathname.includes('/metrics') || hostLower === '127.0.0.1')) {
        if (parsed.port !== '4040') continue;
      }

      // Normalizar 0.0.0.0 ou [::] para localhost
      if (hostLower === '0.0.0.0' || hostLower === '[::]' || hostLower === '[::1]' || hostLower === '127.0.0.1') {
        parsed.hostname = 'localhost';
      }

      const finalHost = parsed.hostname.toLowerCase();
      let category: 'local' | 'lan' | 'public' = 'public';
      if (finalHost === 'localhost' || finalHost === '127.0.0.1') {
        category = 'local';
      } else if (
        /^192\.168\.\d+\.\d+$/.test(finalHost) ||
        /^10\.\d+\.\d+\.\d+$/.test(finalHost) ||
        /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(finalHost) ||
        finalHost.endsWith('.local')
      ) {
        category = 'lan';
      }

      const port = parsed.port ? parseInt(parsed.port, 10) : undefined;

      // Quando a fonte é o processo de túnel (cloudflared/ngrok), capturar apenas URLs públicas ou o Ngrok Inspector (:4040),
      // evitando sobrescrever o rótulo da URL local da aplicação que o cloudflared repete nos logs de configuração
      if (source === 'tunnel' && category !== 'public' && port !== 4040) {
        continue;
      }

      // Ignorar apenas a própria porta do servidor Olivelas Local Tunnel (ou do Vite dev do Electron)
      const selfPort = Number(process.env.PORT || 3002);
      const selfVitePort = process.env.ELECTRON_DEV_URL ? 5174 : -1;
      if (category === 'local' && (port === selfPort || port === selfVitePort)) {
        continue;
      }

      // Normalizar barra final apenas quando for raiz sem query/hash
      let normalizedUrl = parsed.toString();
      if (parsed.pathname === '/' && !parsed.search && !parsed.hash && normalizedUrl.endsWith('/')) {
        normalizedUrl = normalizedUrl.slice(0, -1);
      }

      const label = inferUrlLabel(cleanLine, parsed, category, source);

      extracted.push({
        url: normalizedUrl,
        label,
        category,
        port,
        source,
      });
    } catch {}
  }

  return extracted;
}

// Obter o IP da rede local (LAN)
export function getLocalLanIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    // Priorizar interfaces Ethernet / Wi-Fi reais
    if (name.startsWith('docker') || name.startsWith('br-') || name.startsWith('veth') || name.startsWith('lo')) {
      continue;
    }
    const list = interfaces[name];
    if (!list) continue;
    for (const iface of list) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// Verificar se uma porta TCP está aberta localmente
export function checkPortListening(port: number, host = '127.0.0.1', timeoutMs = 800): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;

    const done = (result: boolean) => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve(result);
      }
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
    socket.connect(port, host === 'localhost' ? '127.0.0.1' : host);
  });
}

// Aguardar porta ficar disponível (até maxWaitMs)
async function waitForPort(port: number, host: string, maxWaitMs = 8000, shouldAbort?: () => boolean): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (shouldAbort && shouldAbort()) return false;
    const isUp = await checkPortListening(port, host, 500);
    if (isUp) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

// Matar árvore de processos (evita filhos órfãos como node/vite/cloudflared)
function killProcessTree(proc: ChildProcess | null) {
  if (!proc || !proc.pid) return;
  const pid = proc.pid;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      try {
        process.kill(-pid, 'SIGTERM');
      } catch {
        proc.kill('SIGTERM');
      }
      setTimeout(() => {
        try {
          process.kill(-pid, 'SIGKILL');
        } catch {
          try {
            proc.kill('SIGKILL');
          } catch {}
        }
      }, 1200);
    }
  } catch {
    try {
      proc.kill('SIGKILL');
    } catch {}
  }
}

// Limpar processos órfãos (node, vite, tsx, nest, npm, start.sh, esbuild, concurrently) que ficaram
// rodando no diretório do projeto alvo de sessões anteriores, evitando EADDRINUSE ao iniciar/parar
function cleanupProjectOrphanProcesses(projectDir: string): number {
  if (!projectDir || process.platform !== 'linux') return 0;
  try {
    if (!fs.existsSync(projectDir)) return 0;
    const realTarget = fs.realpathSync(projectDir);
    const selfCwd = fs.realpathSync(process.cwd());
    const homeDir = os.homedir();
    if (!realTarget || realTarget === '/' || realTarget === homeDir || realTarget === selfCwd) {
      return 0;
    }

    const procEntries = fs.readdirSync('/proc').filter((name) => /^\d+$/.test(name));
    const pidsToKill: number[] = [];

    for (const pidStr of procEntries) {
      const pid = parseInt(pidStr, 10);
      if (pid === process.pid || pid === process.ppid) continue;
      try {
        const pidCwd = fs.realpathSync(`/proc/${pid}/cwd`);
        if (pidCwd === realTarget || pidCwd.startsWith(realTarget + path.sep)) {
          const cmdlineRaw = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').replace(/\0/g, ' ').toLowerCase();
          if (
            cmdlineRaw.includes('node') ||
            cmdlineRaw.includes('npm') ||
            cmdlineRaw.includes('vite') ||
            cmdlineRaw.includes('tsx') ||
            cmdlineRaw.includes('nest') ||
            cmdlineRaw.includes('esbuild') ||
            cmdlineRaw.includes('concurrently') ||
            cmdlineRaw.includes('start.sh')
          ) {
            pidsToKill.push(pid);
          }
        }
      } catch {}
    }

    for (const pid of pidsToKill) {
      try {
        process.kill(pid, 'SIGTERM');
      } catch {}
    }

    if (pidsToKill.length > 0) {
      setTimeout(() => {
        for (const pid of pidsToKill) {
          try {
            process.kill(pid, 'SIGKILL');
          } catch {}
        }
      }, 600);
    }

    return pidsToKill.length;
  } catch {
    return 0;
  }
}

// Garantir que diretórios comuns de binários estejam no PATH (essencial para Electron no Linux/macOS/Windows)
export function ensureExtendedPath() {
  const home = os.homedir();
  const sep = process.platform === 'win32' ? ';' : ':';
  const currentPaths = (process.env.PATH || '').split(sep).filter(Boolean);

  const extraCandidates: string[] =
    process.platform === 'win32'
      ? [
          path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'npm'),
          path.join(process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local'), 'Microsoft', 'WinGet', 'Links'),
          path.join(home, 'scoop', 'shims'),
          'C:\\ProgramData\\chocolatey\\bin',
          'C:\\Program Files\\nodejs',
          'C:\\Program Files (x86)\\cloudflared',
          'C:\\Program Files\\cloudflared',
        ]
      : [
          '/usr/local/bin',
          '/usr/bin',
          '/bin',
          '/usr/sbin',
          '/sbin',
          '/opt/homebrew/bin',
          '/opt/homebrew/sbin',
          '/snap/bin',
          path.join(home, '.local', 'bin'),
          path.join(home, 'bin'),
          path.join(home, '.cargo', 'bin'),
        ];

  // Incluir versões do Node via NVM se existirem no Linux/macOS
  if (process.platform !== 'win32') {
    const nvmVersionsDir = path.join(home, '.nvm', 'versions', 'node');
    try {
      if (fs.existsSync(nvmVersionsDir)) {
        const versions = fs.readdirSync(nvmVersionsDir).sort().reverse();
        for (const v of versions) {
          extraCandidates.push(path.join(nvmVersionsDir, v, 'bin'));
        }
      }
    } catch {}
  }

  for (const candidate of extraCandidates) {
    if (!currentPaths.includes(candidate)) {
      try {
        if (fs.existsSync(candidate)) {
          currentPaths.push(candidate);
        }
      } catch {}
    }
  }

  process.env.PATH = currentPaths.join(sep);
}

class ProcessManagerService {
  private instances: Map<number, RunningInstance> = new Map();
  private initialized = false;

  public init() {
    ensureExtendedPath();

    // Iniciar aplicações marcadas com auto_start
    try {
      const autoStartApps = db
        .prepare('SELECT * FROM applications WHERE is_active = 1 AND auto_start = 1')
        .all() as any[];

      for (const app of autoStartApps) {
        if (!this.instances.has(app.id)) {
          console.log(`🔄 Auto-iniciando aplicação: ${app.name} (ID ${app.id})`);
          this.startApp(app.id).catch((err) => {
            console.error(`Falha ao auto-iniciar ${app.name}:`, err);
          });
        }
      }
    } catch (err) {
      console.error('Erro ao inicializar ProcessManager:', err);
    }

    if (!this.initialized) {
      this.initialized = true;
      // Garantir encerramento limpo ao fechar o servidor
      const cleanup = () => {
        this.stopAllSync();
      };
      process.on('SIGINT', () => {
        cleanup();
        process.exit(0);
      });
      process.on('SIGTERM', () => {
        cleanup();
        process.exit(0);
      });
      process.on('exit', cleanup);
    }
  }

  public getInstance(appId: number): RunningInstance | undefined {
    return this.instances.get(appId);
  }

  public getRunningCount(): number {
    let count = 0;
    for (const inst of this.instances.values()) {
      if (
        inst.appStatus === 'running' ||
        inst.appStatus === 'starting' ||
        inst.tunnelStatus === 'online' ||
        inst.tunnelStatus === 'starting'
      ) {
        count += 1;
      }
    }
    return count;
  }

  public getActiveSummary(): Array<{ appId: number; appStatus: string; tunnelStatus: string; publicUrl: string | null }> {
    return Array.from(this.instances.values()).map((inst) => ({
      appId: inst.appId,
      appStatus: inst.appStatus,
      tunnelStatus: inst.tunnelStatus,
      publicUrl: inst.publicUrl,
    }));
  }

  public getLogs(appId: number): LogEntry[] {
    return this.instances.get(appId)?.logs || [];
  }

  public clearLogs(appId: number) {
    const inst = this.instances.get(appId);
    if (inst) {
      inst.logs = [];
    }
  }

  private addLog(
    appId: number,
    source: 'app' | 'tunnel' | 'system',
    stream: 'stdout' | 'stderr',
    rawLine: string
  ) {
    const inst = this.instances.get(appId);
    const cleanLine = stripAnsi(rawLine).trimEnd();
    if (!cleanLine) return;

    const entry: LogEntry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      appId,
      source,
      stream,
      line: cleanLine,
      timestamp: new Date().toISOString(),
    };

    if (inst) {
      inst.logs.push(entry);
      if (inst.logs.length > MAX_LOG_LINES) {
        inst.logs.shift();
      }
    }

    events.emit('app_log', entry);
  }

  private createNotification(
    appId: number | null,
    title: string,
    message: string,
    type: 'tunnel_online' | 'app_started' | 'app_error' | 'app_stopped' | 'info' = 'info',
    publicUrl = ''
  ) {
    try {
      const info = db
        .prepare(
          'INSERT INTO notifications (app_id, title, message, type, public_url) VALUES (?, ?, ?, ?, ?)'
        )
        .run(appId, title, message, type, publicUrl);

      events.emit('notification', {
        id: info.lastInsertRowid,
        app_id: appId,
        title,
        message,
        type,
        public_url: publicUrl,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Erro ao salvar notificação:', err);
    }
  }

  private registerDetectedUrls(
    appRow: any,
    inst: RunningInstance,
    rawLine: string,
    source: 'app' | 'tunnel'
  ) {
    const items = extractAllUrlsFromLine(rawLine, source);
    if (items.length === 0) return;

    let changed = false;
    const nowIso = new Date().toISOString();

    for (const item of items) {
      const existing = inst.detectedUrls.find((u) => u.url === item.url);
      const isGenericLabel = (lbl: string) =>
        lbl.startsWith('Serviço Local') || lbl === 'App Local' || lbl === 'Túnel';

      if (!existing) {
        inst.detectedUrls.push({
          ...item,
          detectedAt: nowIso,
        });
        changed = true;
        this.addLog(
          appRow.id,
          'system',
          'stdout',
          `🔗 URL Capturada [${item.label}]: ${item.url}`
        );
      } else if (
        (isGenericLabel(existing.label) && !isGenericLabel(item.label)) ||
        item.label === 'API Gateway (OpenWA)'
      ) {
        existing.label = item.label;
        changed = true;
      }

      // Manter a porta configurada do túnel (ex: 5173 no Ofertas WhatsApp, 2785 no OpenWA);
      // só atualizar automaticamente caso a aplicação não tivesse porta definida
      if (item.category === 'local' && item.port && item.port > 0 && item.port < 65536) {
        if (!inst.detectedPort) {
          inst.detectedPort = item.port;
          changed = true;
        }
      }
    }

    if (changed) {
      try {
        db.prepare(`UPDATE applications SET detected_urls_json = ? WHERE id = ?`).run(
          JSON.stringify(inst.detectedUrls),
          appRow.id
        );
      } catch {}
      this.emitStatus(appRow, inst);
    }
  }

  private emitStatus(appRow: any, inst?: RunningInstance, customMessage?: string) {
    let overallStatus: 'stopped' | 'starting' | 'running' | 'error' = 'stopped';
    if (inst) {
      if (inst.appStatus === 'error' || inst.tunnelStatus === 'error') {
        overallStatus = inst.appStatus === 'running' || inst.tunnelStatus === 'online' ? 'running' : 'error';
      } else if (inst.appStatus === 'starting' || inst.tunnelStatus === 'starting') {
        overallStatus = inst.appStatus === 'running' || inst.tunnelStatus === 'online' ? 'running' : 'starting';
      } else if (inst.appStatus === 'running' || inst.tunnelStatus === 'online') {
        overallStatus = 'running';
      }
    } else if (appRow.last_status === 'error') {
      overallStatus = 'error';
    }

    db.prepare(
      `UPDATE applications 
       SET last_status = ?, last_error_message = COALESCE(?, last_error_message)
       WHERE id = ?`
    ).run(overallStatus, customMessage ?? null, appRow.id);

    const freshRow = db.prepare('SELECT * FROM applications WHERE id = ?').get(appRow.id) || appRow;
    const enriched = this.enrichApp(freshRow);
    events.emit('app_status', enriched);
  }

  // Enriquecer objeto da aplicação do banco com o estado em tempo real
  public enrichApp(appRow: any) {
    const inst = this.instances.get(appRow.id);
    const lanIp = getLocalLanIp();
    const port = inst?.detectedPort || appRow.local_port;
    const protocol = appRow.local_protocol || 'http';
    const host = appRow.local_host || 'localhost';
    const localUrl = `${protocol}://${host}:${port}`;
    const lanUrl = `${protocol}://${lanIp}:${port}`;

    const isRunning = Boolean(
      inst && (inst.appStatus === 'running' || inst.appStatus === 'starting' || inst.tunnelStatus === 'online' || inst.tunnelStatus === 'starting')
    );

    const lastLog = inst && inst.logs.length > 0 ? inst.logs[inst.logs.length - 1].line : '';

    // Garantir que se a URL pública já apareceu nos logs da sessão atual, ela esteja refletida no estado
    if (inst && !inst.publicUrl && inst.logs.length > 0) {
      for (let i = inst.logs.length - 1; i >= 0; i--) {
        const m = inst.logs[i].line.match(
          /https:\/\/[a-zA-Z0-9.-]+\.(?:trycloudflare\.com|ngrok(?:-free)?\.(?:app|io|dev|pizza)|loca\.lt|lhr\.life|localhost\.run)/i
        );
        if (m) {
          inst.publicUrl = m[0];
          inst.tunnelStatus = 'online';
          break;
        }
      }
    }

    // Garantir que todas as URLs capturadas nos logs da sessão atual ou persistidas estejam refletidas
    let detectedUrls: DetectedUrlItem[] = [];
    if (inst) {
      if (inst.detectedUrls.length === 0 && inst.logs.length > 0) {
        for (const log of inst.logs) {
          if (log.source === 'system') continue;
          const found = extractAllUrlsFromLine(log.line, log.source);
          for (const f of found) {
            if (!inst.detectedUrls.some((u) => u.url === f.url)) {
              inst.detectedUrls.push({ ...f, detectedAt: log.timestamp });
            }
          }
        }
      }
      detectedUrls = inst.detectedUrls;
    } else if (appRow.detected_urls_json) {
      try {
        const parsed = JSON.parse(appRow.detected_urls_json);
        if (Array.isArray(parsed)) {
          detectedUrls = parsed;
        }
      } catch {}
    }

    return {
      ...appRow,
      auto_restart: Boolean(appRow.auto_restart),
      auto_start: Boolean(appRow.auto_start),
      is_active: Boolean(appRow.is_active),
      is_running: isRunning,
      app_status: inst?.appStatus || 'stopped',
      tunnel_status: inst?.tunnelStatus || 'stopped',
      active_tunnel_provider: inst?.tunnelProvider || appRow.tunnel_provider,
      public_url: inst?.publicUrl || (isRunning && appRow.last_public_url ? appRow.last_public_url : null),
      detected_urls: detectedUrls,
      local_url: localUrl,
      lan_url: lanUrl,
      effective_port: port,
      app_pid: inst?.appPid || null,
      tunnel_pid: inst?.tunnelPid || null,
      started_at: inst?.startedAt || appRow.last_started_at,
      last_log_line: lastLog,
      has_custom_token: Boolean(appRow.tunnel_custom_token),
      tunnel_custom_token: undefined, // Não expor token criptografado bruto
    };
  }

  // Iniciar Aplicação e/ou Túnel
  public async startApp(appId: number): Promise<void> {
    const appRow = db.prepare('SELECT * FROM applications WHERE id = ?').get(appId) as any;
    if (!appRow) {
      throw new Error('Aplicação não encontrada.');
    }

    // Se já estiver rodando, parar antes de reiniciar
    if (this.instances.has(appId)) {
      await this.stopApp(appId);
    }

    const mode: 'app_and_tunnel' | 'tunnel_only' | 'app_only' = appRow.execution_mode || 'app_and_tunnel';
    const shouldRunApp = mode === 'app_and_tunnel' || mode === 'app_only';
    const shouldRunTunnel =
      (mode === 'app_and_tunnel' || mode === 'tunnel_only') &&
      appRow.tunnel_provider &&
      appRow.tunnel_provider !== 'none';

    const localUrl = `${appRow.local_protocol || 'http'}://${appRow.local_host || 'localhost'}:${appRow.local_port}`;

    // Registrar no histórico
    const histInsert = db
      .prepare(
        `INSERT INTO run_history (app_id, app_name, execution_mode, tunnel_provider, local_url, status)
         VALUES (?, ?, ?, ?, ?, 'running')`
      )
      .run(appRow.id, appRow.name, mode, shouldRunTunnel ? appRow.tunnel_provider : 'none', localUrl);

    const nowIso = new Date().toISOString();
    db.prepare(
      `UPDATE applications 
       SET last_started_at = ?, last_status = 'starting', last_public_url = '', detected_urls_json = '[]', last_error_message = '', total_runs = total_runs + 1
       WHERE id = ?`
    ).run(nowIso, appRow.id);
    appRow.last_public_url = '';
    appRow.detected_urls_json = '[]';

    const inst: RunningInstance = {
      appId: appRow.id,
      appProcess: null,
      tunnelProcess: null,
      appStatus: shouldRunApp ? 'starting' : 'stopped',
      tunnelStatus: shouldRunTunnel ? 'starting' : 'stopped',
      tunnelProvider: shouldRunTunnel ? appRow.tunnel_provider : 'none',
      publicUrl: null,
      detectedPort: appRow.local_port,
      detectedUrls: [],
      appPid: null,
      tunnelPid: null,
      startedAt: nowIso,
      historyId: Number(histInsert.lastInsertRowid),
      logs: [],
      stopping: false,
      restartCount: 0,
    };

    this.instances.set(appRow.id, inst);
    this.emitStatus(appRow, inst, '');

    this.addLog(
      appRow.id,
      'system',
      'stdout',
      `▶ Iniciando "${appRow.name}" [Modo: ${mode === 'app_and_tunnel' ? 'App Local + Túnel' : mode === 'tunnel_only' ? 'Apenas Túnel' : 'Apenas App Local'}]`
    );

    if (shouldRunApp) {
      if (appRow.local_path) {
        const cleaned = cleanupProjectOrphanProcesses(appRow.local_path);
        if (cleaned > 0) {
          this.addLog(
            appRow.id,
            'system',
            'stdout',
            `🧹 Liberando portas: ${cleaned} processo(s) órfão(s) anterior(es) encerrado(s) no diretório do projeto.`
          );
          await new Promise((r) => setTimeout(r, 850));
        }
      }
      this.spawnLocalApplication(appRow, inst);
    }

    if (shouldRunTunnel) {
      if (shouldRunApp) {
        // Aguardar brevemente a porta local subir ou iniciar túnel após espera
        this.addLog(
          appRow.id,
          'system',
          'stdout',
          `⏳ Aguardando aplicação local responder na porta ${inst.detectedPort || appRow.local_port} antes de abrir o túnel...`
        );
        waitForPort(
          inst.detectedPort || appRow.local_port,
          appRow.local_host || 'localhost',
          6000,
          () => inst.stopping || inst.appStatus === 'error'
        ).then((portReady) => {
          if (inst.stopping || !this.instances.has(appRow.id)) return;
          const targetPort = inst.detectedPort || appRow.local_port;
          if (portReady) {
            this.addLog(appRow.id, 'system', 'stdout', `✅ Porta ${targetPort} ativa! Iniciando túnel (${appRow.tunnel_provider})...`);
          } else {
            this.addLog(appRow.id, 'system', 'stdout', `⚡ Iniciando túnel (${appRow.tunnel_provider}) apontando para a porta ${targetPort}...`);
          }
          this.spawnTunnelProcess(appRow, inst);
        });
      } else {
        this.spawnTunnelProcess(appRow, inst);
      }
    }
  }

  // Iniciar ou trocar apenas o túnel para uma aplicação (mesmo que já esteja rodando como app_only),
  // permitindo inclusive apontar para qualquer porta detectada nos logs
  public async startTunnelForApp(
    appId: number,
    providerOverride?: string,
    targetPortOverride?: number
  ): Promise<void> {
    const appRow = db.prepare('SELECT * FROM applications WHERE id = ?').get(appId) as any;
    if (!appRow) throw new Error('Aplicação não encontrada.');

    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;
    const provider =
      providerOverride ||
      (appRow.tunnel_provider !== 'none' ? appRow.tunnel_provider : settings?.default_tunnel_provider || 'cloudflared');

    let inst = this.instances.get(appId);
    const chosenPort = targetPortOverride || inst?.detectedPort || appRow.local_port;

    if (!inst) {
      // Se não estava rodando nada, iniciar em modo tunnel_only com esse provedor
      const nowIso = new Date().toISOString();
      const localUrl = `${appRow.local_protocol || 'http'}://${appRow.local_host || 'localhost'}:${chosenPort}`;
      const histInsert = db
        .prepare(
          `INSERT INTO run_history (app_id, app_name, execution_mode, tunnel_provider, local_url, status)
           VALUES (?, ?, 'tunnel_only', ?, ?, 'running')`
        )
        .run(appRow.id, appRow.name, provider, localUrl);

      inst = {
        appId: appRow.id,
        appProcess: null,
        tunnelProcess: null,
        appStatus: 'stopped',
        tunnelStatus: 'starting',
        tunnelProvider: provider,
        publicUrl: null,
        detectedPort: chosenPort,
        detectedUrls: [],
        appPid: null,
        tunnelPid: null,
        startedAt: nowIso,
        historyId: Number(histInsert.lastInsertRowid),
        logs: [],
        stopping: false,
        restartCount: 0,
      };
      this.instances.set(appRow.id, inst);
    } else {
      // Se já tinha um túnel rodando, encerrar o anterior
      if (inst.tunnelProcess) {
        killProcessTree(inst.tunnelProcess);
        inst.tunnelProcess = null;
      }
      if (targetPortOverride) {
        inst.detectedPort = targetPortOverride;
      }
      inst.tunnelStatus = 'starting';
      inst.tunnelProvider = provider;
      inst.publicUrl = null;
    }

    this.addLog(
      appRow.id,
      'system',
      'stdout',
      `🌐 Iniciando túnel público via ${provider.toUpperCase()} para a porta ${inst.detectedPort || appRow.local_port}...`
    );
    this.emitStatus(appRow, inst);
    this.spawnTunnelProcess({ ...appRow, tunnel_provider: provider }, inst);
  }

  // Parar apenas o túnel mantendo a aplicação local rodando
  public async stopTunnelForApp(appId: number): Promise<void> {
    const appRow = db.prepare('SELECT * FROM applications WHERE id = ?').get(appId) as any;
    const inst = this.instances.get(appId);
    if (!inst || !inst.tunnelProcess) return;

    this.addLog(appId, 'system', 'stdout', '⏹ Encerrando túnel público...');
    killProcessTree(inst.tunnelProcess);
    inst.tunnelProcess = null;
    inst.tunnelPid = null;
    inst.tunnelStatus = 'stopped';
    inst.publicUrl = null;

    if (inst.appStatus === 'stopped') {
      this.instances.delete(appId);
    }

    if (appRow) {
      this.emitStatus(appRow, this.instances.get(appId));
    }
  }

  private spawnLocalApplication(appRow: any, inst: RunningInstance) {
    const command = (appRow.start_command || '').trim();
    if (!command) {
      inst.appStatus = 'error';
      const msg = 'Comando de inicialização não informado para a aplicação local.';
      this.addLog(appRow.id, 'system', 'stderr', `❌ ${msg}`);
      this.emitStatus(appRow, inst, msg);
      return;
    }

    const cwd = (appRow.local_path || '').trim() || process.cwd();
    if (appRow.local_path && !fs.existsSync(cwd)) {
      inst.appStatus = 'error';
      const msg = `Diretório local não encontrado: ${cwd}`;
      this.addLog(appRow.id, 'system', 'stderr', `❌ ${msg}`);
      this.emitStatus(appRow, inst, msg);
      return;
    }

    // Processar variáveis de ambiente customizadas
    const customEnv: Record<string, string> = {};
    if (appRow.env_vars) {
      const lines = String(appRow.env_vars).split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const k = trimmed.slice(0, eqIdx).trim();
          const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
          customEnv[k] = v;
        }
      }
    }

    // Remover variáveis exclusivas do próprio Olivelas Local Tunnel (como PORT=3002 do .env do gerenciador)
    // para que a aplicação filha leia seu próprio .env (ex: PORT=3001 ou PORT=2785) sem conflito de EADDRINUSE
    const childEnv: NodeJS.ProcessEnv = { ...process.env };
    delete childEnv.PORT;
    delete childEnv.APP_SECRET_KEY;
    delete childEnv.ELECTRON_DEV_URL;

    this.addLog(appRow.id, 'system', 'stdout', `📂 Diretório: ${cwd}`);
    this.addLog(appRow.id, 'system', 'stdout', `💻 Executando comando: ${command}`);

    try {
      const child = spawn(command, {
        cwd,
        shell: true,
        detached: process.platform !== 'win32',
        env: {
          ...childEnv,
          ...customEnv,
          FORCE_COLOR: '1',
        },
      });

      inst.appProcess = child;
      inst.appPid = child.pid || null;
      inst.appStatus = 'running';
      this.emitStatus(appRow, inst);

      const handleOutput = (data: Buffer, stream: 'stdout' | 'stderr') => {
        const lines = data.toString('utf8').split(/\r?\n/);
        for (const line of lines) {
          if (!line.trim()) continue;
          this.addLog(appRow.id, 'app', stream, line);

          const clean = stripAnsi(line);

          // Capturar todas as URLs anunciadas pela aplicação (Frontend, Backend, Swagger, Health, LAN, etc.)
          this.registerDetectedUrls(appRow, inst, clean, 'app');

          // Caso o próprio comando da aplicação local inicie um túnel (cloudflared/ngrok), extrair a URL pública do log
          this.tryExtractPublicUrl(
            clean,
            appRow,
            inst,
            inst.tunnelProvider !== 'none' ? inst.tunnelProvider : 'cloudflared'
          );
        }
      };

      child.stdout?.on('data', (data: Buffer) => handleOutput(data, 'stdout'));
      child.stderr?.on('data', (data: Buffer) => handleOutput(data, 'stderr'));

      child.on('error', (err) => {
        inst.appStatus = 'error';
        const msg = `Erro ao executar aplicação: ${err.message}`;
        this.addLog(appRow.id, 'system', 'stderr', `❌ ${msg}`);
        this.emitStatus(appRow, inst, msg);
        this.createNotification(appRow.id, `Falha em ${appRow.name}`, msg, 'app_error');
      });

      child.on('close', (code, signal) => {
        inst.appProcess = null;
        inst.appPid = null;

        if (inst.stopping) {
          inst.appStatus = 'stopped';
          this.addLog(appRow.id, 'system', 'stdout', `⏹ Aplicação encerrada.`);
          return;
        }

        if (code !== 0 && code !== null) {
          inst.appStatus = 'error';
          const msg = `Processo encerrado com código ${code}${signal ? ` (sinal ${signal})` : ''}.`;
          this.addLog(appRow.id, 'system', 'stderr', `⚠️ ${msg}`);

          // Auto-restart se configurado e menos de 5 tentativas seguidas
          if (appRow.auto_restart && inst.restartCount < 5 && !inst.stopping) {
            inst.restartCount += 1;
            this.addLog(
              appRow.id,
              'system',
              'stdout',
              `🔄 Reiniciando automaticamente em 3s (Tentativa ${inst.restartCount}/5)...`
            );
            setTimeout(() => {
              if (!inst.stopping && this.instances.has(appRow.id)) {
                this.spawnLocalApplication(appRow, inst);
              }
            }, 3000);
            return;
          }

          this.emitStatus(appRow, inst, msg);
          this.updateHistoryOnClose(inst, 'failed', msg);
          this.createNotification(appRow.id, `Aplicação Parou: ${appRow.name}`, msg, 'app_error');
        } else {
          inst.appStatus = 'stopped';
          this.addLog(appRow.id, 'system', 'stdout', `✅ Processo finalizado normalmente.`);
          if (inst.tunnelStatus === 'stopped') {
            this.instances.delete(appRow.id);
            this.updateHistoryOnClose(inst, 'completed');
          }
          this.emitStatus(appRow, this.instances.get(appRow.id));
        }
      });
    } catch (err: any) {
      inst.appStatus = 'error';
      const msg = err.message || 'Erro desconhecido ao iniciar processo.';
      this.addLog(appRow.id, 'system', 'stderr', `❌ ${msg}`);
      this.emitStatus(appRow, inst, msg);
    }
  }

  private spawnTunnelProcess(appRow: any, inst: RunningInstance) {
    const provider = appRow.tunnel_provider || 'cloudflared';
    const targetPort = inst.detectedPort || appRow.local_port || 3000;
    const targetHost = appRow.local_host || 'localhost';
    const targetProtocol = appRow.local_protocol || 'http';
    const targetUrl = `${targetProtocol}://${targetHost}:${targetPort}`;

    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;

    let cmd = '';
    let args: string[] = [];
    let useShell = false;

    if (provider === 'cloudflared') {
      cmd = 'cloudflared';
      const authMode = appRow.tunnel_auth_mode || 'quick';
      const customToken = appRow.tunnel_custom_token ? decryptData(appRow.tunnel_custom_token) : '';
      const globalToken = settings?.cloudflared_token ? decryptData(settings.cloudflared_token) : '';
      const tokenToUse = customToken || (authMode === 'token' ? globalToken : '');

      const protocolFlag = settings?.cloudflared_protocol && settings.cloudflared_protocol !== 'auto'
        ? ['--protocol', settings.cloudflared_protocol]
        : [];

      if (authMode === 'token' && tokenToUse) {
        args = ['tunnel', '--no-autoupdate', ...protocolFlag, 'run', '--token', tokenToUse];
        this.addLog(appRow.id, 'tunnel', 'stdout', `🔐 Iniciando Cloudflare Tunnel Autenticado (Zero Trust Token)...`);
      } else {
        args = ['tunnel', '--url', targetUrl, '--no-autoupdate', ...protocolFlag];
        this.addLog(appRow.id, 'tunnel', 'stdout', `☁️ Iniciando Cloudflared Quick Tunnel para ${targetUrl}...`);
      }
    } else if (provider === 'ngrok') {
      cmd = 'ngrok';
      const customToken = appRow.tunnel_custom_token ? decryptData(appRow.tunnel_custom_token) : '';
      const globalToken = settings?.ngrok_authtoken ? decryptData(settings.ngrok_authtoken) : '';
      const tokenToUse = customToken || globalToken;
      const domainToUse = (appRow.tunnel_custom_domain || settings?.ngrok_domain || '').trim();

      args = ['http', `${targetHost}:${targetPort}`, '--log=stdout', '--log-format=json'];
      if (tokenToUse) {
        args.push('--authtoken', tokenToUse);
      }
      if (domainToUse) {
        args.push(`--domain=${domainToUse}`);
      }
      this.addLog(appRow.id, 'tunnel', 'stdout', `🚀 Iniciando Ngrok Tunnel para ${targetHost}:${targetPort}...`);
    } else if (provider === 'localtunnel') {
      cmd = 'npx';
      args = ['--yes', 'localtunnel', '--port', String(targetPort)];
      if (appRow.tunnel_custom_domain?.trim()) {
        args.push('--subdomain', appRow.tunnel_custom_domain.trim());
      }
      this.addLog(appRow.id, 'tunnel', 'stdout', `🌍 Iniciando LocalTunnel para porta ${targetPort}...`);
    } else if (provider === 'custom') {
      const rawCustom = (appRow.tunnel_custom_command || '').trim();
      if (!rawCustom) {
        inst.tunnelStatus = 'error';
        const msg = 'Comando de túnel customizado não informado.';
        this.addLog(appRow.id, 'tunnel', 'stderr', `❌ ${msg}`);
        this.emitStatus(appRow, inst, msg);
        return;
      }
      cmd = rawCustom
        .replace(/\{port\}/gi, String(targetPort))
        .replace(/\{host\}/gi, targetHost)
        .replace(/\{url\}/gi, targetUrl);
      useShell = true;
      this.addLog(appRow.id, 'tunnel', 'stdout', `⚡ Executando túnel customizado: ${cmd}`);
    } else {
      return;
    }

    try {
      const child = spawn(cmd, args, {
        shell: useShell,
        detached: process.platform !== 'win32',
        env: { ...process.env },
      });

      inst.tunnelProcess = child;
      inst.tunnelPid = child.pid || null;
      inst.tunnelStatus = 'starting';
      this.emitStatus(appRow, inst);

      const handleTunnelLine = (rawLine: string, stream: 'stdout' | 'stderr') => {
        const clean = stripAnsi(rawLine).trim();
        if (!clean) return;

        // Se for Ngrok em formato JSON, formatar mensagem amigável e extrair URL
        if (provider === 'ngrok' && clean.startsWith('{')) {
          try {
            const parsed = JSON.parse(clean);
            if (parsed.url && typeof parsed.url === 'string' && parsed.url.startsWith('http')) {
              this.handlePublicUrlDetected(appRow, inst, parsed.url, provider);
            }
            if (parsed.err && parsed.err !== '<nil>') {
              this.addLog(appRow.id, 'tunnel', 'stderr', `[ngrok] Erro: ${parsed.err}`);
              if (String(parsed.err).includes('ERR_NGROK')) {
                inst.tunnelStatus = 'error';
                this.emitStatus(appRow, inst, `Erro Ngrok: ${parsed.err}`);
              }
              return;
            }
            if (parsed.msg) {
              this.addLog(
                appRow.id,
                'tunnel',
                stream,
                `[ngrok] ${parsed.msg}${parsed.url ? ` -> ${parsed.url}` : ''}`
              );
              return;
            }
          } catch {}
        }

        this.addLog(appRow.id, 'tunnel', stream, clean);

        // Registrar URLs adicionais do túnel (ex: Ngrok Inspector http://localhost:4040 ou URL pública)
        this.registerDetectedUrls(appRow, inst, clean, 'tunnel');

        // Detectar URL pública nos logs
        this.tryExtractPublicUrl(clean, appRow, inst, provider);
      };

      child.stdout?.on('data', (data: Buffer) => {
        for (const line of data.toString('utf8').split(/\r?\n/)) {
          handleTunnelLine(line, 'stdout');
        }
      });

      child.stderr?.on('data', (data: Buffer) => {
        for (const line of data.toString('utf8').split(/\r?\n/)) {
          handleTunnelLine(line, 'stderr');
        }
      });

      // Fallback para Ngrok: consultar API local 127.0.0.1:4040/api/tunnels
      if (provider === 'ngrok') {
        this.pollNgrokLocalApi(appRow, inst, targetPort);
      }

      child.on('error', (err) => {
        inst.tunnelStatus = 'error';
        const msg = `Falha ao executar ${provider}: ${err.message}. Verifique se o binário está instalado.`;
        this.addLog(appRow.id, 'tunnel', 'stderr', `❌ ${msg}`);
        this.emitStatus(appRow, inst, msg);
        this.createNotification(appRow.id, `Erro no Túnel (${provider})`, msg, 'app_error');
      });

      child.on('close', (code) => {
        inst.tunnelProcess = null;
        inst.tunnelPid = null;

        if (inst.stopping) {
          inst.tunnelStatus = 'stopped';
          inst.publicUrl = null;
          return;
        }

        if (code !== 0 && code !== null) {
          inst.tunnelStatus = 'error';
          const msg = `Túnel (${provider}) encerrou com código ${code}.`;
          this.addLog(appRow.id, 'tunnel', 'stderr', `⚠️ ${msg}`);
          this.emitStatus(appRow, inst, msg);
        } else {
          inst.tunnelStatus = 'stopped';
          inst.publicUrl = null;
          if (inst.appStatus === 'stopped') {
            this.instances.delete(appRow.id);
          }
          this.emitStatus(appRow, this.instances.get(appRow.id));
        }
      });
    } catch (err: any) {
      inst.tunnelStatus = 'error';
      const msg = `Erro ao iniciar túnel ${provider}: ${err.message}`;
      this.addLog(appRow.id, 'tunnel', 'stderr', `❌ ${msg}`);
      this.emitStatus(appRow, inst, msg);
    }
  }

  private tryExtractPublicUrl(line: string, appRow: any, inst: RunningInstance, provider: string) {
    if (inst.publicUrl) return;

    // 1. Cloudflared Quick Tunnel (*.trycloudflare.com)
    const cfMatch = line.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/i);
    if (cfMatch) {
      this.handlePublicUrlDetected(appRow, inst, cfMatch[0], provider);
      return;
    }

    // 2. Cloudflared com Token e Domínio Customizado
    if (
      provider === 'cloudflared' &&
      appRow.tunnel_custom_domain &&
      (line.includes('Registered tunnel connection') || line.includes('Updated to new configuration'))
    ) {
      const domain = appRow.tunnel_custom_domain.trim().replace(/^https?:\/\//, '');
      this.handlePublicUrlDetected(appRow, inst, `https://${domain}`, provider);
      return;
    }

    // 3. Ngrok (*.ngrok-free.app, *.ngrok.app, *.ngrok.io, *.ngrok-free.dev)
    const ngrokMatch = line.match(/https:\/\/[a-zA-Z0-9.-]+\.ngrok(?:-free)?\.(?:app|io|dev|pizza)/i);
    if (ngrokMatch) {
      this.handlePublicUrlDetected(appRow, inst, ngrokMatch[0], provider);
      return;
    }

    // 4. LocalTunnel (*.loca.lt)
    const ltMatch = line.match(/https:\/\/[a-zA-Z0-9-]+\.loca\.lt/i);
    if (ltMatch) {
      this.handlePublicUrlDetected(appRow, inst, ltMatch[0], provider);
      return;
    }

    // 5. localhost.run / serveo / pinggy / custom
    const genericMatch = line.match(/https:\/\/[a-zA-Z0-9.-]+\.(?:lhr\.life|localhost\.run|serveo\.net|pinggy\.link|a\.free\.pinggy\.link)/i);
    if (genericMatch) {
      this.handlePublicUrlDetected(appRow, inst, genericMatch[0], provider);
      return;
    }

    // 6. Se for provedor custom, capturar qualquer URL https que não seja documentação
    if (provider === 'custom') {
      const anyHttps = line.match(/https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s"']*)?/i);
      if (anyHttps) {
        const candidate = anyHttps[0];
        const ignored = ['cloudflare.com', 'ngrok.com', 'github.com', 'localhost', '127.0.0.1'];
        if (!ignored.some((ig) => candidate.toLowerCase().includes(ig))) {
          this.handlePublicUrlDetected(appRow, inst, candidate, provider);
        }
      }
    }
  }

  private handlePublicUrlDetected(appRow: any, inst: RunningInstance, url: string, provider: string) {
    if (inst.publicUrl === url) return;
    inst.publicUrl = url;
    inst.tunnelStatus = 'online';

    if (!inst.detectedUrls.some((u) => u.url === url)) {
      inst.detectedUrls.push({
        url,
        label: `Túnel Público (${provider.toUpperCase()})`,
        category: 'public',
        port: inst.detectedPort || appRow.local_port,
        source: 'tunnel',
        detectedAt: new Date().toISOString(),
      });
    }

    db.prepare(
      'UPDATE applications SET last_public_url = ?, detected_urls_json = ?, last_status = ? WHERE id = ?'
    ).run(url, JSON.stringify(inst.detectedUrls), 'running', appRow.id);

    if (inst.historyId) {
      db.prepare('UPDATE run_history SET public_url = ? WHERE id = ?').run(url, inst.historyId);
    }

    this.addLog(appRow.id, 'system', 'stdout', `🎉 URL Pública Gerada (${provider.toUpperCase()}): ${url}`);
    this.emitStatus(appRow, inst);

    events.emit('tunnel_url', {
      appId: appRow.id,
      appName: appRow.name,
      publicUrl: url,
      provider,
      localUrl: `${appRow.local_protocol || 'http'}://${appRow.local_host || 'localhost'}:${inst.detectedPort || appRow.local_port}`,
    });

    this.createNotification(
      appRow.id,
      `Túnel Online: ${appRow.name}`,
      `URL pública ativa via ${provider}: ${url}`,
      'tunnel_online',
      url
    );
  }

  private pollNgrokLocalApi(appRow: any, inst: RunningInstance, targetPort: number) {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (inst.stopping || inst.publicUrl || attempts > 10 || !this.instances.has(appRow.id)) {
        clearInterval(timer);
        return;
      }

      const req = http.get('http://127.0.0.1:4040/api/tunnels', { timeout: 1000 }, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (Array.isArray(data.tunnels)) {
              const found =
                data.tunnels.find((t: any) => String(t.config?.addr || '').includes(String(targetPort))) ||
                data.tunnels[0];
              if (found && found.public_url) {
                this.handlePublicUrlDetected(appRow, inst, found.public_url, 'ngrok');
                clearInterval(timer);
              }
            }
          } catch {}
        });
      });
      req.on('error', () => {});
    }, 1500);
  }

  private updateHistoryOnClose(inst: RunningInstance, status: 'completed' | 'stopped' | 'failed', errorMsg?: string) {
    if (!inst.historyId) return;
    try {
      const startMs = new Date(inst.startedAt).getTime();
      const durationSec = Math.max(0, Math.round((Date.now() - startMs) / 1000));
      db.prepare(
        `UPDATE run_history 
         SET status = ?, error_message = COALESCE(?, error_message), ended_at = CURRENT_TIMESTAMP, duration_seconds = ?
         WHERE id = ?`
      ).run(status, errorMsg || null, durationSec, inst.historyId);
    } catch (err) {
      console.error('Erro ao atualizar histórico:', err);
    }
  }

  // Parar Aplicação e Túnel
  public async stopApp(appId: number): Promise<void> {
    const appRow = db.prepare('SELECT * FROM applications WHERE id = ?').get(appId) as any;
    const inst = this.instances.get(appId);

    if (!inst) {
      if (appRow) {
        if (appRow.local_path) {
          cleanupProjectOrphanProcesses(appRow.local_path);
        }
        db.prepare(`UPDATE applications SET last_status = 'stopped', last_stopped_at = CURRENT_TIMESTAMP WHERE id = ?`).run(appId);
        this.emitStatus(appRow, undefined, '');
      }
      return;
    }

    inst.stopping = true;
    this.addLog(appId, 'system', 'stdout', `⏹ Parando processos de "${appRow?.name || appId}"...`);

    if (inst.tunnelProcess) {
      killProcessTree(inst.tunnelProcess);
      inst.tunnelProcess = null;
    }
    if (inst.appProcess) {
      killProcessTree(inst.appProcess);
      inst.appProcess = null;
    }
    if (appRow?.local_path) {
      cleanupProjectOrphanProcesses(appRow.local_path);
    }

    this.updateHistoryOnClose(inst, 'stopped');
    this.instances.delete(appId);

    const nowIso = new Date().toISOString();
    if (appRow) {
      db.prepare(
        `UPDATE applications SET last_status = 'stopped', last_stopped_at = ? WHERE id = ?`
      ).run(nowIso, appId);
      this.emitStatus(appRow, undefined, '');
    }
  }

  public async startAll(): Promise<number> {
    const apps = db.prepare('SELECT * FROM applications WHERE is_active = 1').all() as any[];
    let count = 0;
    for (const app of apps) {
      if (!this.instances.has(app.id)) {
        await this.startApp(app.id);
        count += 1;
      }
    }
    return count;
  }

  public async stopAll(): Promise<number> {
    const ids = Array.from(this.instances.keys());
    for (const id of ids) {
      await this.stopApp(id);
    }
    return ids.length;
  }

  public stopAllSync() {
    for (const [, inst] of this.instances.entries()) {
      inst.stopping = true;
      if (inst.tunnelProcess) killProcessTree(inst.tunnelProcess);
      if (inst.appProcess) killProcessTree(inst.appProcess);
      this.updateHistoryOnClose(inst, 'stopped');
    }
    this.instances.clear();
  }

  // Verificar binários instalados no sistema (cloudflared, ngrok, npx, ssh)
  public getSystemProvidersStatus() {
    const checkBin = (cmd: string, versionArg = '--version'): { installed: boolean; version: string; path: string } => {
      try {
        const whichCmd = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
        const binPath = execSync(whichCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] })
          .split(/\r?\n/)[0]
          .trim();
        let version = '';
        try {
          const vOut = execSync(`${cmd} ${versionArg}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] })
            .split(/\r?\n/)[0]
            .trim();
          version = vOut;
        } catch {}
        return { installed: Boolean(binPath), version, path: binPath };
      } catch {
        return { installed: false, version: '', path: '' };
      }
    };

    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;

    return {
      lanIp: getLocalLanIp(),
      hostname: os.hostname(),
      platform: os.platform(),
      defaultProvider: settings?.default_tunnel_provider || 'cloudflared',
      hasNgrokToken: Boolean(settings?.ngrok_authtoken),
      ngrokDomain: settings?.ngrok_domain || '',
      hasCloudflaredToken: Boolean(settings?.cloudflared_token),
      cloudflaredProtocol: settings?.cloudflared_protocol || 'auto',
      providers: {
        cloudflared: checkBin('cloudflared', '--version'),
        ngrok: checkBin('ngrok', '--version'),
        npx: checkBin('npx', '--version'),
        ssh: checkBin('ssh', '-V'),
      },
    };
  }

  // Escanear portas TCP abertas no computador local (Linux, macOS e Windows)
  public getActiveLocalPorts(): ActivePortInfo[] {
    const results: ActivePortInfo[] = [];
    const seenPorts = new Set<number>();

    try {
      if (process.platform === 'win32') {
        const out = execSync('netstat -ano -p tcp', {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore'],
        });
        const lines = out.split(/\r?\n/);
        for (const line of lines) {
          if (!line.includes('LISTENING')) continue;
          const parts = line.trim().split(/\s+/);
          if (parts.length < 5) continue;
          const localAddr = parts[1];
          const pidStr = parts[parts.length - 1];
          const portMatch = localAddr.match(/:(\d+)$/);
          if (!portMatch) continue;
          const port = parseInt(portMatch[1], 10);
          if (!port || port === 135 || port === 445 || seenPorts.has(port)) continue;
          seenPorts.add(port);
          const pid = parseInt(pidStr, 10) || undefined;
          results.push({
            port,
            address: `http://localhost:${port}`,
            processName: pid ? `PID ${pid}` : 'Processo Windows',
            pid,
          });
        }
      } else if (process.platform === 'darwin') {
        const out = execSync('lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null', {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore'],
        });
        const lines = out.split(/\r?\n/);
        for (const line of lines) {
          if (!line.includes('LISTEN')) continue;
          const parts = line.trim().split(/\s+/);
          if (parts.length < 9) continue;
          const procName = parts[0];
          const pid = parseInt(parts[1], 10) || undefined;
          const portMatch = line.match(/:(\d+)\s+\(LISTEN\)/);
          if (!portMatch) continue;
          const port = parseInt(portMatch[1], 10);
          if (!port || seenPorts.has(port)) continue;
          seenPorts.add(port);
          results.push({
            port,
            address: `http://localhost:${port}`,
            processName: procName || 'Processo macOS',
            pid,
          });
        }
      } else {
        const out = execSync('ss -tulpn 2>/dev/null || netstat -tulpn 2>/dev/null', {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore'],
        });
        const lines = out.split(/\r?\n/);
        for (const line of lines) {
          if (!line.includes('LISTEN')) continue;
          const portMatch = line.match(/(?:127\.0\.0\.1|0\.0\.0\.0|\*|\[::1?\]):(\d+)\s/);
          if (!portMatch) continue;
          const port = parseInt(portMatch[1], 10);
          // Ignorar portas de sistema de baixo nível (ex: DNS 53, CUPS 631, etc.)
          if (!port || port === 53 || port === 631 || port === 323 || seenPorts.has(port)) continue;
          seenPorts.add(port);

          let processName = 'Processo Local';
          let pid: number | undefined;
          const procMatch = line.match(/users:\(\("([^"]+)",pid=(\d+)/);
          if (procMatch) {
            processName = procMatch[1];
            pid = parseInt(procMatch[2], 10);
          }

          results.push({
            port,
            address: `http://localhost:${port}`,
            processName,
            pid,
          });
        }
      }
    } catch {}

    return results.sort((a, b) => a.port - b.port);
  }
}

export const ProcessManager = new ProcessManagerService();
