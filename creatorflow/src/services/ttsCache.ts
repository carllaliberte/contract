/**
 * =============================================================================
 * CreatorFlow - TTS Cache Service
 * =============================================================================
 *
 * Service de cache local pour les voix-off IA (Text-to-Speech).
 *
 * Objectifs :
 * - Éviter de régénérer le même audio plusieurs fois (économie de coûts)
 * - Lecture instantanée quand l'audio est déjà en cache
 * - Gestion automatique de la taille du cache (LRU)
 *
 * Stack : Capacitor + TypeScript + React
 * =============================================================================
 */

import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";

// =============================================================================
// Types
// =============================================================================

export interface TTSCacheMetadata {
  voiceId: string;
  voiceName: string;
  speed: number;
  duration: number;
  fileSize: number;
  createdAt: string;
  lastAccessedAt: string;
}

export interface TTSCacheEntry extends TTSCacheMetadata {
  key: string;
  path: string;
  fromCache: boolean;
}

export interface TTSCacheStats {
  entryCount: number;
  totalSizeBytes: number;
  maxSizeBytes: number;
  maxEntries: number;
}

type CacheIndex = Record<string, TTSCacheMetadata>;

// =============================================================================
// Configuration
// =============================================================================

const CACHE_DIR = "tts-cache";
const INDEX_PATH = `${CACHE_DIR}/index.json`;

/** Taille maximale du cache (400 Mo) */
const MAX_CACHE_SIZE_BYTES = 400 * 1024 * 1024;

/** Nombre maximum d'entrées dans le cache */
const MAX_ENTRIES = 180;

// =============================================================================
// Utilitaires
// =============================================================================

/**
 * Normalise le texte avant de créer le hash.
 * Évite de créer des caches différents pour des textes quasi identiques.
 */
function normalizeText(text: string): string {
  return text
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * Génère un hash SHA-256 (utilise l'API native du navigateur)
 */
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Crée la clé de cache unique
 */
async function generateCacheKey(
  text: string,
  voiceId: string,
  speed: number,
): Promise<string> {
  const normalized = normalizeText(text);
  const payload = `${normalized}|${voiceId}|${speed.toFixed(2)}`;
  return sha256(payload);
}

/**
 * Convertit un Blob en base64 (nécessaire pour Capacitor Filesystem)
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function audioPathForKey(key: string): string {
  return `${CACHE_DIR}/${key}.mp3`;
}

function sortKeysByLru(index: CacheIndex): string[] {
  return Object.keys(index).sort(
    (a, b) =>
      new Date(index[a].lastAccessedAt).getTime() -
      new Date(index[b].lastAccessedAt).getTime(),
  );
}

function totalSizeForIndex(index: CacheIndex): number {
  return Object.values(index).reduce((sum, entry) => sum + entry.fileSize, 0);
}

async function ensureCacheDir(): Promise<void> {
  try {
    await Filesystem.mkdir({
      path: CACHE_DIR,
      directory: Directory.Data,
      recursive: true,
    });
  } catch {
    // Le dossier existe déjà
  }
}

// =============================================================================
// Gestion de l'index
// =============================================================================

async function readIndex(): Promise<CacheIndex> {
  try {
    const result = await Filesystem.readFile({
      path: INDEX_PATH,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    return JSON.parse(result.data as string) as CacheIndex;
  } catch {
    return {};
  }
}

async function writeIndex(index: CacheIndex): Promise<void> {
  await ensureCacheDir();

  await Filesystem.writeFile({
    path: INDEX_PATH,
    data: JSON.stringify(index, null, 2),
    directory: Directory.Data,
    encoding: Encoding.UTF8,
  });
}

async function deleteAudioFile(key: string): Promise<void> {
  try {
    await Filesystem.deleteFile({
      path: audioPathForKey(key),
      directory: Directory.Data,
    });
  } catch {
    // Fichier déjà absent
  }
}

// =============================================================================
// Service principal
// =============================================================================

export const ttsCache = {
  /**
   * Récupère un audio depuis le cache ou le génère.
   */
  async getOrGenerate(
    text: string,
    voiceId: string,
    voiceName: string,
    speed: number,
    generateFn: () => Promise<Blob>,
    options: { force?: boolean } = {},
  ): Promise<TTSCacheEntry> {
    const key = await generateCacheKey(text, voiceId, speed);

    if (!options.force) {
      const cached = await this.get(key);
      if (cached) {
        const index = await readIndex();
        if (index[key]) {
          index[key].lastAccessedAt = new Date().toISOString();
          await writeIndex(index);
        }

        return {
          ...cached,
          key,
          fromCache: true,
        };
      }
    }

    const audioBlob = await generateFn();
    const path = audioPathForKey(key);
    const base64Data = await blobToBase64(audioBlob);

    await ensureCacheDir();
    await Filesystem.writeFile({
      path,
      data: base64Data,
      directory: Directory.Data,
    });

    const now = new Date().toISOString();
    const metadata: TTSCacheMetadata = {
      voiceId,
      voiceName,
      speed,
      duration: 0,
      fileSize: audioBlob.size,
      createdAt: now,
      lastAccessedAt: now,
    };

    const index = await readIndex();
    index[key] = metadata;
    await writeIndex(index);

    await this.cleanup();

    return {
      key,
      path,
      ...metadata,
      fromCache: false,
    };
  },

  /**
   * Vérifie si un audio existe déjà en cache
   */
  async has(text: string, voiceId: string, speed: number): Promise<boolean> {
    const key = await generateCacheKey(text, voiceId, speed);
    const cached = await this.get(key);
    return cached !== null;
  },

  /**
   * Récupère une entrée par sa clé
   */
  async get(key: string): Promise<(TTSCacheMetadata & { path: string }) | null> {
    const index = await readIndex();
    const meta = index[key];

    if (!meta) return null;

    const path = audioPathForKey(key);

    try {
      await Filesystem.stat({
        path,
        directory: Directory.Data,
      });
      return { ...meta, path };
    } catch {
      delete index[key];
      await writeIndex(index);
      return null;
    }
  },

  /**
   * Supprime une entrée du cache
   */
  async remove(key: string): Promise<void> {
    await deleteAudioFile(key);

    const index = await readIndex();
    if (!index[key]) return;

    delete index[key];
    await writeIndex(index);
  },

  /**
   * Vide entièrement le cache
   */
  async clear(): Promise<void> {
    const index = await readIndex();
    await Promise.all(Object.keys(index).map((key) => deleteAudioFile(key)));

    try {
      await Filesystem.deleteFile({
        path: INDEX_PATH,
        directory: Directory.Data,
      });
    } catch {
      // Index déjà absent
    }
  },

  /**
   * Retourne des statistiques sur le cache
   */
  async getStats(): Promise<TTSCacheStats> {
    const index = await readIndex();

    return {
      entryCount: Object.keys(index).length,
      totalSizeBytes: totalSizeForIndex(index),
      maxSizeBytes: MAX_CACHE_SIZE_BYTES,
      maxEntries: MAX_ENTRIES,
    };
  },

  /**
   * Évince les entrées les moins récemment utilisées si les limites sont dépassées
   */
  async cleanup(): Promise<void> {
    let index = await readIndex();
    let keys = Object.keys(index);
    let totalSize = totalSizeForIndex(index);

    while (keys.length > MAX_ENTRIES || totalSize > MAX_CACHE_SIZE_BYTES) {
      const oldestKey = sortKeysByLru(index)[0];
      if (!oldestKey) break;

      await deleteAudioFile(oldestKey);
      delete index[oldestKey];
      keys = Object.keys(index);
      totalSize = totalSizeForIndex(index);
    }

    await writeIndex(index);
  },
};
