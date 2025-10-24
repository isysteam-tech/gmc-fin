import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.DEFAULT }) // ensures a single instance
export class LocalStorageService {
  private store = new Map<string, string>();

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  getItem(key: string) {
    return this.store.get(key) || null;
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}
