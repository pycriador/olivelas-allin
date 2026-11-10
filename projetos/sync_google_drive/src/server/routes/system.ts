import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { GDriveService } from '../services/gdrive.js';

const router = Router();

// Navegar no sistema de arquivos local
router.get('/browse', (req: Request, res: Response) => {
  try {
    let targetPath = (req.query.path as string) || '';

    // Se path for vazio no Windows, listar unidades de disco (C:\, D:\, etc.)
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
          } catch (e) {
            // Ignorar unidades inacessíveis
          }
        }

        // Adicionar também atalhos comuns: Documentos, Downloads, Desktop, Imagens
        const homeDir = os.homedir();
        const shortcuts = [
          { name: 'Downloads', path: path.join(homeDir, 'Downloads') },
          { name: 'Documentos', path: path.join(homeDir, 'Documents') },
          { name: 'Imagens (Fotos)', path: path.join(homeDir, 'Pictures') },
          { name: 'Área de Trabalho', path: path.join(homeDir, 'Desktop') },
        ].filter(s => fs.existsSync(s.path));

        return res.json({
          currentPath: '',
          parentPath: null,
          drives,
          shortcuts,
          items: [],
        });
      } else {
        targetPath = os.homedir();
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
      // Ignorar diretórios ocultos e de sistema
      if (entry.name.startsWith('.') || entry.name.startsWith('$')) continue;

      if (entry.isDirectory()) {
        try {
          const fullPath = path.join(targetPath, entry.name);
          directories.push({
            name: entry.name,
            path: fullPath,
            isDirectory: true,
          });
        } catch (e) {
          // Permissão negada em pastas de sistema
        }
      }
    }

    // Ordenar alfabeticamente
    directories.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    const parentPath = path.dirname(targetPath);

    res.json({
      currentPath: targetPath,
      parentPath: parentPath !== targetPath ? parentPath : (process.platform === 'win32' ? '' : null),
      items: directories,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Navegar nas pastas do Google Drive
router.get('/gdrive-folders', async (req: Request, res: Response) => {
  try {
    const parentId = (req.query.parentId as string) || 'root';
    const subfolders = await GDriveService.listSubfolders(parentId);
    
    let currentFolderName = 'Meu Drive';
    if (parentId !== 'root') {
      try {
        const info = await GDriveService.getFolderInfo(parentId);
        currentFolderName = info.name || 'Pasta Selecionada';
      } catch (e) {}
    }

    res.json({
      currentId: parentId,
      currentName: currentFolderName,
      folders: subfolders,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
