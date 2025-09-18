/**
 * ProjectManager - Handles project and file operations
 */
import { uuidv4 } from '../utils/uuid.js';
import { saveProject as saveProjectToStorage, getProject as getProjectFromStorage, deleteProject as deleteProjectFromStorage } from '../utils/storage.js';
import { compressProject, decompressProject } from '../utils/compression.js';

export class ProjectManager {
    constructor(templateManager) {
        this.templateManager = templateManager;
        this.selectedProject = null;
        this.fileVersion = null;
    }

    // Project management methods
    createProject(name) {
        const project = this.newProject(name);
        this.saveProject(project);
        this.openProject(project.id);
        return project;
    }

    newProject(name) {
        const projectId = uuidv4();
        const fileId = uuidv4();
        const project = { 
            id: projectId,
            name,
            diagrams: {},
            selectedFile: fileId,
        };
        
        if (name === "Default") {
            project.diagrams[fileId] = { id: fileId, name: 'README', content: this.templateManager.getReadmeContent() };
            this.templateManager.getTemplateNames().forEach(key => {
                const file = { id: uuidv4(), name: key, content: this.templateManager.getTemplate(key) };
                project.diagrams[file.id] = file;
            });
        } else {
            project.diagrams[fileId] = { id: fileId, name: 'Default', content: this.templateManager.getDefaultContent() };
        }
        return project;
    }

    saveProject(project) {
        saveProjectToStorage(project);
        this.selectedProject = project;
    }

    getProject(id) {
        return getProjectFromStorage(id);
    }

    openProject(id) {
        this.selectedProject = this.getProject(id);
        localStorage.setItem('selectedProject', this.selectedProject.id);
        return this.selectedProject;
    }

    deleteProject() {
        if (!this.selectedProject) return false;
        
        deleteProjectFromStorage(this.selectedProject.id);
        const projects = this.getProjects();
        if (projects.length > 0) {
            this.openProject(projects[0].id);
        } else {
            this.createProject('Default');
        }
        return true;
    }

    renameProject(newName) {
        if (!this.selectedProject) return false;
        
        this.selectedProject.name = newName;
        this.saveProject(this.selectedProject);
        return true;
    }

    duplicateProject(newName) {
        if (!this.selectedProject) return false;
        
        const project = { ...this.selectedProject };
        project.name = newName;
        project.id = uuidv4();
        this.saveProject(project);
        this.openProject(project.id);
        return project;
    }

    getProjects() {
        const projects = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('project-')) {
                const project = JSON.parse(localStorage.getItem(key));
                projects.push(project);
            }
        }
        return projects.sort((a, b) => a.name.localeCompare(b.name));
    }

    exportProject() {
        if (!this.selectedProject) return null;
        
        const project = this.getProject(this.selectedProject.id);
        return JSON.stringify(project, null, 2);
    }

    importProject(projectData) {
        const project = JSON.parse(projectData);
        
        // Check if a project with the same ID already exists
        const existingProject = this.getProject(project.id);
        
        if (existingProject) {
            return { conflict: true, project, existingProject };
        } else {
            // No conflict, just save the project
            this.saveProject(project);
            this.openProject(project.id);
            return { conflict: false, project };
        }
    }

    resolveImportConflict(project, action) {
        switch (action) {
            case 'overwrite':
                this.saveProject(project);
                this.openProject(project.id);
                break;
            case 'create-copy':
                project.id = uuidv4();
                project.name = `${project.name} (Copy)`;
                this.saveProject(project);
                this.openProject(project.id);
                break;
            default:
                return false;
        }
        return true;
    }

    // File management methods
    getSelectedFileId() {
        return this.selectedProject?.selectedFile;
    }

    setSelectedFile(fileId) {
        if (!this.selectedProject) return;
        
        this.selectedProject.selectedFile = fileId;
        this.saveProject(this.selectedProject);
    }

    createFile(name, content = null) {
        if (!this.selectedProject) return null;
        
        content = content || this.templateManager.getDefaultContent();
        const file = { id: uuidv4(), version: uuidv4(), name, content };
        this.saveFile(file);
        this.setSelectedFile(file.id);
        return file;
    }

    openFile(id) {
        if (!this.selectedProject) return null;
        
        // Reload before opening in case another editor has the project open
        this.selectedProject = this.getProject(this.selectedProject.id);
        const file = this.selectedProject.diagrams[id];
        if (!file) return null;
        
        this.fileVersion = file.version;
        this.setSelectedFile(id);
        return file;
    }

    saveFile(file) {
        if (!this.selectedProject) return false;
        
        // Reload before saving in case another editor has the project open
        this.selectedProject = this.getProject(this.selectedProject.id);
        file.version = uuidv4();
        this.selectedProject.diagrams[file.id] = file;
        this.fileVersion = file.version;
        this.saveProject(this.selectedProject);
        return true;
    }

    getFiles() {
        if (!this.selectedProject) return [];
        
        return Object.values(this.selectedProject.diagrams).sort((a, b) => a.name.localeCompare(b.name));
    }

    getFile(id) {
        if (!this.selectedProject) return null;
        
        return this.selectedProject.diagrams[id];
    }

    getFileFromStorage(id) {
        if (!this.selectedProject) return null;
        
        const project = this.getProject(this.selectedProject.id);
        return project.diagrams[id];
    }

    deleteFile(fileId = null) {
        if (!this.selectedProject) return false;
        
        fileId = fileId || this.getSelectedFileId();
        if (!fileId) return false;
        
        delete this.selectedProject.diagrams[fileId];
        this.saveProject(this.selectedProject);
        
        const files = this.getFiles();
        if (files.length > 0) {
            this.setSelectedFile(files[0].id);
            return files[0];
        } else {
            const newFile = this.createFile('Default');
            return newFile;
        }
    }

    renameFile(fileId, newName) {
        if (!this.selectedProject) return false;
        
        const file = this.getFile(fileId);
        if (!file) return false;
        
        file.name = newName;
        this.saveFile(file);
        return true;
    }

    duplicateFile(fileId, newName) {
        if (!this.selectedProject) return null;
        
        const file = this.getFile(fileId);
        if (!file) return null;
        
        const newFile = { ...file, id: uuidv4(), name: newName };
        this.saveFile(newFile);
        this.setSelectedFile(newFile.id);
        return newFile;
    }

    checkVersionConflict(fileId) {
        const file = this.getFile(fileId);
        const fileInStorage = this.getFileFromStorage(fileId);
        
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
    generateShareUrl() {
        if (!this.selectedProject) return null;
        
        const project = this.getProject(this.selectedProject.id);
        const compressed = compressProject(project);
        const baseUrl = window.location.href.split('?')[0];
        return `${baseUrl}?project=${compressed}`;
    }

    importFromUrl(projectData) {
        try {
            const sharedProject = decompressProject(projectData);
            return this.importProject(JSON.stringify(sharedProject));
        } catch (error) {
            throw new Error('Failed to import shared project: ' + error.message);
        }
    }

    // Theme management
    setTheme(theme) {
        if (!this.selectedProject) return false;
        
        this.selectedProject.theme = theme;
        this.saveProject(this.selectedProject);
        return true;
    }

    getTheme() {
        return this.selectedProject?.theme || 'default';
    }

    getSelectedProject() {
        return this.selectedProject;
    }

    openLastSelectedProject() {
        const selectedProjectId = localStorage.getItem('selectedProject');
        if (selectedProjectId) {
            const project = this.getProject(selectedProjectId);
            if (project) {
                this.openProject(selectedProjectId);
                return project;
            }
        }
        
        // No selected project, create or open default
        const projects = this.getProjects();
        if (projects.length > 0) {
            this.openProject(projects[0].id);
            return projects[0];
        } else {
            return this.createProject('Default');
        }
    }
}