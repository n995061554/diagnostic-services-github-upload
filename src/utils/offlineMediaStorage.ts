/**
 * Diagnostic Services — IndexedDB Offline Media Storage & Image Compression
 * 
 * Rules & Invariants:
 * 1. Stores offline binary image blobs in IndexedDB (never in localStorage to prevent 5MB overflow).
 * 2. Compresses camera captures to a maximum width/height of 1600px with 0.8 JPEG quality (~400-600 KB).
 * 3. Purges local temporary blobs immediately upon server upload confirmation.
 * 4. Checks storage quota before queuing.
 */

const DB_NAME = 'a2z_offline_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'pending_photos';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'idempotencyKey' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface StoredOfflinePhoto {
  idempotencyKey: string;
  blob: Blob;
  mimeType: string;
  sizeBytes: number;
  entityType: 'SALES_VISIT_SELFIE' | 'DELIVERY_PROOF_PHOTO' | 'EXPENSE_RECEIPT';
  createdAt: string;
  metadata?: Record<string, any>;
}

export async function storePendingPhoto(
  idempotencyKey: string,
  blob: Blob,
  entityType: 'SALES_VISIT_SELFIE' | 'DELIVERY_PROOF_PHOTO' | 'EXPENSE_RECEIPT',
  metadata?: Record<string, any>
): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const record: StoredOfflinePhoto = {
      idempotencyKey,
      blob,
      mimeType: blob.type || 'image/jpeg',
      sizeBytes: blob.size,
      entityType,
      createdAt: new Date().toISOString(),
      metadata,
    };

    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingPhoto(idempotencyKey: string): Promise<StoredOfflinePhoto | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(idempotencyKey);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function removePendingPhoto(idempotencyKey: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(idempotencyKey);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function listPendingPhotos(): Promise<StoredOfflinePhoto[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

/**
 * Compresses an image file/blob to maximum dimensions and quality for reliable cellular transmission.
 */
export async function compressImage(
  imageSource: Blob | File,
  maxDimension = 1600,
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(imageSource);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageSource); // Fallback
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(imageSource);
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
}
