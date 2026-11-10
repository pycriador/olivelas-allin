import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { ProcessManager } from '../services/processManager.js';
import { db } from '../db/index.js';

const router = Router();

// Navegar no sistema de arquivos local
router.get('/browse', (req: Request, res: Response) => {
  try {
    let targetPath = (req.query.path as string) || '';

    const homeDir = os.homedir();
    const commonShortcuts = [
      { name: 'Pasta Pessoal (Home)', path: homeDir },
      { name: 'Projetos (Downloads/projetos)', path: path.join(homeDir, 'Downloads', 'projetos') },
      { name: 'Downloads', path: path.join(homeDir, 'Downloads') },
      { name: 'Documentos', path: path.join(homeDir, 'Documents') },
      { name: 'Área de Trabalho', path: path.join(homeDir, 'Desktop') },
    ].filter((s) => {
      try {
        return fs.existsSync(s.path);
      } catch {
        return false;
      }
    });

    if (!targetPath) {
      if (process.platform === 'win32') {
        const drives: Array<{ name: string; path: string; isDirectory: true }> = [];
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (const char of letters) {
          const drivePath = `${char}:\\`;
          try {
            if (fs.existsSync(drivePath)) {
              drives.push({ name: `${char}:`, path: drivePath, isDirectory: true });
            }
          } catch {}
        }

        return res.json({
          currentPath: '',
          parentPath: null,
          drives,
          shortcuts: commonShortcuts,
          items: [],
        });
      } else {
        // No Linux/macOS, se vazio, mostrar os atalhos rápidos + raiz / home
        return res.json({
          currentPath: '',
          parentPath: null,
          drives: [
            { name: 'Home', path: homeDir, isDirectory: true },
            { name: 'Raiz (/)', path: '/', isDirectory: true },
          ],
          shortcuts: commonShortcuts,
          items: [],
        });
      }
    }

    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: 'Caminho não encontrado.' });
    }

    const stat = fs.statSync(targetPath);
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: 'O caminho selecionado não é um diretório.' });
    }

    const entries = fs.readdirSync(targetPath, { withFileTypes: true });
    const directories: Array<{ name: string; path: string; isDirectory: boolean }> = [];

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name.startsWith('$') || entry.name === 'node_modules') continue;

      if (entry.isDirectory()) {
        try {
          const fullPath = path.join(targetPath, entry.name);
          directories.push({
            name: entry.name,
            path: fullPath,
            isDirectory: true,
          });
        } catch {}
      }
    }

    directories.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    const parentPath = path.dirname(targetPath);

    res.json({
      currentPath: targetPath,
      parentPath: parentPath !== targetPath ? parentPath : '',
      shortcuts: commonShortcuts,
      items: directories,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Inspecionar diretório local para sugerir comandos (package.json, python, html, etc.) e porta
router.get('/inspect-project', (req: Request, res: Response) => {
  try {
    const dirPath = (req.query.path as string) || '';
    if (!dirPath || !fs.existsSync(dirPath)) {
      return res.status(404).json({ error: 'Diretório não encontrado.' });
    }

    const suggestions: Array<{ label: string; command: string; suggestedPort?: number }> = [];
    let projectName = path.basename(dirPath);
    let detectedPort: number | undefined;

    // 1. Verificar .env para PORT
    const envPath = path.join(dirPath, '.env');
    if (fs.existsSync(envPath)) {
      try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const portMatch = envContent.match(/^PORT\s*=\s*(\d+)/m);
        if (portMatch) {
          detectedPort = parseInt(portMatch[1], 10);
        }
      } catch {}
    }

    // 2. Verificar vite.config.ts / vite.config.js (raiz e subpastas comuns como client/, dashboard/, frontend/)
    const viteDirs = ['', 'client', 'dashboard', 'frontend', 'web'];
    for (const sub of viteDirs) {
      for (const vf of ['vite.config.ts', 'vite.config.js', 'vite.config.mjs']) {
        const vp = sub ? path.join(dirPath, sub, vf) : path.join(dirPath, vf);
        if (fs.existsSync(vp)) {
          try {
            const vc = fs.readFileSync(vp, 'utf8');
            const pm = vc.match(/port\s*:\s*(\d+)/);
            if (pm) {
              detectedPort = parseInt(pm[1], 10);
            }
          } catch {}
        }
      }
    }

    // 2.5. Verificar scripts de inicialização na pasta (start.sh, run.sh, start.bat)
    const shellScripts =
      process.platform === 'win32'
        ? ['start.bat', 'run.bat', 'start.ps1', 'start.sh']
        : ['start.sh', 'run.sh', 'dev.sh', 'start.bat'];

    for (const shFile of shellScripts) {
      const shPath = path.join(dirPath, shFile);
      if (fs.existsSync(shPath)) {
        let shPort = detectedPort;
        try {
          const shContent = fs.readFileSync(shPath, 'utf8');
          const urlMatches = shContent.match(/https?:\/\/(?:localhost|127\.0\.0\.1):(\d{2,5})/i);
          if (urlMatches && urlMatches[1]) {
            shPort = parseInt(urlMatches[1], 10);
            if (!detectedPort) detectedPort = shPort;
          }
        } catch {}

        const cmd = shFile.endsWith('.sh')
          ? `./${shFile}`
          : shFile.endsWith('.ps1')
          ? `powershell -ExecutionPolicy Bypass -File .\\${shFile}`
          : shFile;

        suggestions.push({
          label: `Script Inicializador (${cmd})`,
          command: cmd,
          suggestedPort: shPort,
        });
      }
    }

    // 3. Verificar package.json
    const pkgPath = path.join(dirPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.name) projectName = pkg.name;
        const scripts = pkg.scripts || {};
        for (const [scriptName, scriptCmd] of Object.entries(scripts)) {
          const cmdStr = String(scriptCmd);
          let scriptPort = detectedPort;
          const pMatch = cmdStr.match(/(?:--port|-p|PORT=)\s*(\d{2,5})/);
          if (pMatch) {
            scriptPort = parseInt(pMatch[1], 10);
          } else if (cmdStr.includes('vite') && !scriptPort) {
            scriptPort = 5173;
          } else if (cmdStr.includes('next') && !scriptPort) {
            scriptPort = 3000;
          }

          suggestions.push({
            label: `npm run ${scriptName} (${cmdStr.slice(0, 45)}${cmdStr.length > 45 ? '...' : ''})`,
            command: scriptName === 'start' ? 'npm start' : `npm run ${scriptName}`,
            suggestedPort: scriptPort,
          });
        }
      } catch {}
    }

    // 4. Verificar Python / HTML estático
    if (fs.existsSync(path.join(dirPath, 'manage.py'))) {
      suggestions.push({
        label: 'Django Server (python3 manage.py runserver)',
        command: 'python3 manage.py runserver 8000',
        suggestedPort: 8000,
      });
    }
    if (fs.existsSync(path.join(dirPath, 'main.py')) || fs.existsSync(path.join(dirPath, 'app.py'))) {
      const pyFile = fs.existsSync(path.join(dirPath, 'main.py')) ? 'main.py' : 'app.py';
      suggestions.push({
        label: `Executar Python (${pyFile})`,
        command: `python3 ${pyFile}`,
        suggestedPort: detectedPort || 8000,
      });
    }
    if (fs.existsSync(path.join(dirPath, 'index.html'))) {
      suggestions.push({
        label: 'Servidor HTTP Estático (Python http.server)',
        command: `python3 -m http.server ${detectedPort || 8080}`,
        suggestedPort: detectedPort || 8080,
      });
    }

    res.json({
      projectName,
      detectedPort: detectedPort || suggestions[0]?.suggestedPort || 3000,
      suggestions,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Listar portas ativas escutando no computador local
router.get('/active-ports', (_req: Request, res: Response) => {
  try {
    const ports = ProcessManager.getActiveLocalPorts();
    const registeredApps = db.prepare('SELECT id, name, local_port FROM applications').all() as any[];

    const enrichedPorts = ports.map((p) => {
      const existingApp = registeredApps.find((a) => a.local_port === p.port);
      return {
        ...p,
        registeredAppId: existingApp?.id || null,
        registeredAppName: existingApp?.name || null,
      };
    });

    res.json({ ports: enrichedPorts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
