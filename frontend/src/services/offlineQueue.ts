import type { TipoAcceso } from '../types';

export interface OfflineMovementItem {
  id: string;
  targetId: string;
  personaNombre: string;
  personaCedula: string;
  isGuest: boolean;
  tipo: TipoAcceso;
  observacion?: string;
  qrToken?: string;
  queuedAt: string;
  status: 'PENDING' | 'REJECTED';
  errorMsg?: string;
}

const DB_NAME = 'cai_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'pending_movements';

function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no está disponible en este entorno'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('queuedAt', 'queuedAt', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Error abriendo IndexedDB'));
  });
}

function notifyQueueUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cai:offline-queue-updated'));
  }
}

export const offlineQueue = {
  async enqueue(item: Omit<OfflineMovementItem, 'id' | 'queuedAt' | 'status'>): Promise<OfflineMovementItem> {
    const record: OfflineMovementItem = {
      ...item,
      id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      queuedAt: new Date().toISOString(),
      status: 'PENDING',
    };

    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => {
        notifyQueueUpdated();
        resolve(record);
      };
      req.onerror = () => reject(req.error || new Error('Error guardando movimiento en cola offline'));
    });
  },

  async listAll(): Promise<OfflineMovementItem[]> {
    try {
      const db = await openOfflineDb();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const items = (req.result as OfflineMovementItem[]) || [];
          items.sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));
          resolve(items);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  },

  async remove(id: string): Promise<void> {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => {
        notifyQueueUpdated();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  },

  async markRejected(id: string, errorMsg: string): Promise<void> {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const existing = getReq.result as OfflineMovementItem | undefined;
        if (!existing) {
          resolve();
          return;
        }
        existing.status = 'REJECTED';
        existing.errorMsg = errorMsg;
        const putReq = store.put(existing);
        putReq.onsuccess = () => {
          notifyQueueUpdated();
          resolve();
        };
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  },

  async resetToPending(id: string): Promise<void> {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const existing = getReq.result as OfflineMovementItem | undefined;
        if (!existing) {
          resolve();
          return;
        }
        existing.status = 'PENDING';
        existing.errorMsg = undefined;
        const putReq = store.put(existing);
        putReq.onsuccess = () => {
          notifyQueueUpdated();
          resolve();
        };
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  },
};

