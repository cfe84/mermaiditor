/**
 * FileSystemStorageProvider - Local folder storage using File System Access API
 * Only works in Chrome/Edge browsers with File System Access API support
 */

import { directoryStorage } from '../utils/directoryStorage.js';

export class FileSystemStorageProvider {
    constructor(logger) {
        this.logger = logger?.withContext('FileSystemStorageProvider') || console;
        // Map of projectId -> directoryHandle for active projects
        this.projectDirectories = new Map();
    }

    getIcon() {
        return "📂";
    }

    /**
     * Check if the File System Access API is supported
     */
    static isSupported() {
        return 'showDirectoryPicker' in window && 'showSaveFilePicker' in window;
    }

    /**
     * Initialize the provider (no longer global - now per-project)
     */
    async initialize() {
        // This method is kept for compatibility but no longer does global initialization
        return true;
    }

    /**
     * Get directory handle for a specific project
     */
    async getProjectDirectoryHandle(projectId) {
        // Check if we have it in memory
        if (this.projectDirectories.has(projectId)) {
            return this.projectDirectories.get(projectId);
        }

        // Try to restore from IndexedDB
        const directoryHandle = await directoryStorage.restoreProjectDirectory(projectId);
        if (directoryHandle) {
            this.projectDirectories.set(projectId, directoryHandle);
            return directoryHandle;
        }

        return null;
    }

    /**
     * Browse a directory and discover all Mermaiditor projects
     */
    async discoverProjectsInDirectory() {
        try {
            const directoryHandle = await window.showDirectoryPicker({
                mode: 'read'
            });

            const projects = [];

            // Scan directory for .mermaiditor-project.json files
            for await (const [name, handle] of directoryHandle.entries()) {
                if (handle.kind === 'file' && name.endsWith('.mermaiditor-project.json')) {
                    try {
                        const file = await handle.getFile();
                        const content = await file.text();
                        const projectData = JSON.parse(content);
                        
                        if (projectData.metadata?.id && projectData.metadata?.name) {
                            projects.push({
                                id: projectData.metadata.id,
                                name: projectData.metadata.name,
                                fileName: name,
                                directoryHandle: directoryHandle,
                                projectData: projectData
                            });
                        }
                    } catch (error) {
                        this.logger.warn(`Failed to read project file ${name}:`, error);
                    }
                }
            }

            return {
                directoryHandle,
                projects
            };
        } catch (error) {
            if (error.name === 'AbortError') {
                this.logger.info('Directory selection cancelled by user');
                return null;
            }
            this.logger.error('Failed to browse directory:', error);
            throw error;
        }
    }

    /**
     * Open an existing project from a discovered project
     */
    async openDiscoveredProject(discoveredProject) {
        const { id, directoryHandle } = discoveredProject;
        
        // Store the directory handle for this project
        this.projectDirectories.set(id, directoryHandle);
        await directoryStorage.storeProjectDirectory(id, directoryHandle);
        
        this.logger.info(`Opened existing project from folder: ${discoveredProject.name}`);
        return true;
    }

    /**
     * Set directory handle for a project (when user selects a folder)
     */
    async setProjectDirectoryHandle(projectId, directoryHandle) {
        this.projectDirectories.set(projectId, directoryHandle);
        await directoryStorage.storeProjectDirectory(projectId, directoryHandle);
    }

    /**
     * Clear directory handle for a project
     */
    async clearProjectDirectory(projectId) {
        this.projectDirectories.delete(projectId);
        await directoryStorage.clearProjectDirectory(projectId);
    }

    /**
     * Request user to select a directory for a project
     */
    async selectDirectoryForProject(projectId) {
        if (!FileSystemStorageProvider.isSupported()) {
            throw new Error('File System Access API not supported in this browser');
        }

        try {
            this.logger.info(`Requesting directory selection for project: ${projectId}`);
            const directoryHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'documents'
            });

            await this.setProjectDirectoryHandle(projectId, directoryHandle);
            this.logger.info(`Directory selected for project ${projectId}: ${directoryHandle.name}`);
            return directoryHandle;
        } catch (error) {
            if (error.name === 'AbortError') {
                this.logger.info('User cancelled directory selection');
                throw new Error('Directory selection was cancelled');
            }
            this.logger.error('Failed to select directory:', error);
            throw error;
        }
    }

    /**
     * Get metadata for a specific project
     */
    async getProjectMetadata(projectId) {
        const directoryHandle = await this.getProjectDirectoryHandle(projectId);
        if (!directoryHandle) {
            return null;
        }

        try {
            // Find the project file in the project's directory
            for await (const [name, handle] of directoryHandle.entries()) {
                if (handle.kind === 'file' && name.endsWith('.mermaiditor-project.json')) {
                    const file = await handle.getFile();
                    const content = await file.text();
                    const projectData = JSON.parse(content);
                    
                    if (projectData.metadata?.id === projectId) {
                        return {
                            id: projectData.metadata.id,
                            name: projectData.metadata.name,
                            theme: projectData.metadata.theme || 'default',
                            selectedFileId: projectData.metadata.selectedFileId,
                            lastModified: file.lastModified
                        };
                    }
                }
            }
            
            return null;
        } catch (error) {
            this.logger.error(`Error getting project metadata for ${projectId}:`, error);
            return null;
        }
    }

    /**
     * Create a new project (user will be prompted to select directory)
     */
    async createProject(projectId, projectName, initialFiles = {}) {
        // Ensure we have valid parameters
        if (!projectId) {
            throw new Error('Project ID is required');
        }
        if (!projectName) {
            throw new Error('Project name is required');
        }

        // Get or select directory for this project
        let directoryHandle = await this.getProjectDirectoryHandle(projectId);
        if (!directoryHandle) {
            // Prompt user to select directory for this project
            directoryHandle = await this.selectDirectoryForProject(projectId);
        }

        const filename = `${projectName}.mermaiditor-project.json`;
        
        try {
            const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            
            const fullProjectData = {
                metadata: {
                    id: projectId,
                    name: projectName,
                    theme: 'default',
                    selectedFileId: Object.keys(initialFiles)[0] || null,
                    createdAt: new Date().toISOString(),
                    modifiedAt: new Date().toISOString()
                },
                files: initialFiles
            };
            
            await writable.write(JSON.stringify(fullProjectData, null, 2));
            await writable.close();
            
            this.logger.info(`Created project: ${projectName}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to create project ${projectName}:`, error);
            throw error;
        }
    }

    /**
     * Get project data
     */
    async getProject(projectId) {
        const directoryHandle = await this.getProjectDirectoryHandle(projectId);
        if (!directoryHandle) {
            return null;
        }

        try {
            // Find the project file in the project's directory
            for await (const [name, handle] of directoryHandle.entries()) {
                if (handle.kind === 'file' && name.endsWith('.mermaiditor-project.json')) {
                    const file = await handle.getFile();
                    const content = await file.text();
                    const projectData = JSON.parse(content);
                    
                    if (projectData.metadata?.id === projectId) {
                        return projectData;
                    }
                }
            }
            
            this.logger.warn(`Project not found: ${projectId}`);
            return null;
        } catch (error) {
            this.logger.error(`Failed to get project ${projectId}:`, error);
            throw error;
        }
    }

    /**
     * Get project files
     */
    async getProjectFiles(projectId) {
        try {
            const project = await this.getProject(projectId);
            if (!project) return null;
            
            return project.files || {};
        } catch (error) {
            this.logger.error(`Failed to get project files for ${projectId}:`, error);
            return null; // Return null instead of throwing to prevent hanging
        }
    }

    /**
     * Update project metadata
     */
    async updateProjectMetadata(projectId, updates) {
        const directoryHandle = await this.getProjectDirectoryHandle(projectId);
        if (!directoryHandle) {
            this.logger.warn(`Cannot update project ${projectId}: no directory handle found`);
            return false;
        }

        try {
            const projectFile = await this._findProjectFile(projectId, directoryHandle);
            if (!projectFile) {
                this.logger.warn(`Project file not found: ${projectId}`);
                return false;
            }

            const file = await projectFile.handle.getFile();
            const content = await file.text();
            const projectData = JSON.parse(content);
            
            // Update metadata
            Object.assign(projectData.metadata, updates, {
                modifiedAt: new Date().toISOString()
            });
            
            const writable = await projectFile.handle.createWritable();
            await writable.write(JSON.stringify(projectData, null, 2));
            await writable.close();
            
            this.logger.debug(`Updated project ${projectId}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to update project ${projectId}:`, error);
            return false;
        }
    }

    /**
     * Delete a project
     */
    async deleteProject(projectId) {
        const directoryHandle = await this.getProjectDirectoryHandle(projectId);
        if (!directoryHandle) {
            this.logger.warn(`Cannot delete project ${projectId}: no directory handle found`);
            return false;
        }

        try {
            const projectFile = await this._findProjectFile(projectId, directoryHandle);
            if (!projectFile) {
                this.logger.warn(`Project not found for deletion: ${projectId}`);
                return false;
            }

            await directoryHandle.removeEntry(projectFile.name);
            
            // Clear the directory handle from storage
            await this.clearProjectDirectory(projectId);
            
            this.logger.info(`Deleted project: ${projectId}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to delete project ${projectId}:`, error);
            return false;
        }
    }

    /**
     * Save a file
     */
    async saveFile(projectId, fileData) {
        const directoryHandle = await this.getProjectDirectoryHandle(projectId);
        if (!directoryHandle) {
            throw new Error(`Cannot save file for project ${projectId}: no directory handle found`);
        }

        try {
            const projectFile = await this._findProjectFile(projectId, directoryHandle);
            if (!projectFile) {
                throw new Error(`Project not found: ${projectId}`);
            }

            // Save diagram content as separate .mmd file
            const diagramFileName = `${fileData.id}.mmd`;
            const diagramFileHandle = await directoryHandle.getFileHandle(diagramFileName, { create: true });
            const diagramWritable = await diagramFileHandle.createWritable();
            await diagramWritable.write(fileData.content || '');
            await diagramWritable.close();

            // Update project metadata (without storing content in project file)
            const file = await projectFile.handle.getFile();
            const content = await file.text();
            const projectData = JSON.parse(content);
            
            // Store file metadata without content
            const fileMetadata = {
                id: fileData.id,
                name: fileData.name,
                type: fileData.type,
                version: fileData.version,
                createdAt: fileData.createdAt,
                modifiedAt: fileData.modifiedAt
            };
            
            projectData.files[fileData.id] = fileMetadata;
            projectData.metadata.modifiedAt = new Date().toISOString();
            
            const projectWritable = await projectFile.handle.createWritable();
            await projectWritable.write(JSON.stringify(projectData, null, 2));
            await projectWritable.close();
            
            this.logger.debug(`Saved file ${fileData.name} as ${diagramFileName} in project ${projectId}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to save file ${fileData.id}:`, error);
            throw error;
        }
    }

    /**
     * Get a file
     */
    async getFile(projectId, fileId) {
        const directoryHandle = await this.getProjectDirectoryHandle(projectId);
        if (!directoryHandle) {
            throw new Error(`Cannot get file for project ${projectId}: no directory handle found`);
        }

        try {
            const projectFile = await this._findProjectFile(projectId, directoryHandle);
            if (!projectFile) {
                throw new Error(`Project not found: ${projectId}`);
            }

            const file = await projectFile.handle.getFile();
            const content = await file.text();
            const projectData = JSON.parse(content);
            
            const fileMetadata = projectData.files[fileId];
            if (!fileMetadata) {
                this.logger.warn(`File not found: ${fileId} in project ${projectId}`);
                return null;
            }

            // Read diagram content from separate .mmd file
            const diagramFileName = `${fileId}.mmd`;
            try {
                const diagramFileHandle = await directoryHandle.getFileHandle(diagramFileName);
                const diagramFile = await diagramFileHandle.getFile();
                const diagramContent = await diagramFile.text();
                
                // Combine metadata with content
                return {
                    ...fileMetadata,
                    content: diagramContent
                };
            } catch (diagramError) {
                this.logger.warn(`Diagram file ${diagramFileName} not found, returning metadata only`);
                return {
                    ...fileMetadata,
                    content: ''
                };
            }
        } catch (error) {
            this.logger.error(`Failed to get file ${fileId}:`, error);
            throw error;
        }
    }

    /**
     * Get all files for a project
     */
    async getFiles(projectId) {
        const directoryHandle = await this.getProjectDirectoryHandle(projectId);
        if (!directoryHandle) {
            throw new Error(`Cannot get files for project ${projectId}: no directory handle found`);
        }

        try {
            const projectFile = await this._findProjectFile(projectId, directoryHandle);
            if (!projectFile) {
                throw new Error(`Project not found: ${projectId}`);
            }

            const file = await projectFile.handle.getFile();
            const content = await file.text();
            const projectData = JSON.parse(content);
            
            const filesMetadata = Object.values(projectData.files || {});
            
            // Load content for each file from corresponding .mmd files
            const filesWithContent = await Promise.all(
                filesMetadata.map(async (fileMetadata) => {
                    const diagramFileName = `${fileMetadata.id}.mmd`;
                    try {
                        const diagramFileHandle = await directoryHandle.getFileHandle(diagramFileName);
                        const diagramFile = await diagramFileHandle.getFile();
                        const diagramContent = await diagramFile.text();
                        
                        return {
                            ...fileMetadata,
                            content: diagramContent
                        };
                    } catch (diagramError) {
                        this.logger.warn(`Diagram file ${diagramFileName} not found for file ${fileMetadata.id}`);
                        return {
                            ...fileMetadata,
                            content: ''
                        };
                    }
                })
            );
            
            return filesWithContent;
        } catch (error) {
            this.logger.error(`Failed to get files for project ${projectId}:`, error);
            throw error;
        }
    }

    /**
     * Delete a file
     */
    async deleteFile(projectId, fileId) {
        const directoryHandle = await this.getProjectDirectoryHandle(projectId);
        if (!directoryHandle) {
            throw new Error(`Cannot delete file for project ${projectId}: no directory handle found`);
        }

        try {
            const projectFile = await this._findProjectFile(projectId, directoryHandle);
            if (!projectFile) {
                throw new Error(`Project not found: ${projectId}`);
            }

            const file = await projectFile.handle.getFile();
            const content = await file.text();
            const projectData = JSON.parse(content);
            
            if (projectData.files[fileId]) {
                // Delete the diagram .mmd file
                const diagramFileName = `${fileId}.mmd`;
                try {
                    await directoryHandle.removeEntry(diagramFileName);
                    this.logger.debug(`Deleted diagram file ${diagramFileName}`);
                } catch (diagramError) {
                    this.logger.warn(`Could not delete diagram file ${diagramFileName}:`, diagramError);
                }

                // Remove from project metadata
                delete projectData.files[fileId];
                projectData.metadata.modifiedAt = new Date().toISOString();
                
                const writable = await projectFile.handle.createWritable();
                await writable.write(JSON.stringify(projectData, null, 2));
                await writable.close();
                
                this.logger.debug(`Deleted file ${fileId} from project ${projectId}`);
                return true;
            }
            
            return false;
        } catch (error) {
            this.logger.error(`Failed to delete file ${fileId}:`, error);
            throw error;
        }
    }

    /**
     * Delete entire project including all files from disk
     */
    async deleteProjectFiles(projectId) {
        const directoryHandle = await this.getProjectDirectoryHandle(projectId);
        if (!directoryHandle) {
            throw new Error(`Cannot delete project ${projectId}: no directory handle found`);
        }

        try {
            const projectFile = await this._findProjectFile(projectId, directoryHandle);
            if (!projectFile) {
                throw new Error(`Project not found: ${projectId}`);
            }

            const file = await projectFile.handle.getFile();
            const content = await file.text();
            const projectData = JSON.parse(content);
            
            // Delete all .mmd files
            const fileIds = Object.keys(projectData.files || {});
            for (const fileId of fileIds) {
                const diagramFileName = `${fileId}.mmd`;
                try {
                    await directoryHandle.removeEntry(diagramFileName);
                    this.logger.debug(`Deleted diagram file ${diagramFileName}`);
                } catch (diagramError) {
                    this.logger.warn(`Could not delete diagram file ${diagramFileName}:`, diagramError);
                }
            }
            
            // Delete the project file itself
            try {
                await directoryHandle.removeEntry(projectFile.name);
                this.logger.debug(`Deleted project file ${projectFile.name}`);
            } catch (projectFileError) {
                this.logger.warn(`Could not delete project file ${projectFile.name}:`, projectFileError);
            }
            
            // Clean up directory handle from memory and storage
            this.projectDirectories.delete(projectId);
            await directoryStorage.removeProjectDirectory(projectId);
            
            this.logger.info(`Deleted all files for project ${projectId}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to delete project files ${projectId}:`, error);
            throw error;
        }
    }

    /**
     * Export project data
     */
    async exportProject(projectId) {
        const directoryHandle = await this.getProjectDirectoryHandle(projectId);
        if (!directoryHandle) {
            throw new Error(`Cannot export project ${projectId}: no directory handle found`);
        }

        try {
            const projectFile = await this._findProjectFile(projectId, directoryHandle);
            if (!projectFile) {
                throw new Error(`Project not found: ${projectId}`);
            }

            const file = await projectFile.handle.getFile();
            const content = await file.text();
            const projectData = JSON.parse(content);
            
            // Get all files with content from .mmd files
            const filesWithContent = await this.getFiles(projectId);
            
            // Convert to export format
            const exportData = {
                id: projectData.metadata.id,
                name: projectData.metadata.name,
                files: filesWithContent,
                exportedAt: new Date().toISOString()
            };
            
            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            this.logger.error(`Failed to export project ${projectId}:`, error);
            throw error;
        }
    }

    /**
     * Helper method to find a project file by ID
     */
    async _findProjectFile(projectId, directoryHandle) {
        for await (const [name, handle] of directoryHandle.entries()) {
            if (handle.kind === 'file' && name.endsWith('.mermaiditor-project.json')) {
                try {
                    const file = await handle.getFile();
                    const content = await file.text();
                    const projectData = JSON.parse(content);
                    
                    if (projectData.metadata?.id === projectId) {
                        return { name, handle };
                    }
                } catch (error) {
                    this.logger.warn(`Failed to read project file ${name}:`, error);
                }
            }
        }
        return null;
    }

    /**
     * Get display name for this provider
     */
    getDisplayName() {
        return 'Local Folder';
    }

    /**
     * Get provider ID
     */
    getProviderId() {
        return 'fileSystem';
    }

    /**
     * Clear stored directory handle (useful when user wants to select a different folder)
     */
    async clearStoredDirectory() {
        try {
            await directoryStorage.clearDirectoryHandle();
            this.directoryHandle = null;
            this.isInitialized = false;
            this.logger.info('Cleared stored directory handle');
        } catch (error) {
            this.logger.error('Error clearing stored directory:', error);
        }
    }

    /**
     * Duplicate a project
     */
    async duplicateProject(sourceProjectId, newProjectId, newProjectName) {
        // Get directory handle for source project
        const sourceDirectoryHandle = await this.getProjectDirectoryHandle(sourceProjectId);
        if (!sourceDirectoryHandle) {
            this.logger.warn(`Cannot duplicate project ${sourceProjectId}: no directory handle found`);
            return false;
        }

        try {
            // Get source project data
            const sourceProjectFile = await this._findProjectFile(sourceProjectId, sourceDirectoryHandle);
            if (!sourceProjectFile) {
                this.logger.error(`Source project file not found: ${sourceProjectId}`);
                return false;
            }

            const sourceFile = await sourceProjectFile.handle.getFile();
            const sourceContent = await sourceFile.text();
            const sourceProjectData = JSON.parse(sourceContent);

            // Get all source files with content
            const sourceFiles = await this.getFiles(sourceProjectId);

            // Create new project metadata
            const newProjectData = {
                version: '2.0',
                metadata: {
                    id: newProjectId,
                    name: newProjectName,
                    storageProvider: 'fileSystem',
                    theme: sourceProjectData.metadata.theme || 'default',
                    createdAt: new Date().toISOString(),
                    modifiedAt: new Date().toISOString()
                },
                files: {}
            };

            // We'll need a directory handle for the new project
            // For filesystem provider, we need to ask the user to select a directory
            const newDirectoryHandle = await this.selectDirectoryForProject(newProjectId);
            
            // Create project file
            const newProjectFileName = `${newProjectName}.mermaiditor-project.json`;
            const newProjectFileHandle = await newDirectoryHandle.getFileHandle(newProjectFileName, { create: true });
            
            // Copy all files and update metadata
            for (const sourceFileData of sourceFiles) {
                // Generate new file ID for the duplicate
                const newFileId = sourceFileData.id; // Keep same IDs for simplicity, but could generate new ones
                
                // Save diagram content as separate .mmd file
                const diagramFileName = `${newFileId}.mmd`;
                const diagramFileHandle = await newDirectoryHandle.getFileHandle(diagramFileName, { create: true });
                const diagramWritable = await diagramFileHandle.createWritable();
                await diagramWritable.write(sourceFileData.content || '');
                await diagramWritable.close();

                // Add file metadata to project
                newProjectData.files[newFileId] = {
                    id: sourceFileData.id,
                    name: sourceFileData.name,
                    type: sourceFileData.type,
                    version: sourceFileData.version,
                    createdAt: sourceFileData.createdAt,
                    modifiedAt: new Date().toISOString()
                };
            }

            // Save project file
            const projectWritable = await newProjectFileHandle.createWritable();
            await projectWritable.write(JSON.stringify(newProjectData, null, 2));
            await projectWritable.close();

            this.logger.info(`Successfully duplicated project ${sourceProjectId} to ${newProjectId} in directory: ${newDirectoryHandle.name}`);
            return true;

        } catch (error) {
            this.logger.error(`Failed to duplicate project ${sourceProjectId}:`, error);
            return false;
        }
    }

    /**
     * Try to auto-initialize without user interaction
     * Returns true if successful, false if user interaction is needed
     */
    async tryAutoInitialize() {
        if (!FileSystemStorageProvider.isSupported()) {
            return false;
        }

        try {
            this.logger.info('Attempting auto-initialization from stored directory');
            this.directoryHandle = await directoryStorage.restoreDirectoryHandle();
            
            if (this.directoryHandle) {
                this.isInitialized = true;
                this.logger.info(`Auto-initialized with directory: ${this.directoryHandle.name}`);
                return true;
            }

            return false;
        } catch (error) {
            this.logger.error('Auto-initialization failed:', error);
            return false;
        }
    }
}