/**
 * IStorageProvider - Interface for project storage operations
 * 
 * This interface defines all the operations needed to store and retrieve
 * projects and their files from a storage backend (localStorage, cloud, etc.)
 */

export class IStorageProvider {
    getIcon() {
        throw new Error("not implemented")
    }

    /**
     * Get project metadata (name, etc.) without loading full content
     * @param {string} projectId - The project identifier
     * @returns {Promise<{name: string} | null>} Project metadata or null if not found
     */
    async getProjectMetadata(projectId) {
        throw new Error('getProjectMetadata must be implemented');
    }

    /**
     * Create a new project with initial content
     * @param {string} projectId - The project identifier
     * @param {string} projectName - The project name
     * @param {{[fileId: string]: {id: string, name: string, content: string}}} initialFiles - Initial files
     * @returns {Promise<boolean>} Success status
     */
    async createProject(projectId, projectName, initialFiles = {}) {
        throw new Error('createProject must be implemented');
    }

    /**
     * Update project metadata (name, etc.)
     * @param {string} projectId - The project identifier
     * @param {{name?: string}} updates - Updates to apply
     * @returns {Promise<boolean>} Success status
     */
    async updateProjectMetadata(projectId, updates) {
        throw new Error('updateProjectMetadata must be implemented');
    }

    /**
     * Delete an entire project and all its files
     * @param {string} projectId - The project identifier
     * @returns {Promise<boolean>} Success status
     */
    async deleteProject(projectId) {
        throw new Error('deleteProject must be implemented');
    }

    /**
     * Get all files in a project
     * @param {string} projectId - The project identifier
     * @returns {Promise<{[fileId: string]: {id: string, name: string, content: string, version?: string}}|null>} Files map or null if project not found
     */
    async getProjectFiles(projectId) {
        throw new Error('getProjectFiles must be implemented');
    }

    /**
     * Get a specific file from a project
     * @param {string} projectId - The project identifier
     * @param {string} fileId - The file identifier
     * @returns {Promise<{id: string, name: string, content: string, version?: string}|null>} File or null if not found
     */
    async getFile(projectId, fileId) {
        throw new Error('getFile must be implemented');
    }

    /**
     * Create or update a file in a project
     * @param {string} projectId - The project identifier
     * @param {{id: string, name: string, content: string, version?: string}} file - The file to save
     * @returns {Promise<boolean>} Success status
     */
    async saveFile(projectId, file) {
        throw new Error('saveFile must be implemented');
    }

    /**
     * Delete a file from a project
     * @param {string} projectId - The project identifier
     * @param {string} fileId - The file identifier
     * @returns {Promise<boolean>} Success status
     */
    async deleteFile(projectId, fileId) {
        throw new Error('deleteFile must be implemented');
    }

    /**
     * Duplicate a project with a new ID
     * @param {string} sourceProjectId - The source project identifier
     * @param {string} newProjectId - The new project identifier
     * @param {string} newProjectName - The new project name
     * @returns {Promise<boolean>} Success status
     */
    async duplicateProject(sourceProjectId, newProjectId, newProjectName) {
        throw new Error('duplicateProject must be implemented');
    }

    /**
     * Export project data for sharing/backup
     * @param {string} projectId - The project identifier
     * @returns {Promise<string|null>} Serialized project data or null if not found
     */
    async exportProject(projectId) {
        throw new Error('exportProject must be implemented');
    }

    /**
     * Import project data from external source
     * @param {string} projectData - Serialized project data
     * @returns {Promise<{projectId: string, projectName: string}>} Import result
     */
    async importProject(projectData) {
        throw new Error('importProject must be implemented');
    }
}