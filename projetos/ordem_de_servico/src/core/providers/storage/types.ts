export interface Entity {
  id: string;
}

export type Query<T> = Partial<T> | ((item: T) => boolean);

export interface StorageProvider {
  readonly name: string;
  create<T extends Entity>(collection: string, data: Partial<Omit<T, "id">> & { id?: string }): Promise<T>;
  update<T extends Entity>(collection: string, id: string, data: Partial<T>): Promise<T>;
  delete(collection: string, id: string): Promise<void>;
  find<T extends Entity>(collection: string, id: string): Promise<T | null>;
  findAll<T extends Entity>(collection: string, query?: Query<T>): Promise<T[]>;
  count(collection: string, query?: Query<unknown>): Promise<number>;
  clear(collection?: string): Promise<void>;
  transaction<R>(fn: (tx: StorageProvider) => Promise<R>): Promise<R>;
}
