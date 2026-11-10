#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJETOS_DIR = path.resolve(__dirname, '..', 'projetos');

const NEW_PROJECTS = [
  'album_figurinhas',
  'artes_caneca',
  'casa_organizada_ai',
  'cesta_cafe_manha',
  'collection_vault',
  'dashboard_bi',
  'forms',
  'forms_pro',
  'gerenciador_tunnel_apps',
  'iam_suite',
  'inventario_jogos',
  'link_promo',
  'loja_simples_hortifruti',
  'loja_simples_vendas',
  'qrcode_maker',
  'site_simpes_vendas_velas',
  'site_simples_personal_trainer',
  'site_simples_produtos_naturais',
  'site_simples_ti',
  'sync_google_drive',
  'visualizador_dashboad_ai',
];

const FILES_TO_READ = [
  'album_figurinhas/src/hooks/use-auth.tsx',
  'album_figurinhas/src/routes/admin/index.tsx',
  'artes_caneca/src/hooks/use-auth.tsx',
  'artes_caneca/src/routes/_authenticated/route.tsx',
  'casa_organizada_ai/src/routes/_authenticated.tsx',
  'casa_organizada_ai/src/routes/_authenticated/route.tsx',
  'casa_organizada_ai/src/integrations/supabase/auth-middleware.ts',
  'cesta_cafe_manha/src/hooks/useAuthSession.ts',
  'cesta_cafe_manha/src/routes/painel.tsx',
  'collection_vault/src/lib/auth.tsx',
  'collection_vault/src/routes/_app.tsx',
  'dashboard_bi/src/hooks/use-auth.ts',
  'dashboard_bi/src/routes/_authenticated/route.tsx',
  'forms/src/stores/authStore.ts',
  'forms/src/server/db.ts',
  'forms/scripts/seed.ts',
  'forms_pro/src/services/auth-service.ts',
  'forms_pro/src/routes/_app.tsx',
  'iam_suite/src/hooks/use-auth.tsx',
  'iam_suite/src/routes/_authenticated.tsx',
  'inventario_jogos/src/hooks/useAuth.ts',
  'link_promo/src/hooks/useAuth.tsx',
  'sync_google_drive/src/server/db/index.ts',
  'sync_google_drive/src/server/routes/auth.ts',
  'visualizador_dashboad_ai/server/db/store.ts',
  'visualizador_dashboad_ai/src/context/AuthContext.tsx',
  'visualizador_dashboad_ai/src/services/auth/authService.ts',
  'gerenciador_tunnel_apps/src/server/db/index.ts',
];

for (const rel of FILES_TO_READ) {
  const full = path.join(PROJETOS_DIR, rel);
  if (fs.existsSync(full)) {
    console.log(`\n==================== ${rel} ====================`);
    console.log(fs.readFileSync(full, 'utf8').slice(0, 3500));
  } else {
    console.log(`\n[MISSING] ${rel}`);
  }
}
