/**
 * App.js - Main application controller that coordinates all managers
 */
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11.6.0/dist/mermaid.esm.min.mjs';
import { TemplateManager } from './managers/TemplateManager.js';
import { ProjectManager } from './managers/ProjectManager.js';
import { UIManager } from './managers/UIManager.js';
import { EditorManager } from './managers/EditorManager.js';
import { DiagramRenderer } from './managers/DiagramRenderer.js';
import { ExportManager } from './managers/ExportManager.js';
import { ViewportManager } from './managers/ViewportManager.js';
import { Logger } from './Logger.js';

class MermaiditorApp {
    constructor() {
        this.managers = {};
        this.isInitialized = false;
    }

    async initialize() {
        try {
            this.logger = new Logger(Logger.LogLevel.DEBUG);
            this.logger.info(`Initializing Mermaiditor`);

            this.loadDependencies();
            
            // Initialize ProjectManager (this will run migrations if needed)
            await this.managers.project.initialize();
            
            this.setupManagerInteractions();
            
            await this.managers.project.openLastSelectedProject();

            await this.managers.ui.loadProjects();
            await this.managers.ui.loadFiles();
            this.managers.ui.loadThemes();

            const currentTheme = this.managers.project.getTheme();
            this.managers.renderer.setTheme(currentTheme);

            // Load the last opened file
            await this.loadCurrentFile();

            // Check for shared projects in URL
            setTimeout(async () => {
                await this.managers.ui.checkForSharedProject();
            }, 500);

            this.isInitialized = true;
            console.log('Mermaiditor initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Mermaiditor:', error);
            alert('Failed to initialize the application: ' + error.message);
        }
    }

    loadDependencies() {
            this.logger.debug(`Loading dependencies`);
            this.managers.template = new TemplateManager();
            this.managers.project = new ProjectManager(this.logger.withContext('ProjectManager'), this.managers.template);
            this.managers.viewport = new ViewportManager(this.logger.withContext('ViewportManager'));
            this.managers.renderer = new DiagramRenderer(this.logger.withContext('DiagramRenderer'),mermaid);
            this.managers.export = new ExportManager(this.managers.viewport);
            this.managers.editor = new EditorManager(this.managers.project);
            this.managers.ui = new UIManager(this.managers.project, this.managers.template, this.managers.viewport);
    }

    setupManagerInteractions() {
        this.logger.debug(`Setting up manager interactions`);
        // Editor changes trigger diagram rendering
        this.managers.editor.setOnChangeCallback(async () => {
            const content = this.managers.editor.getContent();
            await this.managers.renderer.renderDiagram(content);
        });
        this.managers.ui.setProjectChangeCallback((project) => {
            this.onProjectChanged(project);
        });
        this.managers.ui.setFileChangeCallback((file) => {
            this.onFileChanged(file);
        });
        this.managers.ui.setThemeChangeCallback((theme) => {
            this.onThemeChanged(theme);
        });
        this.managers.renderer.setOnLoadedCallback(() => {
            this.managers.viewport.resetZoom();
        });
    }

    async onProjectChanged(project) {
        if (project) {
            const theme = this.managers.project.getTheme();
            this.managers.renderer.setTheme(theme);
            await this.loadCurrentFile();
        }
    }

    async onFileChanged(file) {
        if (file) {
            const currentTheme = this.managers.project.getTheme();
            this.managers.renderer.setTheme(currentTheme);
            this.managers.editor.loadFile(file);
        }
    }

    async onThemeChanged(theme) {
        this.managers.renderer.setTheme(theme);
        const content = this.managers.editor.getContent();
        if (content) {
            await this.managers.renderer.renderDiagram(content);
        }
    }

    async loadCurrentFile() {
        const fileId = this.managers.project.getSelectedFileId();
        if (fileId) {
            const file = await this.managers.project.openFile(fileId);
            if (file) {
                await this.onFileChanged(file);
            }
        } else {
            // No file selected, create a default one
            const files = await this.managers.project.getFiles();
            if (files.length > 0) {
                const file = await this.managers.project.openFile(files[0].id);
                if (file) {
                    await this.onFileChanged(file);
                }
            }
        }
    }

    // Public API for potential external integrations
    getManager(name) {
        return this.managers[name];
    }

    async renderCurrentDiagram() {
        const content = this.managers.editor.getContent();
        return await this.managers.renderer.renderDiagram(content);
    }

    exportCurrentDiagram() {
        return this.managers.export.triggerDownload();
    }

    copyCurrentDiagram() {
        return this.managers.export.triggerCopy();
    }

    resetViewport() {
        this.managers.viewport.resetZoom();
    }

    getCurrentProject() {
        return this.managers.project.getSelectedProject();
    }

    async getCurrentFile() {
        const fileId = this.managers.project.getSelectedFileId();
        return await this.managers.project.getFile(fileId);
    }
}

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    window.mermaiditorApp = new MermaiditorApp();
    await window.mermaiditorApp.initialize();
});