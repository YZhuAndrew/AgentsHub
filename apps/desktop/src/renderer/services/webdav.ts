/**
 * WebDAV Sync Service - Support incremental backup, image sync, version history and bidirectional sync
 * WebDAV 同步服务 - 支持增量备份、图片同步、版本历史和双向同步
 */

import {
  autoSyncBackup,
  BACKUP_DIR,
  computeHash,
  DATA_FILENAME,
  decryptData,
  downloadSyncBackup,
  encryptData,
  getRemoteSyncBackupTimestamp,
  IMAGES_DIR,
  incrementalDownloadSyncBackup,
  incrementalUploadSyncBackup,
  LEGACY_BACKUP_FILENAME,
  MANIFEST_FILENAME,
  type BackupData,
  type BackupManifest,
  type RemoteDownloadResult,
  type RemoteSyncAdapter,
  type RemoteUploadResult,
  type SyncBackupOptions,
  type SyncResult,
  uploadSyncBackup,
  VIDEOS_DIR,
} from "./sync-backup-core";

export type { BackupData, BackupManifest, SyncResult };

export interface WebDAVConfig {
  url: string;
  username: string;
  password: string;
}

export interface WebDAVSyncOptions extends SyncBackupOptions {}

function buildBaseUrl(config: WebDAVConfig): string {
  return config.url.replace(/\/$/, "");
}

function buildAuthHeader(config: WebDAVConfig): string {
  return "Basic " + btoa(`${config.username}:${config.password}`);
}

async function uploadFile(
  url: string,
  config: WebDAVConfig,
  content: string,
): Promise<RemoteUploadResult> {
  try {
    if (window.electron?.webdav?.upload) {
      const result = await window.electron.webdav.upload(url, config, content);
      return {
        success: result.success,
        error: result.error,
      };
    }

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: buildAuthHeader(config),
        "Content-Type": "application/json",
        "User-Agent": "AgentsHub/1.0",
      },
      body: content,
    });

    if (response.ok || response.status === 201 || response.status === 204) {
      return { success: true };
    }

    return {
      success: false,
      error: `${response.status} ${response.statusText}`,
    };
  } catch (error) {
    console.error("Upload file failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function downloadFile(
  url: string,
  config: WebDAVConfig,
): Promise<RemoteDownloadResult> {
  try {
    if (window.electron?.webdav?.download) {
      return await window.electron.webdav.download(url, config);
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: buildAuthHeader(config),
        "User-Agent": "AgentsHub/1.0",
      },
    });

    if (response.status === 404) {
      return { success: false, notFound: true };
    }

    if (response.ok) {
      return {
        success: true,
        data: await response.text(),
      };
    }

    return {
      success: false,
      error: `${response.status} ${response.statusText}`,
    };
  } catch (error) {
    console.error("Download file failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function ensureDirectory(url: string, config: WebDAVConfig): Promise<void> {
  try {
    if (window.electron?.webdav?.ensureDirectory) {
      await window.electron.webdav.ensureDirectory(url, config);
      return;
    }

    const authHeader = buildAuthHeader(config);
    const checkRes = await fetch(url, {
      method: "PROPFIND",
      headers: {
        Authorization: authHeader,
        Depth: "0",
        "User-Agent": "AgentsHub/1.0",
      },
    });

    if (checkRes.ok || checkRes.status === 207) {
      return;
    }

    await fetch(url, {
      method: "MKCOL",
      headers: {
        Authorization: authHeader,
        "User-Agent": "AgentsHub/1.0",
      },
    });
  } catch (error) {
    console.warn("Ensure WebDAV directory failed:", error);
  }
}

async function statFile(
  url: string,
  config: WebDAVConfig,
): Promise<{ exists: boolean; lastModified?: string }> {
  try {
    if (window.electron?.webdav?.stat) {
      const result = await window.electron.webdav.stat(url, config);
      if (result.notFound || !result.success) {
        return { exists: false };
      }

      return {
        exists: true,
        lastModified: result.lastModified,
      };
    }

    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        Authorization: buildAuthHeader(config),
      },
    });

    if (response.status === 404) {
      return { exists: false };
    }

    if (response.ok) {
      return {
        exists: true,
        lastModified: response.headers.get("Last-Modified") ?? undefined,
      };
    }

    return { exists: false };
  } catch {
    return { exists: false };
  }
}

function createWebDAVAdapter(config: WebDAVConfig): RemoteSyncAdapter {
  const baseUrl = buildBaseUrl(config);
  const backupDirUrl = `${baseUrl}/${BACKUP_DIR}`;
  const videosDirUrl = `${backupDirUrl}/${VIDEOS_DIR}`;
  const imagesDirUrl = `${backupDirUrl}/${IMAGES_DIR}`;

  return {
    paths: {
      legacy: `${baseUrl}/${LEGACY_BACKUP_FILENAME}`,
      manifest: `${backupDirUrl}/${MANIFEST_FILENAME}`,
      data: `${backupDirUrl}/${DATA_FILENAME}`,
      image: (fileName: string) =>
        `${imagesDirUrl}/${encodeURIComponent(fileName)}.base64`,
      video: (fileName: string) =>
        `${videosDirUrl}/${encodeURIComponent(fileName)}.base64`,
    },
    prepareLegacyUpload: async () => {
      await ensureDirectory(baseUrl, config);
    },
    prepareIncrementalUpload: async (includeMedia: boolean) => {
      await ensureDirectory(backupDirUrl, config);
      if (!includeMedia) {
        return;
      }
      await ensureDirectory(imagesDirUrl, config);
      await ensureDirectory(videosDirUrl, config);
    },
    uploadText: (path, content) => uploadFile(path, config, content),
    downloadText: (path) => downloadFile(path, config),
    stat: (path) => statFile(path, config),
  };
}

export async function testConnection(
  config: WebDAVConfig,
): Promise<SyncResult> {
  try {
    if (window.electron?.webdav?.testConnection) {
      return await window.electron.webdav.testConnection(config);
    }

    const response = await fetch(config.url, {
      method: "PROPFIND",
      headers: {
        Authorization: buildAuthHeader(config),
        Depth: "0",
        "User-Agent": "AgentsHub/1.0",
      },
    });

    if (response.ok || response.status === 207) {
      return { success: true, message: "Connection successful / 连接成功" };
    }

    if (response.status === 401) {
      return {
        success: false,
        message:
          "Authentication failed, please check username and password / 认证失败，请检查用户名和密码",
      };
    }

    return {
      success: false,
      message: `Connection failed: ${response.status} ${response.statusText} / 连接失败: ${response.status} ${response.statusText}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error instanceof Error ? error.message : "Unknown error"} / 连接失败: ${error instanceof Error ? error.message : "未知错误"}`,
    };
  }
}

export async function uploadToWebDAV(
  config: WebDAVConfig,
  options?: WebDAVSyncOptions,
): Promise<SyncResult> {
  return uploadSyncBackup(createWebDAVAdapter(config), options);
}

export async function incrementalUpload(
  config: WebDAVConfig,
  options?: WebDAVSyncOptions,
): Promise<SyncResult> {
  return incrementalUploadSyncBackup(createWebDAVAdapter(config), options);
}

export async function downloadFromWebDAV(
  config: WebDAVConfig,
  options?: WebDAVSyncOptions,
): Promise<SyncResult> {
  return downloadSyncBackup(createWebDAVAdapter(config), options);
}

export async function incrementalDownload(
  config: WebDAVConfig,
  options?: WebDAVSyncOptions,
): Promise<SyncResult> {
  const adapter = createWebDAVAdapter(config);
  return incrementalDownloadSyncBackup(
    adapter,
    options,
    () => downloadSyncBackup(adapter, { ...options, incrementalSync: false }),
  );
}

export async function getRemoteBackupInfo(config: WebDAVConfig): Promise<{
  exists: boolean;
  timestamp?: string;
  data?: BackupData;
}> {
  try {
    const result = await downloadFile(
      `${buildBaseUrl(config)}/${LEGACY_BACKUP_FILENAME}`,
      config,
    );
    if (!result.success || !result.data) {
      return { exists: false };
    }

    const data = JSON.parse(result.data) as BackupData;
    return {
      exists: true,
      timestamp: data.exportedAt,
      data,
    };
  } catch {
    return { exists: false };
  }
}

export async function getRemoteBackupTimestamp(config: WebDAVConfig): Promise<{
  exists: boolean;
  lastModified?: string;
}> {
  return getRemoteSyncBackupTimestamp(createWebDAVAdapter(config));
}

export async function bidirectionalSync(
  config: WebDAVConfig,
  options?: WebDAVSyncOptions,
): Promise<SyncResult> {
  return autoSyncBackup(createWebDAVAdapter(config), options);
}

export async function autoSync(
  config: WebDAVConfig,
  options?: WebDAVSyncOptions,
): Promise<SyncResult> {
  return bidirectionalSync(config, options);
}

export {
  BACKUP_DIR,
  MANIFEST_FILENAME,
  DATA_FILENAME,
  IMAGES_DIR,
  VIDEOS_DIR,
  LEGACY_BACKUP_FILENAME,
  computeHash,
  encryptData,
  decryptData,
};
