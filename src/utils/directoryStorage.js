/**
 * DirectoryStorage - Utility for persisting File System Access API directory handles in IndexedDB
 * Uses idb-keyval for simplified IndexedDB operations
 */

import { get, set, del, keys } from 'https://cdn.skypack.dev/idb-keyval';

class DirectoryStorage {
    constructor() {
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
        console.log(`Directory handle stored for project: ${projectId}`);
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
            console.log(`Directory handle retrieved for project: ${projectId}`);
        } else {
            console.log(`No directory handle found for project: ${projectId}`);
        }
        
        return directoryHandle || null;
    }

    /**
     * Remove the stored directory handle for a specific project
     */
    async clearProjectDirectory(projectId) {
        if (!projectId) {
            throw new Error('Project ID is required');
        }

        const key = this._getProjectKey(projectId);
        await del(key);
        console.log(`Directory handle cleared for project: ${projectId}`);
    }

    /**
     * Alias for clearProjectDirectory for consistency
     */
    async removeProjectDirectory(projectId) {
        return this.clearProjectDirectory(projectId);
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
            console.warn('Error verifying directory access:', error);
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

            // Verify we still have access to this directory
            const hasAccess = await this.verifyDirectoryAccess(directoryHandle);
            if (!hasAccess) {
                console.log(`Directory access revoked for project ${projectId}, clearing stored handle`);
                await this.clearProjectDirectory(projectId);
                return null;
            }

            console.log(`Directory handle restored successfully for project: ${projectId}`);
            return directoryHandle;
        } catch (error) {
            console.error(`Error restoring directory handle for project ${projectId}:`, error);
            // Clear invalid handle
            try {
                await this.clearProjectDirectory(projectId);
            } catch (clearError) {
                console.error(`Error clearing invalid directory handle for project ${projectId}:`, clearError);
            }
            return null;
        }
    }
}

// Export a singleton instance
export const directoryStorage = new DirectoryStorage();