/**
 * ProjectManager - Manages project references and coordinates storage providers
 */
import { uuidv4 } from '../utils/uuid.js';
import { compressProject, decompressProject } from '../utils/compression.js';
import { Project, ProjectReference, File } from '../models/Project.js';
import { LocalStorageProvider } from '../storage/LocalStorageProvider.js';
import { StorageMigrationManager } from './StorageMigrationManager.js';
import { FileSystemStorageProvider } from '../storage/FileSystemStorageProvider.js';

export class ProjectManager {
    constructor(logger, templateManager) {
        this.logger = logger;
        this.templateManager = templateManager;
        this.selectedProjectReference = null;
        this.currentStorageProvider = null;
        this.fileVersion = null;
        
        // Storage providers registry
        this.storageProviders = new Map();
        this.registerStorageProvider('localStorage', new LocalStorageProvider());
        if (FileSystemStorageProvider.isSupported()) {
            this.registerStorageProvider('fileSystem', new FileSystemStorageProvider(this.logger));
        }
        
        // Initialize migration manager
        this.migrationManager = new StorageMigrationManager(logger);
    }

    /**
     * Initialize the ProjectManager (must be called after construction)
     * Performs any necessary data migrations
     */
    async initialize() {
        this.logger.debug('Initializing ProjectManager');
        try {
            await this.migrationManager.performMigrationIfNeeded();
            this.logger.debug('ProjectManager initialization completed');
        } catch (error) {
            this.logger.error('Failed to initialize ProjectManager:', error);
            throw error;
        }
    }

    /**
     * Get migration status for debugging
     */
    getMigrationStatus() {
        if (!this.migrationManager) {
            return { error: 'Migration manager not initialized' };
        }
        
        return {
            currentVersion: this.migrationManager.getCurrentStorageVersion(),
            targetVersion: this.migrationManager.currentVersion,
            hasLegacyData: this.migrationManager.hasLegacyProjectData()
        };
    }

    /**
     * Register a storage provider
     */
    registerStorageProvider(name, provider) {
        this.storageProviders.set(name, provider);
    }

    /**
     * Get storage provider by name
     */
    getStorageProvider(name) {
        return this.storageProviders.get(name);
    }

    /**
     * Get available storage providers for UI display
     */
    getAvailableStorageProviders() {
        const providers = [];
        for (const [id, provider] of this.storageProviders) {
            providers.push({
                id,
                name: provider.getDisplayName ? provider.getDisplayName() : id,
                supported: true
            });
        }
        return providers;
    }

    /**
     * Initialize a storage provider manually (for UI-triggered initialization)
     */
    async initializeStorageProvider(providerId) {
        const provider = this.storageProviders.get(providerId);
        if (!provider) {
            throw new Error(`Storage provider not found: ${providerId}`);
        }

        if (provider.initialize) {
            try {
                await provider.initialize();
                this.logger.info(`Manually initialized storage provider: ${providerId}`);
                return true;
            } catch (error) {
                this.logger.error(`Failed to initialize storage provider ${providerId}:`, error);
                throw error;
            }
        }
        
        return true; // Already initialized or doesn't need initialization
    }

    /**
     * Save project reference to localStorage (references are always stored locally)
     */
    _saveProjectReference(projectRef) {
        this.logger.debug(`Saving project reference: ${projectRef.id}`);
        localStorage.setItem(`project-ref-${projectRef.id}`, JSON.stringify(projectRef.toObject()));
    }

    /**
     * Get project reference from localStorage
     */
    _getProjectReference(id) {
        this.logger.debug(`Getting project reference: ${id}`);
        const refData = localStorage.getItem(`project-ref-${id}`);
        return refData ? ProjectReference.fromObject(JSON.parse(refData)) : null;
    }

    /**
     * Delete project reference from localStorage
     */
    _deleteProjectReference(id) {
        this.logger.debug(`Deleting project reference: ${id}`);
        localStorage.removeItem(`project-ref-${id}`);
    }

    /**
     * Get all project references
     */
    getProjectReferences() {
        this.logger.debug('Getting all project references');
        const references = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('project-ref-')) {
                try {
                    const refData = JSON.parse(localStorage.getItem(key));
                    references.push(ProjectReference.fromObject(refData));
                } catch (error) {
                    this.logger.error(`Error parsing project reference ${key}:`, error);
                }
            }
        }
        this.logger.debug(`Found ${references.length} project references`);
        return references.sort((a, b) => {
            // We'll need to get the project name for sorting, for now sort by ID
            if (a.id === null) {
                this.logger.error(`Project id is null: ${JSON.stringify(a)}`);
                return 0;
            }
            return a.id.localeCompare(b.id);
        });
    }

    /**
     * Get all accessible project references (filters out projects that can't be opened)
     */
    async getAccessibleProjectReferences() {
        this.logger.debug('Getting accessible project references');
        const allReferences = this.getProjectReferences();
        const accessibleReferences = [];

        for (const ref of allReferences) {
            try {
                const provider = this.storageProviders.get(ref.storageProvider);
                if (!provider) {
                    this.logger.warn(`Storage provider not found for project ${ref.id} / ${ref.name}: ${ref.storageProvider}`);
                    continue;
                }

                // For filesystem projects, check if we can get metadata (which requires directory handle)
                if (ref.storageProvider === 'fileSystem') {
                    const metadata = await provider.getProjectMetadata(ref.id);
                    if (!metadata) {
                        this.logger.warn(`Cannot access filesystem project ${ref.id} / ${ref.name}: no directory handle`);
                        ref.problem = true;
                        ref.name ||= ref.id;
                        continue;
                    }
                }

                accessibleReferences.push(ref);
            } catch (error) {
                this.logger.warn(`Project ${ref.id} not accessible: ${error.message}`);
            }
        }

        this.logger.debug(`Found ${accessibleReferences.length} accessible project references out of ${allReferences.length} total`);
        return accessibleReferences;
    }

    /**
     * Clean up orphaned project references (projects that can no longer be accessed)
     */
    async cleanupOrphanedReferences() {
        this.logger.debug('Cleaning up orphaned project references');
        const allReferences = this.getProjectReferences();
        const accessibleReferences = await this.getAccessibleProjectReferences();
        
        const accessibleIds = new Set(accessibleReferences.map(ref => ref.id));
        let cleanedCount = 0;

        for (const ref of allReferences) {
            if (!accessibleIds.has(ref.id)) {
                this.logger.info(`Removing orphaned project reference: ${ref.id}`);
                this._deleteProjectReference(ref.id);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            this.logger.info(`Cleaned up ${cleanedCount} orphaned project references`);
        }

        return cleanedCount;
    }

    async createProject(name, storageProviderName = 'localStorage', storageProviderParameters = {}) {
        this.logger.debug(`Creating project: ${name}`);
        
        const projectId = uuidv4();
        const fileId = uuidv4();
        
        // Create project reference
        const projectRef = new ProjectReference(
            projectId,
            name,
            storageProviderName,
            storageProviderParameters,
            'default',
            fileId
        );
        
        // Get storage provider
        const storageProvider = this.getStorageProvider(storageProviderName);
        if (!storageProvider) {
            throw new Error(`Storage provider '${storageProviderName}' not found`);
        }
        
        // Create initial files
        const initialFiles = {};
        if (name === "Default") {
            initialFiles[fileId] = {
                id: fileId,
                name: 'README',
                content: this.templateManager.getReadmeContent(),
                version: uuidv4()
            };
            
            this.templateManager.getTemplateNames().forEach(key => {
                const id = uuidv4();
                initialFiles[id] = {
                    id: id,
                    name: key,
                    content: this.templateManager.getTemplate(key),
                    version: uuidv4()
                };
            });
        } else {
            initialFiles[fileId] = {
                id: fileId,
                name: 'Default',
                content: this.templateManager.getDefaultContent(),
                version: uuidv4()
            };
        }
        
        // Create project in storage
        const success = await storageProvider.createProject(projectId, name, initialFiles);
        if (!success) {
            throw new Error('Failed to create project in storage');
        }
        
        // Save project reference
        this._saveProjectReference(projectRef);
        
        // Open the project
        await this.openProject(projectId);
        
        return projectRef;
    }

    async openProject(id) {
        this.logger.debug(`Opening project: ${id}`);
        
        // Get project reference
        const projectRef = this._getProjectReference(id);
        if (!projectRef) {
            throw new Error(`Project reference '${id}' not found`);
        }
        
        // Get storage provider
        const storageProvider = this.getStorageProvider(projectRef.storageProvider);
        if (!storageProvider) {
            throw new Error(`Storage provider '${projectRef.storageProvider}' not found`);
        }
        
        // Verify project exists in storage
        const projectMetadata = await storageProvider.getProjectMetadata(id);
        if (!projectMetadata) {
            throw new Error(`Project '${id}' not found in storage`);
        }
        
        this.selectedProjectReference = projectRef;
        this.currentStorageProvider = storageProvider;
        localStorage.setItem('selectedProjectReference', id);
        
        return projectRef;
    }

    async getProjectMetadata(id) {
        this.logger.debug(`Getting metadata for project: ${id}`);
        
        // Get project reference
        const projectRef = this._getProjectReference(id);
        if (!projectRef) {
            throw new Error(`Project reference '${id}' not found`);
        }
        
        // Get storage provider
        const storageProvider = this.getStorageProvider(projectRef.storageProvider);
        if (!storageProvider) {
            throw new Error(`Storage provider '${projectRef.storageProvider}' not found`);
        }
        
        // Verify project exists in storage
        const projectMetadata = await storageProvider.getProjectMetadata(id);
        return projectMetadata;
    }

    async deleteProject(deleteFiles = true) {
        this.logger.debug(`Deleting project: ${this.selectedProjectReference?.id}, deleteFiles: ${deleteFiles}`);
        if (!this.selectedProjectReference || !this.currentStorageProvider) return false;
        
        const projectId = this.selectedProjectReference.id;
        const isFilesystemProject = this.selectedProjectReference.storageProvider === 'fileSystem';
        
        if (isFilesystemProject && deleteFiles) {
            // Delete actual files from disk
            await this.currentStorageProvider.deleteProjectFiles(projectId);
        } else if (!isFilesystemProject) {
            // For non-filesystem projects, always delete from storage
            await this.currentStorageProvider.deleteProject(projectId);
        }
        
        // Always delete the project reference from localStorage
        this._deleteProjectReference(projectId);
        
        // Clear current selection to avoid referencing deleted project
        this.selectedProjectReference = null;
        this.currentStorageProvider = null;
        localStorage.removeItem('selectedProjectReference');
        
        // Open another project
        const accessibleReferences = await this.getAccessibleProjectReferences();
        if (accessibleReferences.length > 0) {
            // Open the first accessible project
            await this.openProject(accessibleReferences[0].id);
        } else {
            // No accessible projects, create a default one
            await this.createProject('Default');
        }
        
        return true;
    }

    async renameProject(newName) {
        this.logger.debug(`Renaming project to: ${newName}`);
        if (!this.selectedProjectReference || !this.currentStorageProvider) return false;

        this.selectedProjectReference = newName;
        this._saveProjectReference(this.selectedProjectReference);
        
        const success = await this.currentStorageProvider.updateProjectMetadata(
            this.selectedProjectReference.id,
            { name: newName }
        );
        
        return success;
    }

    async duplicateProject(newName, targetStorageProvider = null) {
        this.logger.debug(`Duplicating project to: ${newName} with storage: ${targetStorageProvider || 'same as source'}`);
        if (!this.selectedProjectReference || !this.currentStorageProvider) return false;
        
        const newProjectId = uuidv4();
        
        // Determine target storage provider
        const targetProvider = targetStorageProvider || this.selectedProjectReference.storageProvider;
        const targetStorageProviderInstance = this.getStorageProvider(targetProvider);
        
        if (!targetStorageProviderInstance) {
            throw new Error(`Target storage provider '${targetProvider}' not available`);
        }
        
        // Get source project data
        const sourceProjectData = await this.exportProject();
        if (!sourceProjectData) {
            throw new Error('Failed to export source project data');
        }
        
        const parsedData = JSON.parse(sourceProjectData);
        this.logger.debug(`Duplicating project: source has ${Array.isArray(parsedData.files) ? parsedData.files.length : Object.keys(parsedData.files || {}).length} files`);
        
        // Create project in target storage provider
        const newProjectRef = new ProjectReference(
            newProjectId,
            newName,
            targetProvider,
            null, // parameters will be set during creation
            this.selectedProjectReference.theme,
            null // will be set to first file
        );
        
        // Save project reference first
        this._saveProjectReference(newProjectRef);
        
        // Create project in target storage
        const success = await targetStorageProviderInstance.createProject(newProjectId, newName, {});
        
        if (!success) {
            // Remove reference if creation failed
            this._deleteProjectReference(newProjectId);
            return false;
        }
        
        // Import files from source
        let sourceFiles = parsedData.files || parsedData.diagrams;
        
        // Handle different export formats
        if (!Array.isArray(sourceFiles)) {
            // Convert object to array (localStorage format)
            sourceFiles = Object.values(sourceFiles || {});
        }
        
        this.logger.debug(`About to save ${sourceFiles.length} files to target storage`);
        
        for (const fileData of sourceFiles) {
            this.logger.debug(`Saving file: ${fileData.id || fileData.name} with content length: ${fileData.content?.length || 0}`);
            const file = File.fromObject({
                ...fileData,
                createdAt: new Date().toISOString(),
                modifiedAt: new Date().toISOString()
            });
            
            await targetStorageProviderInstance.saveFile(newProjectId, file.toObject());
        }
        
        // Open the new project
        await this.openProject(newProjectId);
        
        return true;
    }

    /**
     * Get all projects with their names (async because we need to fetch names from storage)
     */
    async getProjects(uiManager, retried = false) {
        this.logger.debug('Getting all projects');
        const references = await this.getAccessibleProjectReferences();
        const projects = [];
        
        for (const ref of references) {
            const storageProvider = this.getStorageProvider(ref.storageProvider);
            if (storageProvider) {
                let metadata;
                try {
                    metadata = await storageProvider.getProjectMetadata(ref.id);
                } catch (error) {
                    if (error.message.indexOf(`User activation is required`) >= 0 && !retried) {
                        this.logger.warn(`User activation required to access project ${ref.id}, prompting user.`);
                        // We wrap the callback for that method in a user activation.
                        return await uiManager.requestUserAccessPromptAsync(() => this.getProjects(uiManager, true));
                    }
                    this.logger.error(`Error retrieving project metadata:`, error);
                }
                if (metadata) {
                    let name = metadata.name;
                    if (!name) {
                        this.logger.warn(`Project ${ref.id} has missing name, using fallback`);
                        name = `Project ${ref.id}`;
                    }
                    projects.push({
                        id: ref.id,
                        name: `${storageProvider.getIcon()} ${name}`, // Use the corrected name variable
                        reference: ref
                    });
                } else {
                    this.logger.warn(`Could not get metadata for project ${ref.id}`);
                    projects.push({
                        id: ref.id,
                        name: `⚠️` + (ref.name || `Project ${ref.id}`) + ` (cannot access)`,
                        reference: ref,
                        problem: true,
                    });
                }
            } else {
                this.logger.warn(`Storage provider ${ref.storageProvider} not found for project ${ref.id}`);
            }
        }
        
        return projects.sort((a, b) => {
            const nameA = a.name || '';
            const nameB = b.name || '';
            return nameA.localeCompare(nameB);
        });
    }

    async exportProject() {
        this.logger.debug(`Exporting project: ${this.selectedProjectReference?.id}`);
        if (!this.selectedProjectReference || !this.currentStorageProvider) return null;
        
        return await this.currentStorageProvider.exportProject(this.selectedProjectReference.id);
    }

    async importProject(projectData) {
        this.logger.debug('Importing project');
        
        // Try to parse and get project info
        let projectInfo;
        try {
            const parsed = JSON.parse(projectData);
            projectInfo = { id: parsed.id, name: parsed.name };
        } catch (error) {
            throw new Error('Invalid project data');
        }
        
        // Check if a project reference with the same ID already exists
        const existingRef = this._getProjectReference(projectInfo.id);
        
        if (existingRef) {
            return { conflict: true, projectInfo, existingRef };
        } else {
            // No conflict, import the project
            const localStorage = this.getStorageProvider('localStorage');
            const result = await localStorage.importProject(projectData);
            
            // Create project reference
            const projectRef = new ProjectReference(
                result.projectId,
                parsed.name,
                'localStorage',
                {},
                'default',
                null
            );
            
            this._saveProjectReference(projectRef);
            await this.openProject(result.projectId);
            
            return { conflict: false, projectRef };
        }
    }

    async resolveImportConflict(projectData, action) {
        const parsed = JSON.parse(projectData);
        
        switch (action) {
            case 'overwrite':
                this.logger.debug(`Overwriting project during import: ${parsed.id}`);
                // Delete existing reference and project
                this._deleteProjectReference(parsed.id);
                const localStorage = this.getStorageProvider('localStorage');
                await localStorage.deleteProject(parsed.id);
                
                // Import as new
                return await this.importProject(projectData);
                
            case 'create-copy':
                this.logger.debug('Creating a copy of project during import');
                // Change ID and import as new
                parsed.id = uuidv4();
                parsed.name = `${parsed.name} (Copy)`;
                return await this.importProject(JSON.stringify(parsed));
                
            default:
                return false;
        }
    }

    /**
     * Open a folder and discover projects within it
     */
    async openFolder() {
        this.logger.debug('Opening folder to discover projects');
        
        const fileSystemProvider = this.getStorageProvider('fileSystem');
        if (!fileSystemProvider) {
            throw new Error('File system storage provider not available');
        }

        const discovery = await fileSystemProvider.discoverProjectsInDirectory();
        if (!discovery) {
            // User cancelled
            return null;
        }

        const { projects, directoryHandle } = discovery;
        
        if (projects.length === 0) {
            throw new Error('No Mermaiditor projects found in the selected folder');
        }

        if (projects.length === 1) {
            // Only one project, open it directly
            const project = projects[0];
            await fileSystemProvider.openDiscoveredProject(project);
            
            // Create project reference if it doesn't exist
            let projectRef = this._getProjectReference(project.id);
            if (!projectRef) {
                projectRef = new ProjectReference(
                    project.id,
                    project.name,
                    'fileSystem',
                    {},
                    'default',
                    null
                );
                this._saveProjectReference(projectRef);
            }
            
            await this.openProject(project.id);
            return { selectedProject: project, allProjects: projects };
        }

        // Multiple projects found, return them for user selection
        return { selectedProject: null, allProjects: projects, directoryHandle };
    }

    /**
     * Open a specific project from a list of discovered projects
     */
    async openProjectFromFolder(discoveredProject, directoryHandle) {
        this.logger.debug(`Opening project from folder: ${discoveredProject.name}`);
        
        const fileSystemProvider = this.getStorageProvider('fileSystem');
        if (!fileSystemProvider) {
            throw new Error('File system storage provider not available');
        }

        // Set the directory handle and open the project
        discoveredProject.directoryHandle = directoryHandle;
        await fileSystemProvider.openDiscoveredProject(discoveredProject);
        
        // Create project reference if it doesn't exist
        let projectRef = this._getProjectReference(discoveredProject.id);
        if (!projectRef) {
            projectRef = new ProjectReference(
                discoveredProject.id,
                discoveredProject.name,
                'fileSystem',
                {},
                'default',
                null
            );
            this._saveProjectReference(projectRef);
        }
        
        await this.openProject(discoveredProject.id);
        return discoveredProject;
    }

    // File operations (delegated to current storage provider)
    getSelectedFileId() {
        return this.selectedProjectReference?.selectedFileId;
    }

    async setSelectedFile(fileId) {
        this.logger.debug(`Setting selected file: ${fileId}`);
        if (!this.selectedProjectReference) return;
        
        this.selectedProjectReference.selectedFileId = fileId;
        this._saveProjectReference(this.selectedProjectReference);
    }

    async createFile(name, content = null) {
        const projectName = this.selectedProjectReference?.id || 'no-project';
        this.logger.debug(`[${projectName}] Creating file: ${name}`);
        if (!this.selectedProjectReference || !this.currentStorageProvider) return null;
        
        content = content || this.templateManager.getDefaultContent();
        const file = new File(uuidv4(), name, content, uuidv4());
        
        const success = await this.currentStorageProvider.saveFile(
            this.selectedProjectReference.id,
            file.toObject()
        );
        
        if (!success) return null;
        
        // Set the file version to match the newly created file
        this.fileVersion = file.version;
        await this.setSelectedFile(file.id);
        return file;
    }

    async openFile(id) {
        const projectName = this.selectedProjectReference?.id || 'no-project';
        this.logger.debug(`[${projectName}] Opening file: ${id}`);
        if (!this.selectedProjectReference || !this.currentStorageProvider) return null;
        
        const fileData = await this.currentStorageProvider.getFile(
            this.selectedProjectReference.id,
            id
        );
        
        if (!fileData) return null;
        
        const file = File.fromObject(fileData);
        this.fileVersion = file.version;
        await this.setSelectedFile(id);
        
        return file;
    }

    async saveFile(file) {
        const projectName = this.selectedProjectReference?.id || 'no-project';
        this.logger.debug(`[${projectName}] Saving file: ${file.name}`);
        if (!this.selectedProjectReference || !this.currentStorageProvider) return false;
        
        // Update version
        file.version = uuidv4();
        this.fileVersion = file.version;
        
        const success = await this.currentStorageProvider.saveFile(
            this.selectedProjectReference.id,
            file.toObject()
        );
        
        return success;
    }

    async getFiles() {
        this.logger.debug('Getting all files');
        if (!this.selectedProjectReference || !this.currentStorageProvider) return [];
        
        const filesData = await this.currentStorageProvider.getProjectFiles(
            this.selectedProjectReference.id
        );
        
        if (!filesData) return [];
        
        return Object.values(filesData)
            .map(fileData => File.fromObject(fileData))
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    async getFile(id) {
        this.logger.debug(`Getting file: ${id}`);
        if (!this.selectedProjectReference || !this.currentStorageProvider) return null;
        
        const fileData = await this.currentStorageProvider.getFile(
            this.selectedProjectReference.id,
            id
        );
        
        return fileData ? File.fromObject(fileData) : null;
    }

    async getFileFromStorage(id) {
        // Same as getFile since we're already using storage
        return await this.getFile(id);
    }

    async deleteFile(fileId = null) {
        this.logger.debug(`Deleting file: ${fileId}`);
        if (!this.selectedProjectReference || !this.currentStorageProvider) return false;
        
        fileId = fileId || this.getSelectedFileId();
        if (!fileId) return false;
        
        await this.currentStorageProvider.deleteFile(this.selectedProjectReference.id, fileId);
        
        const files = await this.getFiles();
        if (files.length > 0) {
            await this.setSelectedFile(files[0].id);
            // Get the full file with content
            return await this.getFile(files[0].id);
        } else {
            const newFile = await this.createFile('Default');
            return newFile;
        }
    }

    async renameFile(fileId, newName) {
        this.logger.debug(`Renaming file to: ${newName}`);
        if (!this.selectedProjectReference || !this.currentStorageProvider) return false;
        
        const file = await this.getFile(fileId);
        if (!file) return false;
        
        file.name = newName;
        return await this.saveFile(file);
    }

    async duplicateFile(fileId, newName) {
        this.logger.debug(`Duplicating file to: ${newName}`);
        if (!this.selectedProjectReference || !this.currentStorageProvider) return null;
        
        const file = await this.getFile(fileId);
        if (!file) return null;
        
        const newFile = new File(uuidv4(), newName, file.content, uuidv4());
        const success = await this.saveFile(newFile);
        if (!success) return null;
        
        await this.setSelectedFile(newFile.id);
        return newFile;
    }

    async checkVersionConflict(fileId) {
        this.logger.debug(`Checking version conflict for file: ${fileId}`);
        const file = await this.getFile(fileId);
        const fileInStorage = await this.getFileFromStorage(fileId);
        
        if (fileInStorage && fileInStorage.version !== this.fileVersion) {
            return {
                conflict: true,
                fileName: file.name,
                storageVersion: fileInStorage.version,
                editorVersion: this.fileVersion
            };
        }
        return { conflict: false };
    }

    // Project sharing methods
    async generateShareUrl() {
        if (!this.selectedProjectReference || !this.currentStorageProvider) return null;
        
        const projectData = await this.currentStorageProvider.exportProject(this.selectedProjectReference.id);
        if (!projectData) return null;
        
        const compressed = compressProject(JSON.parse(projectData));
        const baseUrl = window.location.href.split('?')[0];
        return `${baseUrl}?project=${compressed}`;
    }

    async importFromUrl(projectData) {
        try {
            const sharedProject = decompressProject(projectData);
            return await this.importProject(JSON.stringify(sharedProject));
        } catch (error) {
            throw new Error('Failed to import shared project: ' + error.message);
        }
    }

    // Theme management
    async setTheme(theme) {
        if (!this.selectedProjectReference) return false;
        
        this.selectedProjectReference.theme = theme;
        this._saveProjectReference(this.selectedProjectReference);
        return true;
    }

    getTheme() {
        return this.selectedProjectReference?.theme || 'default';
    }

    getSelectedProject() {
        return this.selectedProjectReference;
    }

    getSelectedProjectMetadata() {
        return this.currentStorageProvider.getProjectMetadata(this.selectedProjectReference.id);
    }

    async openLastSelectedProject() {
        this.logger.debug('Opening last selected project');
        const selectedProjectReferenceId = localStorage.getItem('selectedProjectReference');
        this.logger.debug(`Last selected project reference ID: ${selectedProjectReferenceId}`);
        
        if (selectedProjectReferenceId) {
            const projectRef = this._getProjectReference(selectedProjectReferenceId);
            if (projectRef) {
                try {
                    await this.openProject(selectedProjectReferenceId);
                    return projectRef;
                } catch (error) {
                    this.logger.error('Error opening last selected project:', error);
                }
            }
        }
        
        // No selected project, create or open default
        const projects = (await this.getProjects()).filter(p => !p.problem);
        if (projects.length > 0) {
            await this.openProject(projects[0].id);
            return projects[0].reference;
        } else {
            return await this.createProject('Default');
        }
    }
}