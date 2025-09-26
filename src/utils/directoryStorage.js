/**
 * DirectoryStorage - Utility for persisting File System Access API directory handles in IndexedDB
 * Uses idb-keyval for simplified IndexedDB operations
 */

import { get, set, del, keys } from 'https://cdn.skypack.dev/idb-keyval';

export class DirectoryStorage {
    constructor(logger) {
        this.logger = logger;
        this.keyPrefix = 'mermaiditor-directory-';
    }

    /**
     * Get the storage key for a project
     */
    _getProjectKey(projectId) {
        return `${this.keyPrefix}${projectId}`;
    }

    /**
     * Store a directory handle for a specific project
     */
    async storeProjectDirectory(projectId, directoryHandle) {
        if (!projectId) {
            throw new Error('Project ID is required');
        }
        if (!directoryHandle) {
            throw new Error('Directory handle is required');
        }

        const key = this._getProjectKey(projectId);
        await set(key, directoryHandle);
         this.logger.info(`Directory handle stored for project: ${projectId}`);
    }

    /**
     * Retrieve the stored directory handle for a specific project
     */
    async getProjectDirectory(projectId) {
        if (!projectId) {
            throw new Error('Project ID is required');
        }

        const key = this._getProjectKey(projectId);
        const directoryHandle = await get(key);
        
        if (directoryHandle) {
             this.logger.info(`Directory handle retrieved for project: ${projectId}`);
        } else {
             this.logger.info(`No directory handle found for project: ${projectId}`);
        }
        
        return directoryHandle || null;
    }

    async removeProjectDirectory(projectId) {
        if (!projectId) {
            throw new Error('Project ID is required');
        }

        const key = this._getProjectKey(projectId);
        await del(key);
        this.logger.info(`Directory handle cleared for project: ${projectId}`);
    }

    /**
     * Get all stored project directories
     */
    async getAllProjectDirectories() {
        const allKeys = await keys();
        const projectKeys = allKeys.filter(key => 
            typeof key === 'string' && key.startsWith(this.keyPrefix)
        );
        
        const projectDirectories = {};
        for (const key of projectKeys) {
            const projectId = key.replace(this.keyPrefix, '');
            const directoryHandle = await get(key);
            if (directoryHandle) {
                projectDirectories[projectId] = directoryHandle;
            }
        }
        
        return projectDirectories;
    }

    /**
     * Check if directory handle is accessible (user hasn't revoked permissions)
     */
    async verifyDirectoryAccess(directoryHandle) {
        if (!directoryHandle) return false;

        try {
            // Try to query permission status
            const permission = await directoryHandle.queryPermission({ mode: 'readwrite' });
            
            if (permission === 'granted') {
                return true;
            } else if (permission === 'prompt') {
                // Request permission again
                const newPermission = await directoryHandle.requestPermission({ mode: 'readwrite' });
                return newPermission === 'granted';
            } else {
                // Permission denied
                return false;
            }
        } catch (error) {
            if (error.message.indexOf(`User activation is required to request permissions`) >= 0) {
                // This is recoverable, we'll let higher levels retry.
                throw error;
            }
            this.logger.error('Error verifying directory access:', error);
            return false;
        }
    }

    /**
     * Restore directory handle for a project with verification
     */
    async restoreProjectDirectory(projectId) {
        try {
            const directoryHandle = await this.getProjectDirectory(projectId);
            if (!directoryHandle) {
                return null;
            }
            if (this.verifyDirectoryAccess(directoryHandle)) {
                return directoryHandle;
            }

            this.logger.error(`Error: permission has not been granted`);
            return null;
        } catch (error) {
            this.logger.error(`Error restoring directory handle for project ${projectId}:`, error);
            return null;
        }
    }
}