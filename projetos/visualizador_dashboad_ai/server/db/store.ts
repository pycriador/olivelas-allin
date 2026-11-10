import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Survey, AnalysisDisplaySettings } from '../../src/types/survey';

export const ADMIN_EMAIL = 'willian.o.jesus@gmail.com';

export interface UserCredentials {
  googleClientEmail?: string;
  googlePrivateKey?: string;
  googleProjectId?: string;
  googleApiKey?: string;
  geminiApiKey?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  updatedAt: string;
  credentials?: UserCredentials;
  isAdmin?: boolean;
}

export interface UserSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface UserProject {
  id: string;
  userId: string;
  name: string;
  description?: string;
  survey: Survey;
  displaySettings?: AnalysisDisplaySettings;
  createdAt: string;
  updatedAt: string;
}

export interface AppDataSchema {
  users: User[];
  sessions: UserSession[];
  projects: UserProject[];
}

export interface DashboardBackupJSON {
  version: string;
  exportedAt: string;
  appName: string;
  projectId: string;
  projectName: string;
  projectDescription?: string;
  survey: Survey;
  displaySettings?: AnalysisDisplaySettings;
}

class ServerStore {
  private dataFilePath: string;
  private data: AppDataSchema;

  constructor() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dataFilePath = path.join(dataDir, 'app_data.json');
    this.data = this.loadData();
  }

  private loadData(): AppDataSchema {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const content = fs.readFileSync(this.dataFilePath, 'utf-8');
        const parsed = JSON.parse(content);
        return {
          users: Array.isArray(parsed.users) ? parsed.users : [],
          sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
          projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        };
      }
    } catch (err) {
      console.error('[ServerStore] Failed to read data file, initializing empty store:', err);
    }
    return { users: [], sessions: [], projects: [] };
  }

  private persistData() {
    try {
      fs.writeFileSync(this.dataFilePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[ServerStore] Error persisting data file:', err);
    }
  }

  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  }

  // ==========================================
  // AUTH METHODS
  // ==========================================

  public register(email: string, password: string, name?: string): { user: Omit<User, 'passwordHash' | 'salt'>; token: string } {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      throw new Error('E-mail e senha são obrigatórios.');
    }
    if (password.length < 6) {
      throw new Error('A senha deve ter no mínimo 6 caracteres.');
    }

    const existing = this.data.users.find((u) => u.email === normalizedEmail);
    if (existing) {
      throw new Error('Este endereço de e-mail já está cadastrado.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(password, salt);
    const userId = `usr_${crypto.randomUUID().slice(0, 12)}`;
    const now = new Date().toISOString();

    const newUser: User = {
      id: userId,
      email: normalizedEmail,
      name: name?.trim() || normalizedEmail.split('@')[0],
      passwordHash,
      salt,
      createdAt: now,
      updatedAt: now,
      credentials: {},
    };

    this.data.users.push(newUser);

    // Create session token
    const token = `tok_${crypto.randomBytes(32).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    this.data.sessions.push({
      token,
      userId,
      createdAt: now,
      expiresAt,
    });

    this.persistData();

    const { passwordHash: _, salt: __, ...safeUser } = newUser;
    return { 
      user: {
        ...safeUser,
        isAdmin: safeUser.email.toLowerCase() === ADMIN_EMAIL,
      }, 
      token 
    };
  }

  public login(email: string, password: string): { user: Omit<User, 'passwordHash' | 'salt'>; token: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.data.users.find((u) => u.email === normalizedEmail);
    if (!user) {
      throw new Error('E-mail ou senha incorretos.');
    }

    const hash = this.hashPassword(password, user.salt);
    if (hash !== user.passwordHash) {
      throw new Error('E-mail ou senha incorretos.');
    }

    const token = `tok_${crypto.randomBytes(32).toString('hex')}`;
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    this.data.sessions.push({
      token,
      userId: user.id,
      createdAt: now,
      expiresAt,
    });

    this.persistData();

    const { passwordHash: _, salt: __, ...safeUser } = user;
    return { 
      user: {
        ...safeUser,
        isAdmin: safeUser.email.toLowerCase() === ADMIN_EMAIL,
      }, 
      token 
    };
  }

  public getUserByToken(token?: string): (Omit<User, 'passwordHash' | 'salt'> & { isAdmin?: boolean }) | null {
    if (!token) return null;
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
    const session = this.data.sessions.find((s) => s.token === cleanToken);
    if (!session) return null;

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      return null;
    }

    const user = this.data.users.find((u) => u.id === session.userId);
    if (!user) return null;

    const { passwordHash: _, salt: __, ...safeUser } = user;
    return {
      ...safeUser,
      isAdmin: safeUser.email.toLowerCase() === ADMIN_EMAIL,
    };
  }

  public getAdminCredentials(): UserCredentials | null {
    const admin = this.data.users.find((u) => u.email.toLowerCase() === ADMIN_EMAIL);
    return admin?.credentials || null;
  }

  public getFullUserByToken(token?: string): User | null {
    if (!token) return null;
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
    const session = this.data.sessions.find((s) => s.token === cleanToken);
    if (!session) return null;
    return this.data.users.find((u) => u.id === session.userId) || null;
  }

  public logout(token: string): boolean {
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
    const initialLen = this.data.sessions.length;
    this.data.sessions = this.data.sessions.filter((s) => s.token !== cleanToken);
    if (this.data.sessions.length !== initialLen) {
      this.persistData();
      return true;
    }
    return false;
  }

  // ==========================================
  // USER CREDENTIALS METHODS
  // ==========================================

  public updateUserCredentials(userId: string, credentials: UserCredentials): void {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) throw new Error('Usuário não encontrado.');

    user.credentials = {
      ...(user.credentials || {}),
      ...credentials,
    };
    user.updatedAt = new Date().toISOString();
    this.persistData();
  }

  public getUserCredentials(userId: string): UserCredentials | undefined {
    const user = this.data.users.find((u) => u.id === userId);
    return user?.credentials;
  }

  // ==========================================
  // PROJECTS & DASHBOARD METHODS
  // ==========================================

  public getUserProjects(userId: string): Array<{
    id: string;
    name: string;
    description?: string;
    sourceName?: string;
    sourceType?: string;
    questionCount: number;
    responseCount: number;
    updatedAt: string;
    createdAt: string;
  }> {
    const projects = this.data.projects.filter((p) => p.userId === userId);
    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      sourceName: p.survey?.source?.name || 'Pesquisa',
      sourceType: p.survey?.source?.type || 'survey',
      questionCount: p.survey?.questions?.length || 0,
      responseCount: p.survey?.responses?.length || 0,
      updatedAt: p.updatedAt,
      createdAt: p.createdAt,
    }));
  }

  public getProject(userId: string, projectId: string): UserProject | null {
    const project = this.data.projects.find((p) => p.id === projectId && p.userId === userId);
    return project || null;
  }

  public saveProject(
    userId: string,
    payload: { id?: string; name: string; description?: string; survey: Survey; displaySettings?: AnalysisDisplaySettings }
  ): UserProject {
    const now = new Date().toISOString();
    const projectId = payload.id || `proj_${crypto.randomUUID().slice(0, 12)}`;

    const existingIndex = this.data.projects.findIndex((p) => p.id === projectId && p.userId === userId);

    const project: UserProject = {
      id: projectId,
      userId,
      name: payload.name.trim() || payload.survey.name || payload.survey.title || 'Pesquisa Sem Título',
      description: payload.description || payload.survey.description,
      survey: payload.survey,
      displaySettings: payload.displaySettings,
      createdAt: existingIndex >= 0 ? this.data.projects[existingIndex].createdAt : now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      this.data.projects[existingIndex] = project;
    } else {
      this.data.projects.unshift(project);
    }

    this.persistData();
    return project;
  }

  public deleteProject(userId: string, projectId: string): boolean {
    const initialLen = this.data.projects.length;
    this.data.projects = this.data.projects.filter((p) => !(p.id === projectId && p.userId === userId));
    if (this.data.projects.length !== initialLen) {
      this.persistData();
      return true;
    }
    return false;
  }

  // ==========================================
  // BACKUP & RESTORE METHODS (NO CREDENTIALS EVER)
  // ==========================================

  public exportProjectBackup(userId: string, projectId: string): DashboardBackupJSON {
    const project = this.getProject(userId, projectId);
    if (!project) {
      throw new Error('Projeto não encontrado para exportação.');
    }

    // Sanitize and ensure NO credentials/keys are included
    const sanitizedSurvey: Survey = {
      id: project.survey.id,
      name: project.survey.name || project.survey.title || project.name,
      title: project.survey.title || project.survey.name,
      description: project.survey.description,
      createdAt: project.survey.createdAt || new Date().toISOString(),
      analyzedAt: project.survey.analyzedAt || new Date().toISOString(),
      source: {
        type: project.survey.source.type,
        id: project.survey.source.id,
        name: project.survey.source.name,
        rowCount: project.survey.source.rowCount,
        mimeType: project.survey.source.mimeType,
        url: project.survey.source.url,
      },
      questions: project.survey.questions,
      mappings: project.survey.mappings,
      responses: project.survey.responses,
      decimalPlaces: project.survey.decimalPlaces,
    };

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      appName: 'AI Survey Analyzer',
      projectId: project.id,
      projectName: project.name,
      projectDescription: project.description,
      survey: sanitizedSurvey,
      displaySettings: project.displaySettings,
    };
  }

  public importProjectBackup(userId: string, backup: DashboardBackupJSON): UserProject {
    if (!backup || !backup.survey || !Array.isArray(backup.survey.questions)) {
      throw new Error('Formato de backup inválido. O arquivo JSON deve conter um modelo de pesquisa válido.');
    }

    const projectId = `proj_${crypto.randomUUID().slice(0, 12)}`;
    const now = new Date().toISOString();

    const project: UserProject = {
      id: projectId,
      userId,
      name: backup.projectName || backup.survey.name || backup.survey.title || 'Pesquisa Importada',
      description: backup.projectDescription || backup.survey.description,
      survey: {
        ...backup.survey,
        id: `srv_${crypto.randomUUID().slice(0, 10)}`,
        name: backup.survey.name || backup.survey.title || backup.projectName || 'Pesquisa Importada',
      },
      displaySettings: backup.displaySettings,
      createdAt: now,
      updatedAt: now,
    };

    this.data.projects.unshift(project);
    this.persistData();
    return project;
  }
}

export const dbStore = new ServerStore();
