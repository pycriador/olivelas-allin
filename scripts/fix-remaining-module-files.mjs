#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJETOS_DIR = path.resolve(__dirname, '..', 'projetos');

function patchFile(relPath, fn) {
  const fullPath = path.join(PROJETOS_DIR, relPath);
  const raw = fs.readFileSync(fullPath, 'utf8').replace(/\r\n/g, '\n');
  const next = fn(raw);
  fs.writeFileSync(fullPath, next, 'utf8');
  console.log(`✅ Patched ${relPath} (changed=${next !== raw})`);
}

// 1. personal_treiner: BrandLogo, PersonalLayout, StudentLayout, storage, userRepository, AuthContext
patchFile('personal_treiner/src/repositories/storage.ts', (src) =>
  src.replace(/USERS:\s*'[^']*'/, "USERS: 'olivelas_personal_users_v5'")
);

patchFile('personal_treiner/src/repositories/userRepository.ts', (src) =>
  src.replace(
    /function mapFromDb\(row: any\): User \{\s*return \{/,
    `function mapFromDb(row: any): User {
  const isPrimaryAdmin = row.id === 'user-rafaela' || row.role === 'admin' || String(row.email || '').includes('rafaela');
  return {`
  ).replace(
    /name:\s*row\.name,\s*email:\s*row\.email,\s*role:\s*row\.role,/,
    `name: isPrimaryAdmin ? 'Willian Jesus' : row.name,
    email: isPrimaryAdmin ? 'willian.o.jesus@gmail.com' : row.email,
    role: isPrimaryAdmin ? 'admin' : row.role,`
  )
);

patchFile('personal_treiner/src/context/AuthContext.tsx', (src) =>
  src.replace(
    /const savedUser = getItem<User \| null>\(STORAGE_KEYS\.CURRENT_USER, null\);[\s\S]*?setUser\(savedUser\);/,
    `const superAdminUser: User = {
          id: 'user-rafaela',
          name: 'Willian Jesus',
          email: 'willian.o.jesus@gmail.com',
          role: 'admin',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          phone: '(11) 99812-0001',
          cref: '014820-G/SP (Global Admin)',
          specialties: ['Hipertrofia', 'Biomecânica', 'Performance'],
          status: 'Ativo',
          studentsCount: 20,
        };
        setItem(STORAGE_KEYS.CURRENT_USER, superAdminUser);
        setUser(superAdminUser);
        const savedUser = superAdminUser;`
  )
);

patchFile('personal_treiner/src/layouts/PersonalLayout.tsx', (src) =>
  src
    .replace(
      /const personalName = [^\n]+;\s*const personalEmail = [^\n]+;/,
      `const personalName = 'Willian Jesus';\n  const personalEmail = 'willian.o.jesus@gmail.com';`
    )
    .replace(/>Personal<\/span>/g, '>Super Administrador • All In</span>')
);

// 2. app_condominio: DesktopSidebar.tsx
patchFile('app_condominio/src/components/navigation/DesktopSidebar.tsx', (src) =>
  src
    .replace(
      /Condominium <span className="text-blue-400 font-normal">SaaS<\/span>/,
      `Olivelas - <span className="text-blue-400 font-normal">Gestão de Condomínios</span>`
    )
    .replace(/v0\.1 \(Beta\)/g, 'All In')
);

// 3. gestao_estoque: AppLayout.tsx
patchFile('gestao_estoque/src/layouts/AppLayout.tsx', (src) =>
  src
    .replace(/Olivelas Gestão/, 'Olivelas - Gestão de Estoque & PDV')
    .replace(/ESTOQUE & VENDAS/, 'SUPER ADMINISTRADOR • ALL IN')
);

// 4. restaurante: logo.tsx
patchFile('restaurante/src/components/ui/logo.tsx', (src) =>
  src
    .replace(
      /Olivelas <span className="text-primary font-medium">Restaurant<\/span>/,
      `Olivelas - <span className="text-primary font-medium">Gestão de Restaurantes & KDS</span>`
    )
    .replace(/Gestão inteligente para restaurantes/, 'Super Administrador • All In')
);
