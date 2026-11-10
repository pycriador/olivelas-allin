import { DEMO_CREDENTIALS, mockGroups, mockUsers } from "./db";
import type { Group, User } from "@/types/auth";

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

// In-memory copies (mutable for the session)
let users: User[] = [...mockUsers];
let groups: Group[] = [...mockGroups];

/** Keeps group.memberIds in sync with user.groupId */
function syncMembershipFromUsers() {
  groups = groups.map((g) => ({
    ...g,
    memberIds: users.filter((u) => u.groupId === g.id).map((u) => u.id),
  }));
}

/** Keeps user.groupId in sync with a group's member list */
function syncUsersFromGroup(group: Group) {
  users = users.map((u) => {
    if (group.memberIds.includes(u.id)) return { ...u, groupId: group.id };
    if (u.groupId === group.id) return { ...u, groupId: null };
    return u;
  });
}

export const authApi = {
  async login(email: string, password: string): Promise<User> {
    await delay(500);
    const match = DEMO_CREDENTIALS.find(
      (c) => c.email.toLowerCase() === email.toLowerCase() && c.password === password,
    );
    if (!match) throw new Error("Credenciais inválidas");
    const user = users.find((u) => u.id === match.userId);
    if (!user) throw new Error("Usuário não encontrado");
    user.lastLoginAt = new Date().toISOString();
    return { ...user };
  },
  async register(input: { name: string; email: string; password: string }): Promise<User> {
    await delay(600);
    if (users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
      throw new Error("E-mail já cadastrado");
    }
    const newUser: User = {
      id: `usr_${Math.random().toString(36).slice(2, 8)}`,
      name: input.name,
      email: input.email,
      role: "user",
      groupId: "grp_users",
      status: "active",
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    syncMembershipFromUsers();
    return { ...newUser };
  },
  async forgotPassword(email: string): Promise<void> {
    await delay(500);
    if (!email.includes("@")) throw new Error("E-mail inválido");
  },
  async resetPassword(_token: string, _password: string): Promise<void> {
    await delay(500);
  },
};

export const usersApi = {
  async list(): Promise<User[]> {
    await delay(300);
    return [...users];
  },
  async create(input: Omit<User, "id" | "createdAt" | "lastLoginAt">): Promise<User> {
    await delay(400);
    if (users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
      throw new Error("E-mail já cadastrado");
    }
    const u: User = {
      ...input,
      id: `usr_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    };
    users.push(u);
    syncMembershipFromUsers();
    return u;
  },
  async update(id: string, patch: Partial<User>): Promise<User> {
    await delay(300);
    if (patch.email) {
      const dup = users.some(
        (u) => u.id !== id && u.email.toLowerCase() === patch.email!.toLowerCase(),
      );
      if (dup) throw new Error("E-mail já cadastrado");
    }
    users = users.map((u) => (u.id === id ? { ...u, ...patch } : u));
    syncMembershipFromUsers();
    return users.find((u) => u.id === id)!;
  },
  async remove(id: string): Promise<void> {
    await delay(300);
    users = users.filter((u) => u.id !== id);
    syncMembershipFromUsers();
  },
};

export const groupsApi = {
  async list(): Promise<Group[]> {
    await delay(300);
    return [...groups];
  },
  async create(input: Omit<Group, "id" | "createdAt">): Promise<Group> {
    await delay(400);
    if (groups.some((g) => g.name.toLowerCase() === input.name.toLowerCase())) {
      throw new Error("Já existe um grupo com este nome");
    }
    const g: Group = {
      ...input,
      id: `grp_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    groups.push(g);
    syncUsersFromGroup(g);
    return g;
  },
  async update(id: string, patch: Partial<Group>): Promise<Group> {
    await delay(300);
    groups = groups.map((g) => (g.id === id ? { ...g, ...patch } : g));
    const updated = groups.find((g) => g.id === id)!;
    if (patch.memberIds) syncUsersFromGroup(updated);
    return updated;
  },
  async remove(id: string): Promise<void> {
    await delay(300);
    groups = groups.filter((g) => g.id !== id);
    users = users.map((u) => (u.groupId === id ? { ...u, groupId: null } : u));
  },
};
