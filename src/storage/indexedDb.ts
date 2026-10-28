import {
  INITIAL_API_COLLECTIONS,
  INITIAL_API_ENVIRONMENTS,
  INITIAL_API_HISTORY,
  INITIAL_API_SERVICES,
  INITIAL_API_TOKENS,
  INITIAL_AUDIT_EVENTS,
  INITIAL_CHARGES,
  INITIAL_COMPANIES,
  INITIAL_COMPANY_MODULES,
  INITIAL_CONTRACTS,
  INITIAL_INSTALLMENTS,
  INITIAL_MODULES,
  INITIAL_OPERATIONAL_ITEMS,
  INITIAL_PAYMENTS,
  INITIAL_PAYMENT_METHODS,
  INITIAL_ROLES,
  INITIAL_TICKETS,
  INITIAL_USERS,
} from '../seed/initialData';

export const DB_NAME = 'olivelas_allin_mock_v1';
export const DB_VERSION = 2;

export type StoreName =
  | 'roles'
  | 'companies'
  | 'users'
  | 'modules'
  | 'company_modules'
  | 'contracts'
  | 'charges'
  | 'payments'
  | 'installments'
  | 'payment_methods'
  | 'api_collections'
  | 'api_environments'
  | 'api_services'
  | 'api_tokens'
  | 'api_history'
  | 'tickets'
  | 'operational_items'
  | 'audit_events'
  | 'meta';

const ALL_STORES: StoreName[] = [
  'roles',
  'companies',
  'users',
  'modules',
  'company_modules',
  'contracts',
  'charges',
  'payments',
  'installments',
  'payment_methods',
  'api_collections',
  'api_environments',
  'api_services',
  'api_tokens',
  'api_history',
  'tickets',
  'operational_items',
  'audit_events',
  'meta',
];

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      for (const storeName of ALL_STORES) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

export async function getAllFromStore<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as T[]) || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getByIdFromStore<T>(storeName: StoreName, id: string): Promise<T | undefined> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function putInStore<T extends { id: string }>(storeName: StoreName, item: T): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(item);
    req.onsuccess = () => resolve(item);
    req.onerror = () => reject(req.error);
  });
}

export async function putManyInStore<T extends { id: string }>(storeName: StoreName, items: T[]): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    for (const item of items) {
      store.put(item);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearStore(storeName: StoreName): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function populateAllSeedData(): Promise<void> {
  await putManyInStore('roles', structuredClone(INITIAL_ROLES));
  await putManyInStore('companies', structuredClone(INITIAL_COMPANIES));
  await putManyInStore('users', structuredClone(INITIAL_USERS));
  await putManyInStore('modules', structuredClone(INITIAL_MODULES));
  await putManyInStore('company_modules', structuredClone(INITIAL_COMPANY_MODULES));
  await putManyInStore('contracts', structuredClone(INITIAL_CONTRACTS));
  await putManyInStore('charges', structuredClone(INITIAL_CHARGES));
  await putManyInStore('payments', structuredClone(INITIAL_PAYMENTS));
  await putManyInStore('installments', structuredClone(INITIAL_INSTALLMENTS));
  await putManyInStore('payment_methods', structuredClone(INITIAL_PAYMENT_METHODS));
  await putManyInStore('api_collections', structuredClone(INITIAL_API_COLLECTIONS));
  await putManyInStore('api_environments', structuredClone(INITIAL_API_ENVIRONMENTS));
  await putManyInStore('api_services', structuredClone(INITIAL_API_SERVICES));
  await putManyInStore('api_tokens', structuredClone(INITIAL_API_TOKENS));
  await putManyInStore('api_history', structuredClone(INITIAL_API_HISTORY));
  await putManyInStore('tickets', structuredClone(INITIAL_TICKETS));
  await putManyInStore('operational_items', structuredClone(INITIAL_OPERATIONAL_ITEMS));
  await putManyInStore('audit_events', structuredClone(INITIAL_AUDIT_EVENTS));
  await putInStore('meta', {
    id: 'seed_status',
    seededAt: new Date().toISOString(),
    schemaVersion: DB_VERSION,
  });
}

export async function ensureSeeded(): Promise<void> {
  const meta = await getByIdFromStore<{ id: string; seededAt: string }>('meta', 'seed_status');
  const companies = await getAllFromStore('companies');
  if (!meta || companies.length === 0) {
    await populateAllSeedData();
    return;
  }
  const opItems = await getAllFromStore('operational_items');
  if (opItems.length === 0) {
    await putManyInStore('operational_items', structuredClone(INITIAL_OPERATIONAL_ITEMS));
  }
}

export async function resetToInitialSeed(): Promise<void> {
  for (const store of ALL_STORES) {
    await clearStore(store);
  }
  await populateAllSeedData();
}
