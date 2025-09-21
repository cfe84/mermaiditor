/**
 * LocalStorageProvider - Implementation of IStorageProvider for browser localStorage
 */
import { IStorageProvider } from './IStorageProvider.js';
import { uuidv4 } from '../utils/uuid.js';

export class LocalStorageProvider extends IStorageProvider {
    constructor() {
        super();
    }

    async getProjectMetadata(projectId) {
        try {
            const projectData = localStorage.getItem(`project-${projectId}`);
            if (!projectData) return null;
            
            const project = JSON.parse(projectData);
            return { name: project.name };
        } catch (error) {
            console.error('Error getting project metadata:', error);
            return null;
        }
    }

    async createProject(projectId, projectName, initialFiles = {}) {
        try {
            const project = {
                id: projectId,
                name: projectName,
                diagrams: initialFiles
            };
            
            localStorage.setItem(`project-${projectId}`, JSON.stringify(project));
            return true;
        } catch (error) {
            console.error('Error creating project:', error);
            return false;
        }
    }

    async updateProjectMetadata(projectId, updates) {
        try {
            const projectData = localStorage.getItem(`project-${projectId}`);
            if (!projectData) return false;
            
            const project = JSON.parse(projectData);
            if (updates.name !== undefined) {
                project.name = updates.name;
            }
            
            localStorage.setItem(`project-${projectId}`, JSON.stringify(project));
            return true;
        } catch (error) {
            console.error('Error updating project metadata:', error);
            return false;
        }
    }

    async deleteProject(projectId) {
        try {
            localStorage.removeItem(`project-${projectId}`);
            return true;
        } catch (error) {
            console.error('Error deleting project:', error);
            return false;
        }
    }

    async getProjectFiles(projectId) {
        try {
            const projectData = localStorage.getItem(`project-${projectId}`);
            if (!projectData) return null;
            
            const project = JSON.parse(projectData);
            return project.diagrams || {};
        } catch (error) {
            console.error('Error getting project files:', error);
            return null;
        }
    }

    async getFile(projectId, fileId) {
        try {
            const files = await this.getProjectFiles(projectId);
            if (!files) return null;
            
            return files[fileId] || null;
        } catch (error) {
            console.error('Error getting file:', error);
            return null;
        }
    }

    async saveFile(projectId, file) {
        try {
            const projectData = localStorage.getItem(`project-${projectId}`);
            if (!projectData) return false;
            
            const project = JSON.parse(projectData);
            if (!project.diagrams) {
                project.diagrams = {};
            }
            
            // Add version if not present
            if (!file.version) {
                file.version = uuidv4();
            }
            
            project.diagrams[file.id] = file;
            localStorage.setItem(`project-${projectId}`, JSON.stringify(project));
            return true;
        } catch (error) {
            console.error('Error saving file:', error);
            return false;
        }
    }

    async deleteFile(projectId, fileId) {
        try {
            const projectData = localStorage.getItem(`project-${projectId}`);
            if (!projectData) return false;
            
            const project = JSON.parse(projectData);
            if (project.diagrams && project.diagrams[fileId]) {
                delete project.diagrams[fileId];
                localStorage.setItem(`project-${projectId}`, JSON.stringify(project));
            }
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }

    async duplicateProject(sourceProjectId, newProjectId, newProjectName) {
        try {
            const sourceData = localStorage.getItem(`project-${sourceProjectId}`);
            if (!sourceData) return false;
            
            const sourceProject = JSON.parse(sourceData);
            const newProject = {
                ...sourceProject,
                id: newProjectId,
                name: newProjectName
            };
            
            localStorage.setItem(`project-${newProjectId}`, JSON.stringify(newProject));
            return true;
        } catch (error) {
            console.error('Error duplicating project:', error);
            return false;
        }
    }

    async exportProject(projectId) {
        try {
            const projectData = localStorage.getItem(`project-${projectId}`);
            if (!projectData) return null;
            
            return projectData;
        } catch (error) {
            console.error('Error exporting project:', error);
            return null;
        }
    }

    async importProject(projectData) {
        try {
            const project = JSON.parse(projectData);
            const projectId = project.id;
            
            localStorage.setItem(`project-${projectId}`, projectData);
            return {
                projectId: projectId,
                projectName: project.name
            };
        } catch (error) {
            console.error('Error importing project:', error);
            throw new Error('Invalid project data');
        }
    }
}