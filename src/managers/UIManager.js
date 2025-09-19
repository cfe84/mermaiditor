/**
 * UIManager - Handles UI controls, dialogs, and user interactions
 */
export class UIManager {
    constructor(projectManager, templateManager, viewPortManager) {
        this.projectManager = projectManager;
        this.templateManager = templateManager;
        this.viewPortManager = viewPortManager;
        this.elements = {};
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.elements = {
            projectSelector: document.getElementById('project-selector'),
            fileSelector: document.getElementById('file-selector'),
            themeSelector: document.getElementById('theme-selector'),
            toggleEditorBtn: document.getElementById('toggle-editor-btn'),
            addDiagramDialog: document.getElementById('add-diagram-dialog'),
            importConflictDialog: document.getElementById('import-conflict-dialog'),
            shareUrlDialog: document.getElementById('share-url-dialog'),
            // Dialog inputs
            diagramName: document.getElementById('diagram-name'),
            diagramTemplate: document.getElementById('diagram-template'),
            importConflictMessage: document.getElementById('import-conflict-message'),
            shareUrlInput: document.getElementById('share-url-input'),
            // Buttons
            addDiagramOk: document.getElementById('add-diagram-ok'),
            addDiagramCancel: document.getElementById('add-diagram-cancel'),
            importOverwrite: document.getElementById('import-overwrite'),
            importNewCopy: document.getElementById('import-new-copy'),
            importCancel: document.getElementById('import-cancel'),
            copyShareUrl: document.getElementById('copy-share-url'),
            shareUrlClose: document.getElementById('share-url-close')
        };
    }

    setupEventListeners() {
        // Project selector
        this.elements.projectSelector.onchange = () => this.handleProjectSelectorChange();
        
        // File selector
        this.elements.fileSelector.onchange = () => this.handleFileSelectorChange();
        
        // Theme selector
        this.elements.themeSelector.onchange = () => this.handleThemeChange();
        
        // Toggle editor button
        this.elements.toggleEditorBtn.addEventListener('click', () => this.toggleEditor());
        
        // Add diagram dialog
        this.elements.addDiagramOk.addEventListener('click', () => this.handleAddDiagramOk());
        this.elements.addDiagramCancel.addEventListener('click', () => this.handleAddDiagramCancel());
        
        // Import conflict dialog
        this.elements.importOverwrite.addEventListener('click', () => this.handleImportOverwrite());
        this.elements.importNewCopy.addEventListener('click', () => this.handleImportNewCopy());
        this.elements.importCancel.addEventListener('click', () => this.handleImportCancel());
        
        // Share URL dialog
        this.elements.copyShareUrl.addEventListener('click', () => this.handleCopyShareUrl());
        this.elements.shareUrlClose.addEventListener('click', () => this.handleShareUrlClose());
    }

    // Project selector management
    loadProjects() {
        const projects = this.projectManager.getProjects();
        const selectedProject = this.projectManager.getSelectedProject();
        
        this.elements.projectSelector.innerHTML = '';
        
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.innerText = project.name;
            option.selected = selectedProject && project.id === selectedProject.id;
            this.elements.projectSelector.appendChild(option);
        });

        // Add management options
        this.addProjectManagementOptions();
    }

    addProjectManagementOptions() {
        const separator = document.createElement('option');
        separator.disabled = true;
        separator.innerText = '──────────────';
        this.elements.projectSelector.appendChild(separator);

        const options = [
            { value: 'create', text: '--- Create new project' },
            { value: 'import', text: '--- Import project' },
            { value: 'export', text: '--- Export this project' },
            { value: 'share', text: '--- Get Encoded URL' },
            { value: 'duplicate', text: '--- Duplicate this project' },
            { value: 'rename', text: '--- Rename this project' },
            { value: 'delete', text: '--- Delete this project' }
        ];

        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.innerText = opt.text;
            this.elements.projectSelector.appendChild(option);
        });
    }

    handleProjectSelectorChange() {
        const selected = this.elements.projectSelector.value;
        
        switch (selected) {
            case 'create':
                this.showCreateProjectDialog();
                break;
            case 'import':
                this.showImportProjectDialog();
                break;
            case 'export':
                this.exportProject();
                break;
            case 'share':
                this.showShareProjectDialog();
                break;
            case 'duplicate':
                this.showDuplicateProjectDialog();
                break;
            case 'rename':
                this.showRenameProjectDialog();
                break;
            case 'delete':
                this.showDeleteProjectDialog();
                break;
            default:
                if (selected !== this.projectManager.getSelectedProject()?.id) {
                    this.projectManager.openProject(selected);
                    this.onProjectChanged();
                }
        }
        
        this.loadProjects(); // Refresh the dropdown
    }

    // File selector management
    loadFiles() {
        const files = this.projectManager.getFiles();
        const selectedFileId = this.projectManager.getSelectedFileId();
        
        this.elements.fileSelector.innerHTML = '';
        
        if (files.length === 0) {
            const option = document.createElement('option');
            option.value = 'default';
            option.innerText = 'Default';
            option.selected = true;
            this.elements.fileSelector.appendChild(option);
        } else {
            files.forEach(file => {
                const option = document.createElement('option');
                option.value = file.id;
                option.innerText = file.name;
                option.selected = file.id === selectedFileId;
                this.elements.fileSelector.appendChild(option);
            });
        }

        // Add file management options
        this.addFileManagementOptions();
    }

    addFileManagementOptions() {
        const separator = document.createElement('option');
        separator.disabled = true;
        separator.innerText = '──────────────';
        this.elements.fileSelector.appendChild(separator);

        const options = [
            { value: 'add', text: '--- Add a new diagram' },
            { value: 'rename', text: '--- Rename this diagram' },
            { value: 'duplicate', text: '--- Duplicate this diagram' },
            { value: 'delete', text: '--- Delete this diagram' }
        ];

        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.innerText = opt.text;
            this.elements.fileSelector.appendChild(option);
        });
    }

    handleFileSelectorChange() {
        const selectedFileId = this.elements.fileSelector.value;
        
        switch (selectedFileId) {
            case 'add':
                this.showAddDiagramDialog();
                break;
            case 'delete':
                this.showDeleteFileDialog();
                break;
            case 'duplicate':
                this.showDuplicateFileDialog();
                break;
            case 'rename':
                this.showRenameFileDialog();
                break;
            default:
                if (selectedFileId !== this.projectManager.getSelectedFileId()) {
                    const file = this.projectManager.openFile(selectedFileId);
                    if (file) {
                        this.onFileChanged(file);
                    }
                }
        }
        
        this.loadFiles(); // Refresh the dropdown
    }

    // Theme management
    loadThemes() {
        const themes = ['default', 'neutral', 'dark', 'forest', 'base'];
        const selectedTheme = this.projectManager.getTheme();
        
        this.elements.themeSelector.innerHTML = '';
        
        themes.forEach(theme => {
            const option = document.createElement('option');
            option.value = theme;
            option.innerText = theme.charAt(0).toUpperCase() + theme.slice(1);
            option.selected = theme === selectedTheme;
            this.elements.themeSelector.appendChild(option);
        });
    }

    handleThemeChange() {
        const theme = this.elements.themeSelector.value;
        this.projectManager.setTheme(theme);
        if (this.onThemeChanged) {
            this.onThemeChanged(theme);
        }
    }

    // Dialog management
    showAddDiagramDialog() {
        this.elements.diagramName.value = '';
        this.elements.diagramTemplate.innerHTML = '';
        
        // Populate templates
        this.templateManager.getTemplateNames().forEach(key => {
            const opt = document.createElement('option');
            opt.value = key;
            opt.innerText = key;
            this.elements.diagramTemplate.appendChild(opt);
        });
        
        this.elements.addDiagramDialog.style.display = 'flex';
    }

    handleAddDiagramOk() {
        const name = this.elements.diagramName.value.trim();
        const template = this.elements.diagramTemplate.value;
        
        if (name) {
            const content = this.templateManager.getTemplate(template);
            const file = this.projectManager.createFile(name, content);
            this.elements.addDiagramDialog.style.display = 'none';
            
            if (file) {
                this.onFileChanged(file);
            }
            this.loadFiles();
            this.showNotification('Diagram created successfully!');
        }
    }

    handleAddDiagramCancel() {
        this.elements.addDiagramDialog.style.display = 'none';
        this.loadFiles();
    }

    showImportConflictDialog(project, existingProject) {
        this.pendingImportProject = project;
        this.elements.importConflictMessage.textContent = 
            `A project with the name "${project.name}" already exists. What would you like to do?`;
        this.elements.importConflictDialog.style.display = 'flex';
    }

    handleImportOverwrite() {
        if (this.pendingImportProject) {
            this.projectManager.resolveImportConflict(this.pendingImportProject, 'overwrite');
            this.elements.importConflictDialog.style.display = 'none';
            this.onProjectChanged();
            this.showNotification('Project overwritten successfully!');
            this.cleanupUrlParams();
        }
    }

    handleImportNewCopy() {
        if (this.pendingImportProject) {
            this.projectManager.resolveImportConflict(this.pendingImportProject, 'create-copy');
            this.elements.importConflictDialog.style.display = 'none';
            this.onProjectChanged();
            this.showNotification('Project imported as a copy!');
            this.cleanupUrlParams();
        }
    }

    handleImportCancel() {
        this.elements.importConflictDialog.style.display = 'none';
        this.cleanupUrlParams();
    }

    showShareProjectDialog() {
        const sharedUrl = this.projectManager.generateShareUrl();
        if (!sharedUrl) return;
        
        this.elements.shareUrlInput.value = sharedUrl;
        this.elements.shareUrlDialog.style.display = 'flex';
    }

    handleCopyShareUrl() {
        this.elements.shareUrlInput.select();
        document.execCommand('copy');
        this.showNotification('URL copied to clipboard!');
    }

    handleShareUrlClose() {
        this.elements.shareUrlDialog.style.display = 'none';
        this.loadProjects();
    }

    // Project management dialogs
    showCreateProjectDialog() {
        const name = prompt('Project name');
        if (name) {
            this.projectManager.createProject(name);
            this.onProjectChanged();
            this.showNotification('Project created successfully!');
        }
    }

    showImportProjectDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.mmd,.json';
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const result = this.projectManager.importProject(e.target.result);
                    if (result.conflict) {
                        this.showImportConflictDialog(result.project, result.existingProject);
                    } else {
                        this.onProjectChanged();
                        this.showNotification('Project imported successfully!');
                    }
                } catch (error) {
                    alert('Failed to import project: ' + error.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    exportProject() {
        const projectData = this.projectManager.exportProject();
        if (!projectData) return;
        
        const project = this.projectManager.getSelectedProject();
        const a = document.createElement('a');
        a.href = 'data:application/mermaid,' + encodeURIComponent(projectData);
        a.download = project.name + '.mmd';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        this.showNotification('Project exported successfully!');
    }

    showDuplicateProjectDialog() {
        const currentProject = this.projectManager.getSelectedProject();
        if (!currentProject) return;
        
        const name = prompt(`New project name for "${currentProject.name}"?`, currentProject.name);
        if (name) {
            this.projectManager.duplicateProject(name);
            this.onProjectChanged();
            this.showNotification('Project duplicated successfully!');
        }
    }

    showRenameProjectDialog() {
        const currentProject = this.projectManager.getSelectedProject();
        if (!currentProject) return;
        
        const newName = prompt(`New project name for "${currentProject.name}"?`, currentProject.name);
        if (newName) {
            this.projectManager.renameProject(newName);
            this.loadProjects();
            this.showNotification('Project renamed successfully!');
        }
    }

    showDeleteProjectDialog() {
        const currentProject = this.projectManager.getSelectedProject();
        if (!currentProject) return;
        
        const confirmed = confirm(`Are you sure you want to delete "${currentProject.name}"?`);
        if (confirmed) {
            this.projectManager.deleteProject();
            this.onProjectChanged();
            this.showNotification('Project deleted successfully!');
        }
    }

    // File management dialogs
    showDeleteFileDialog() {
        const fileId = this.projectManager.getSelectedFileId();
        if (!fileId) return;
        
        const file = this.projectManager.getFile(fileId);
        const confirmed = confirm(`Are you sure you want to delete "${file.name}"?`);
        if (confirmed) {
            const newFile = this.projectManager.deleteFile(fileId);
            if (newFile) {
                this.onFileChanged(newFile);
            }
            this.loadFiles();
            this.showNotification('Diagram deleted successfully!');
        }
    }

    showRenameFileDialog() {
        const fileId = this.projectManager.getSelectedFileId();
        if (!fileId) return;
        
        const file = this.projectManager.getFile(fileId);
        const newName = prompt(`New diagram name for "${file.name}"?`, file.name);
        if (newName) {
            this.projectManager.renameFile(fileId, newName);
            this.loadFiles();
            this.showNotification('Diagram renamed successfully!');
        }
    }

    showDuplicateFileDialog() {
        const fileId = this.projectManager.getSelectedFileId();
        if (!fileId) return;
        
        const file = this.projectManager.getFile(fileId);
        const newName = prompt(`New diagram name for "${file.name}"?`, file.name);
        if (newName) {
            const newFile = this.projectManager.duplicateFile(fileId, newName);
            if (newFile) {
                this.onFileChanged(newFile);
            }
            this.loadFiles();
            this.showNotification('Diagram duplicated successfully!');
        }
    }

    // Utility methods
    showNotification(message) {
        const notification = document.createElement('div');
        notification.innerText = message;
        notification.style.position = 'fixed';
        notification.style.bottom = '10px';
        notification.style.right = '10px';
        notification.style.backgroundColor = '#4CAF50';
        notification.style.color = 'white';
        notification.style.padding = '10px';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '3000';
        document.body.appendChild(notification);

        setTimeout(() => {
            document.body.removeChild(notification);
        }, 2000);
    }

    cleanupUrlParams() {
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // URL sharing support
    checkForSharedProject() {
        const params = new URLSearchParams(window.location.search);
        const projectData = params.get('project');
        
        if (projectData) {
            try {
                const result = this.projectManager.importFromUrl(projectData);
                if (result.conflict) {
                    this.showImportConflictDialog(result.project, result.existingProject);
                } else {
                    this.onProjectChanged();
                    this.showNotification('Shared project imported successfully!');
                    this.cleanupUrlParams();
                }
            } catch (error) {
                console.error('Failed to import shared project:', error);
                alert('Failed to import shared project: ' + error.message);
            }
        }
        // If no project data in URL, do nothing
    }

    // Event handlers that can be overridden
    onProjectChanged() {
        this.loadProjects();
        this.loadFiles();
        this.loadThemes();
        
        if (this.projectChangeCallback) {
            this.projectChangeCallback(this.projectManager.getSelectedProject());
        }
    }

    onFileChanged(file) {
        if (this.fileChangeCallback) {
            this.fileChangeCallback(file);
        }
    }

    onThemeChanged(theme) {
        if (this.themeChangeCallback) {
            this.themeChangeCallback(theme);
        }
    }

    // Callback setters
    setProjectChangeCallback(callback) {
        this.projectChangeCallback = callback;
    }

    setFileChangeCallback(callback) {
        this.fileChangeCallback = callback;
    }

    setThemeChangeCallback(callback) {
        this.themeChangeCallback = callback;
    }

    toggleEditor() {
        const leftBar = document.getElementById('left-bar');
        const splitBar = document.getElementById('split-bar');
        const rightBar = document.getElementById('right-bar');
        const container = document.getElementById('container');
        
        if (leftBar.style.display === 'none') {
            // Show editor
            leftBar.style.display = '';
            splitBar.style.display = '';
            
            this.viewPortManager.handleWindowResize();
            
            this.elements.toggleEditorBtn.style.backgroundColor = '';
            this.elements.toggleEditorBtn.title = 'Hide Code Editor';
        } else {
            // Hide editor
            leftBar.style.display = 'none';
            splitBar.style.display = 'none';
            rightBar.style.width = '100%';
            this.elements.toggleEditorBtn.style.backgroundColor = '#555';
            this.elements.toggleEditorBtn.title = 'Show Code Editor';
        }
        this.viewPortManager.resetZoom();
    }
}