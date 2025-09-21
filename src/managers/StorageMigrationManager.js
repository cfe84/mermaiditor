/**
 * StorageMigrationManager - Handles migration between storage versions
 */
import { uuidv4 } from '../utils/uuid.js';
import { ProjectReference } from '../models/Project.js';

export class StorageMigrationManager {
    constructor(logger) {
        this.logger = logger?.withContext('StorageMigrationManager') || console;
        this.currentVersion = 2;
        this.versionKey = 'mermaiditor-storage-version';
    }

    /**
     * Check if migration is needed and perform it
     */
    async performMigrationIfNeeded() {
        const currentStorageVersion = this.getCurrentStorageVersion();
        this.logger.info(`Current storage version: ${currentStorageVersion}, target version: ${this.currentVersion}`);

        if (currentStorageVersion < this.currentVersion) {
            this.logger.info(`Migration needed from version ${currentStorageVersion} to ${this.currentVersion}`);
            await this.runMigrations(currentStorageVersion);
        } else {
            this.logger.debug('No migration needed');
        }
    }

    /**
     * Get current storage version from localStorage
     */
    getCurrentStorageVersion() {
        const version = localStorage.getItem(this.versionKey);
        
        if (version === null) {
            // Check if there's any old project data
            const hasLegacyData = this.hasLegacyProjectData();
            return hasLegacyData ? 1 : this.currentVersion;
        }
        
        return parseInt(version, 10);
    }

    /**
     * Check if there's legacy project data (version 1 format)
     */
    hasLegacyProjectData() {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('project-') && !key.startsWith('project-ref-')) {
                try {
                    const data = localStorage.getItem(key);
                    const project = JSON.parse(data);
                    // Check if it has the old format structure
                    if (project.diagrams && !project.metadata) {
                        return true;
                    }
                } catch (error) {
                    this.logger.warn(`Failed to parse legacy project data for key ${key}:`, error);
                }
            }
        }
        return false;
    }

    /**
     * Run migrations incrementally from current version to target version
     */
    async runMigrations(fromVersion) {
        let currentVersion = fromVersion;

        while (currentVersion < this.currentVersion) {
            const nextVersion = currentVersion + 1;
            this.logger.info(`Running migration from version ${currentVersion} to ${nextVersion}`);
            
            try {
                switch (nextVersion) {
                    case 2:
                        await this.migrateV1ToV2();
                        break;
                    default:
                        this.logger.warn(`Unknown migration version: ${nextVersion}`);
                        break;
                }
                
                currentVersion = nextVersion;
                this.logger.info(`Successfully migrated to version ${nextVersion}`);
            } catch (error) {
                this.logger.error(`Migration to version ${nextVersion} failed:`, error);
                throw new Error(`Migration failed: ${error.message}`);
            }
        }

        // Update storage version
        localStorage.setItem(this.versionKey, this.currentVersion.toString());
        this.logger.info(`Migration completed. Storage version set to ${this.currentVersion}`);
    }

    /**
     * Migrate from version 1 (old format) to version 2 (ProjectReference format)
     */
    async migrateV1ToV2() {
        this.logger.info('Starting migration from v1 to v2...');
        
        const legacyProjects = this.findLegacyProjects();
        this.logger.info(`Found ${legacyProjects.length} legacy projects to migrate`);

        for (const legacyProject of legacyProjects) {
            try {
                await this.migrateLegacyProject(legacyProject);
            } catch (error) {
                this.logger.error(`Failed to migrate project ${legacyProject.key}:`, error);
                throw error;
            }
        }

        this.logger.info('v1 to v2 migration completed');
    }

    /**
     * Find all legacy projects in localStorage
     */
    findLegacyProjects() {
        const legacyProjects = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('project-') && !key.startsWith('project-ref-')) {
                try {
                    const projectId = key.replace('project-', '');
                    if (localStorage.getItem(`project-ref-${projectId}`)) {
                        // This is already a v2 project
                        continue;
                    }
                    const data = localStorage.getItem(key);
                    const project = JSON.parse(data);
                    
                    // Check if it's the old format (has diagrams but no metadata)
                    if (project.diagrams && !project.metadata) {
                        legacyProjects.push({
                            key,
                            projectId,
                            data: project
                        });
                    }
                } catch (error) {
                    this.logger.warn(`Failed to parse project data for key ${key}:`, error);
                }
            }
        }
        
        return legacyProjects;
    }

    /**
     * Migrate a single legacy project to the new format
     */
    async migrateLegacyProject(legacyProject) {
        const { key, projectId, data } = legacyProject;
        
        this.logger.debug(`Migrating project: ${data.name} (${projectId})`);

        // Convert old format to new format
        const newProjectData = {
            id: projectId,
            name: data.name || 'Unnamed Project',
            theme: data.theme || 'default',
            selectedFileId: data.selectedFile || null,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
            diagrams: {}
        };

        // Convert diagrams to files
        if (data.diagrams) {
            for (const [diagramId, diagram] of Object.entries(data.diagrams)) {
                newProjectData.diagrams[diagramId] = {
                    id: diagramId,
                    name: diagram.name || 'Untitled',
                    content: diagram.content || '',
                    version: diagram.version || uuidv4()
                };
            }
        }

        // Save in new format
        localStorage.setItem(key, JSON.stringify(newProjectData));

        // Create project reference
        const projectRef = {
            id: projectId,
            storageProvider: 'localStorage',
            storageProviderParameters: {},
            theme: data.theme || 'default',
            selectedFileId: newProjectData.selectedFileId
        };

        // Save project reference
        const refKey = `project-ref-${projectId}`;
        localStorage.setItem(refKey, JSON.stringify(projectRef));

        this.logger.debug(`Successfully migrated project ${data.name} and created reference ${refKey}`);
    }

    /**
     * Create a backup of current localStorage data before migration
     */
    createBackup() {
        const backup = {};
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                backup[key] = localStorage.getItem(key);
            }
        }
        
        const backupKey = `mermaiditor-backup-${timestamp}`;
        try {
            localStorage.setItem(backupKey, JSON.stringify(backup));
            this.logger.info(`Created backup: ${backupKey}`);
            return backupKey;
        } catch (error) {
            this.logger.warn('Failed to create backup due to storage limits:', error);
            return null;
        }
    }

    /**
     * Restore from backup (for testing/recovery)
     */
    restoreFromBackup(backupKey) {
        try {
            const backup = localStorage.getItem(backupKey);
            if (!backup) {
                throw new Error(`Backup not found: ${backupKey}`);
            }
            
            const data = JSON.parse(backup);
            
            // Clear current storage
            localStorage.clear();
            
            // Restore from backup
            for (const [key, value] of Object.entries(data)) {
                localStorage.setItem(key, value);
            }
            
            this.logger.info(`Restored from backup: ${backupKey}`);
        } catch (error) {
            this.logger.error(`Failed to restore from backup ${backupKey}:`, error);
            throw error;
        }
    }

    /**
     * Get migration status information
     */
    getMigrationStatus() {
        const currentVersion = this.getCurrentStorageVersion();
        const hasLegacyData = this.hasLegacyProjectData();
        const needsMigration = currentVersion < this.currentVersion;
        
        return {
            currentVersion,
            targetVersion: this.currentVersion,
            hasLegacyData,
            needsMigration,
            legacyProjects: needsMigration ? this.findLegacyProjects().length : 0
        };
    }
}