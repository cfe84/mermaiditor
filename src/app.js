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

class MermaiditorApp {
    constructor() {
        this.managers = {};
        this.isInitialized = false;
    }

    async initialize() {
        try {
            // Initialize managers in dependency order
            this.managers.template = new TemplateManager();
            this.managers.project = new ProjectManager(this.managers.template);
            this.managers.viewport = new ViewportManager();
            this.managers.renderer = new DiagramRenderer(mermaid);
            this.managers.export = new ExportManager(this.managers.viewport);
            this.managers.editor = new EditorManager(this.managers.project);
            this.managers.ui = new UIManager(this.managers.project, this.managers.template);

            // Wire up the interactions between managers
            this.setupManagerInteractions();

            // Open the last selected project or create default
            this.managers.project.openLastSelectedProject();

            // Initialize the UI
            this.managers.ui.loadProjects();
            this.managers.ui.loadFiles();
            this.managers.ui.loadThemes();

            // Set initial theme from current project
            const currentTheme = this.managers.project.getTheme();
            this.managers.renderer.setTheme(currentTheme);

            // Load the current file in the editor
            await this.loadCurrentFile();

            // After loading the file, render the initial diagram (like original code does)
            const content = this.managers.editor.getContent();
            if (content) {
                // Set up callback for initial zoom reset
                this.managers.renderer.setOnLoadedCallback(() => {
                    this.managers.viewport.resetZoom();
                    setTimeout(() => this.managers.viewport.centerDiagram(), 150);
                });
                window.onload = () => {
                    this.managers.renderer.renderDiagram(content);
                };
            }

            // Check for shared projects in URL
            setTimeout(() => {
                this.managers.ui.checkForSharedProject();
            }, 500);

            this.isInitialized = true;
            console.log('Mermaiditor initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Mermaiditor:', error);
            alert('Failed to initialize the application: ' + error.message);
        }
    }

    setupManagerInteractions() {
        // Editor changes trigger diagram rendering (like original onChangeAsync)
        this.managers.editor.setOnChangeCallback(async () => {
            const content = this.managers.editor.getContent();
            await this.managers.renderer.renderDiagram(content);
        });

        // UI callbacks for project/file/theme changes
        this.managers.ui.setProjectChangeCallback((project) => {
            this.onProjectChanged(project);
        });

        this.managers.ui.setFileChangeCallback((file) => {
            this.onFileChanged(file);
        });

        this.managers.ui.setThemeChangeCallback((theme) => {
            this.onThemeChanged(theme);
        });
    }

    async onProjectChanged(project) {
        if (project) {
            // Set theme for renderer
            const theme = this.managers.project.getTheme();
            this.managers.renderer.setTheme(theme);
            
            // Load the current file
            this.loadCurrentFile();
        }
    }

    async onFileChanged(file) {
        if (file) {
            // Ensure the current theme is applied before rendering
            const currentTheme = this.managers.project.getTheme();
            this.managers.renderer.setTheme(currentTheme);
            
            // Set up zoom reset callback BEFORE loading file (like original: onloaded = resetZoom)
            this.managers.renderer.setOnLoadedCallback(() => {
                this.managers.viewport.resetZoom();
            });
            
            // Load file content into editor - this will trigger editor change event
            // which will render the diagram and call our zoom callback
            this.managers.editor.loadFile(file);
        }
    }

    async onThemeChanged(theme) {
        // Update renderer theme
        this.managers.renderer.setTheme(theme);
        
        // Re-render current diagram with new theme
        const content = this.managers.editor.getContent();
        if (content) {
            await this.managers.renderer.renderDiagram(content);
        }
    }

    async loadCurrentFile() {
        const fileId = this.managers.project.getSelectedFileId();
        if (fileId) {
            const file = this.managers.project.openFile(fileId);
            if (file) {
                await this.onFileChanged(file);
            }
        } else {
            // No file selected, create a default one
            const files = this.managers.project.getFiles();
            if (files.length > 0) {
                const file = this.managers.project.openFile(files[0].id);
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

    getCurrentFile() {
        const fileId = this.managers.project.getSelectedFileId();
        return this.managers.project.getFile(fileId);
    }
}

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    window.mermaiditorApp = new MermaiditorApp();
    await window.mermaiditorApp.initialize();
});