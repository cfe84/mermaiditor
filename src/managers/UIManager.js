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
            createProjectDialog: document.getElementById('create-project-dialog'),
            duplicateProjectDialog: document.getElementById('duplicate-project-dialog'),
            projectSelectionDialog: document.getElementById('project-selection-dialog'),
            filesystemDeletionDialog: document.getElementById('filesystem-deletion-dialog'),
            filesystemAccessDialog: document.getElementById('filesystem-access-dialog'),
            filesystemReconnectDialog: document.getElementById('filesystem-reconnect-dialog'),
            // Dialog inputs
            diagramName: document.getElementById('diagram-name'),
            diagramTemplate: document.getElementById('diagram-template'),
            importConflictMessage: document.getElementById('import-conflict-message'),
            shareUrlInput: document.getElementById('share-url-input'),
            createProjectName: document.getElementById('create-project-name'),
            createProjectStorage: document.getElementById('create-project-storage'),
            duplicateProjectName: document.getElementById('duplicate-project-name'),
            duplicateProjectStorage: document.getElementById('duplicate-project-storage'),
            projectSelectionList: document.getElementById('project-selection-list'),
            deleteFilesOption: document.getElementById('delete-files-option'),
            removeReferenceOption: document.getElementById('remove-reference-option'),
            storageProviderInfo: document.getElementById('storage-provider-info'),
            duplicateStorageProviderInfo: document.getElementById('duplicate-storage-provider-info'),
            browserCompatibilityWarning: document.getElementById('browser-compatibility-warning'),
            filesystemAccessMessage: document.getElementById('filesystem-access-message'),
            filesystemReconnectMessage: document.getElementById('filesystem-reconnect-message'),
            // Buttons
            addDiagramOk: document.getElementById('add-diagram-ok'),
            addDiagramCancel: document.getElementById('add-diagram-cancel'),
            centerButton: document.getElementById('center-btn'),
            importOverwrite: document.getElementById('import-overwrite'),
            importNewCopy: document.getElementById('import-new-copy'),
            importCancel: document.getElementById('import-cancel'),
            copyShareUrl: document.getElementById('copy-share-url'),
            shareUrlClose: document.getElementById('share-url-close'),
            createProjectConfirm: document.getElementById('create-project-confirm'),
            createProjectCancel: document.getElementById('create-project-cancel'),
            duplicateProjectConfirm: document.getElementById('duplicate-project-confirm'),
            duplicateProjectCancel: document.getElementById('duplicate-project-cancel'),
            projectSelectionConfirm: document.getElementById('project-selection-confirm'),
            projectSelectionCancel: document.getElementById('project-selection-cancel'),
            filesystemDeletionConfirm: document.getElementById('filesystem-deletion-confirm'),
            filesystemDeletionCancel: document.getElementById('filesystem-deletion-cancel'),
            filesystemAccessAllow: document.getElementById('filesystem-access-allow'),
        };
    }

    setupEventListeners() {
        // Center button
        this.elements.centerButton.addEventListener('click', () => this.viewPortManager.resetZoom());

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
        
        // Create Project dialog
        this.elements.createProjectConfirm.addEventListener('click', () => this.handleCreateProjectConfirm());
        this.elements.createProjectCancel.addEventListener('click', () => this.handleCreateProjectCancel());
        this.elements.createProjectStorage.addEventListener('change', () => this.handleStorageProviderChange());
        
        // Duplicate Project dialog
        this.elements.duplicateProjectConfirm.addEventListener('click', () => this.handleDuplicateProjectConfirm());
        this.elements.duplicateProjectCancel.addEventListener('click', () => this.handleDuplicateProjectCancel());
        this.elements.duplicateProjectStorage.addEventListener('change', () => this.handleDuplicateStorageProviderChange());
        
        // Project Selection dialog
        this.elements.projectSelectionConfirm.addEventListener('click', () => this.handleProjectSelectionConfirm());
        this.elements.projectSelectionCancel.addEventListener('click', () => this.handleProjectSelectionCancel());
        
        // Filesystem Deletion dialog
        this.elements.filesystemDeletionConfirm.addEventListener('click', () => this.handleFilesystemDeletionConfirm());
        this.elements.filesystemDeletionCancel.addEventListener('click', () => this.handleFilesystemDeletionCancel());

        // Filesystem access dialog
        this.elements.filesystemAccessAllow.addEventListener('click', () => this.handleFilesystemAccessAllow());
    }

    // Project selector management
    async loadProjects() {
        const projects = await this.projectManager.getProjects(this);
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
            { value: 'create', text: '--- Create new project' }
        ];

        // Only add "Open folder..." if FileSystemStorageProvider is supported
        const FileSystemStorageProvider = this.projectManager.getStorageProvider('fileSystem')?.constructor;
        if (FileSystemStorageProvider && FileSystemStorageProvider.isSupported()) {
            options.push({ value: 'open-folder', text: '--- Open folder...' });
        } else {
            console.debug('📂 "Open folder..." option not available - use Chrome or Edge browsers for local folder access');
        }

        options.push(
            { value: 'import', text: '--- Import project' },
            { value: 'export', text: '--- Export this project' },
            { value: 'share', text: '--- Get Encoded URL' },
            { value: 'duplicate', text: '--- Duplicate this project' },
            { value: 'rename', text: '--- Rename this project' },
            { value: 'delete', text: '--- Delete this project' }
        );

        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.innerText = opt.text;
            this.elements.projectSelector.appendChild(option);
        });
    }

    async handleProjectSelectorChange() {
        const selected = this.elements.projectSelector.value;
        
        switch (selected) {
            case 'create':
                await this.showCreateProjectDialog();
                break;
            case 'open-folder':
                await this.handleOpenFolder();
                break;
            case 'import':
                this.showImportProjectDialog();
                break;
            case 'export':
                await this.exportProject();
                break;
            case 'share':
                await this.showShareProjectDialog();
                break;
            case 'duplicate':
                await this.showDuplicateProjectDialog();
                break;
            case 'rename':
                await this.showRenameProjectDialog();
                break;
            case 'delete':
                await this.showDeleteProjectDialog();
                break;
            default:
                if (selected !== this.projectManager.getSelectedProject()?.id) {
                    try {
                        await this.projectManager.openProject(selected);
                        this.onProjectChanged();
                    } catch (error) {
                        if (error.message === 'FILESYSTEM_NOT_INITIALIZED') {
                            // Set this as the pending project and show reconnect prompt
                            this.projectManager.pendingFileSystemProject = selected;
                            await this.showFileSystemReconnectPrompt();
                        } else {
                            alert('Failed to open project: ' + error.message);
                        }
                    }
                }
        }
        
        await this.loadProjects(); // Refresh the dropdown
    }

    // File selector management
    async loadFiles() {
        const files = await this.projectManager.getFiles();
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

    async handleFileSelectorChange() {
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
                    const file = await this.projectManager.openFile(selectedFileId);
                    if (file) {
                        this.onFileChanged(file);
                    }
                }
        }
        
        await this.loadFiles(); // Refresh the dropdown
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

    async handleThemeChange() {
        const theme = this.elements.themeSelector.value;
        await this.projectManager.setTheme(theme);
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

    async handleAddDiagramOk() {
        const name = this.elements.diagramName.value.trim();
        const template = this.elements.diagramTemplate.value;
        
        if (name) {
            const content = this.templateManager.getTemplate(template);
            const file = await this.projectManager.createFile(name, content);
            this.elements.addDiagramDialog.style.display = 'none';
            
            if (file) {
                this.onFileChanged(file);
            }
            await this.loadFiles();
            this.showNotification('Diagram created successfully!');
        }
    }

    async handleAddDiagramCancel() {
        this.elements.addDiagramDialog.style.display = 'none';
        await this.loadFiles();
    }

    showImportConflictDialog(project, existingProject) {
        this.pendingImportProject = project;
        this.elements.importConflictMessage.textContent = 
            `A project with the name "${project.name}" already exists. What would you like to do?`;
        this.elements.importConflictDialog.style.display = 'flex';
    }

    async handleImportOverwrite() {
        if (this.pendingImportProject) {
            await this.projectManager.resolveImportConflict(this.pendingImportProject, 'overwrite');
            this.elements.importConflictDialog.style.display = 'none';
            this.onProjectChanged();
            this.showNotification('Project overwritten successfully!');
            this.cleanupUrlParams();
        }
    }

    async handleImportNewCopy() {
        if (this.pendingImportProject) {
            await this.projectManager.resolveImportConflict(this.pendingImportProject, 'create-copy');
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

    async showShareProjectDialog() {
        const sharedUrl = await this.projectManager.generateShareUrl();
        if (!sharedUrl) return;
        
        this.elements.shareUrlInput.value = sharedUrl;
        this.elements.shareUrlDialog.style.display = 'flex';
    }

    handleCopyShareUrl() {
        this.elements.shareUrlInput.select();
        document.execCommand('copy');
        this.showNotification('URL copied to clipboard!');
    }

    async handleShareUrlClose() {
        this.elements.shareUrlDialog.style.display = 'none';
        await this.loadProjects();
    }

    // Project management dialogs
    async showCreateProjectDialog() {
        // Populate storage provider options
        this.populateStorageProviders();
        
        // Show browser compatibility warning if needed
        this.updateBrowserCompatibilityWarning();
        
        // Reset form
        this.elements.createProjectName.value = '';
        this.elements.createProjectStorage.value = 'localStorage';
        this.handleStorageProviderChange();
        
        // Show dialog
        this.elements.createProjectDialog.style.display = 'flex';
        this.elements.createProjectName.focus();
    }

    populateStorageProviders() {
        const providers = this.projectManager.getAvailableStorageProviders();
        const select = this.elements.createProjectStorage;
        
        select.innerHTML = '';
        
        providers.forEach(provider => {
            const option = document.createElement('option');
            option.value = provider.id;
            option.textContent = provider.name;
            option.disabled = !provider.supported;
            select.appendChild(option);
        });
    }

    updateBrowserCompatibilityWarning() {
        const warning = this.elements.browserCompatibilityWarning;
        const hasFileSystemSupport = this.projectManager.getStorageProvider('fileSystem') !== undefined;
        
        if (!hasFileSystemSupport) {
            warning.style.display = 'block';
        } else {
            warning.style.display = 'none';
        }
    }

    handleStorageProviderChange() {
        const selectedProvider = this.elements.createProjectStorage.value;
        const infoElement = this.elements.storageProviderInfo;
        
        switch (selectedProvider) {
            case 'localStorage':
                infoElement.textContent = 'Projects will be stored in your browser\'s local storage.';
                break;
            case 'fileSystem':
                infoElement.textContent = 'Projects will be stored in a local folder on your computer.';
                break;
            default:
                infoElement.textContent = '';
        }
    }

    async handleCreateProjectConfirm() {
        const name = this.elements.createProjectName.value.trim();
        const storageProvider = this.elements.createProjectStorage.value;
        
        if (!name) {
            alert('Please enter a project name');
            return;
        }
        
        try {
            // Initialize storage provider if needed (e.g., FileSystem needs folder selection)
            if (storageProvider === 'fileSystem') {
                await this.projectManager.initializeStorageProvider(storageProvider);
            }
            
            // Create the project
            await this.projectManager.createProject(name, storageProvider);
            
            // Close dialog and refresh
            this.elements.createProjectDialog.style.display = 'none';
            this.onProjectChanged();
            this.showNotification(`Project "${name}" created successfully!`);
        } catch (error) {
            console.error('Failed to create project:', error);
            
            // Better error message handling
            let errorMessage = 'Unknown error occurred';
            if (error && error.message) {
                errorMessage = error.message;
            } else if (error && typeof error === 'string') {
                errorMessage = error;
            } else if (error) {
                errorMessage = error.toString();
            }
            
            if (errorMessage.includes('cancelled') || errorMessage.includes('AbortError')) {
                // User cancelled folder selection - just close dialog
                this.elements.createProjectDialog.style.display = 'none';
                this.showNotification('Project creation cancelled', 'info');
            } else {
                this.showNotification('Failed to create project: ' + errorMessage, 'error');
            }
        }
    }

    handleCreateProjectCancel() {
        this.elements.createProjectDialog.style.display = 'none';
    }

    showImportProjectDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.mmd,.json';
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const result = await this.projectManager.importProject(e.target.result);
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

    async exportProject() {
        const projectData = await this.projectManager.exportProject();
        if (!projectData) return;
        
        const project = await this.projectManager.getSelectedProjectMetadata();
        const a = document.createElement('a');
        a.href = 'data:application/mermaid,' + encodeURIComponent(projectData);
        a.download = project.name + '.mmd';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        this.showNotification('Project exported successfully!');
    }

    async showDuplicateProjectDialog() {
        const currentProject = await this.projectManager.getSelectedProjectMetadata();
        if (!currentProject) return;
        
        // Populate storage provider options
        this.populateDuplicateStorageProviders();
        
        // Set default name and storage
        this.elements.duplicateProjectName.value = `${currentProject.name} Copy`;
        this.elements.duplicateProjectStorage.value = 'localStorage';
        this.handleDuplicateStorageProviderChange();
        
        // Show dialog
        this.elements.duplicateProjectDialog.style.display = 'flex';
        this.elements.duplicateProjectName.focus();
        this.elements.duplicateProjectName.select();
    }

    populateDuplicateStorageProviders() {
        const providers = this.projectManager.getAvailableStorageProviders();
        const select = this.elements.duplicateProjectStorage;
        
        select.innerHTML = '';
        
        providers.forEach(provider => {
            const option = document.createElement('option');
            option.value = provider.id;
            option.textContent = provider.name;
            option.disabled = !provider.supported;
            select.appendChild(option);
        });
    }

    handleDuplicateStorageProviderChange() {
        const selectedProvider = this.elements.duplicateProjectStorage.value;
        const infoElement = this.elements.duplicateStorageProviderInfo;
        
        switch (selectedProvider) {
            case 'localStorage':
                infoElement.textContent = 'Project copy will be stored in your browser\'s local storage.';
                break;
            case 'fileSystem':
                infoElement.textContent = 'Project copy will be stored in a local folder on your computer.';
                break;
            default:
                infoElement.textContent = '';
        }
    }

    async handleDuplicateProjectConfirm() {
        const name = this.elements.duplicateProjectName.value.trim();
        const storageProvider = this.elements.duplicateProjectStorage.value;
        
        if (!name) {
            alert('Please enter a project name');
            return;
        }
        
        try {
            // Initialize storage provider if needed (e.g., FileSystem needs folder selection)
            if (storageProvider === 'fileSystem') {
                await this.projectManager.initializeStorageProvider(storageProvider);
            }
            
            // Duplicate the project
            await this.projectManager.duplicateProject(name, storageProvider);
            
            // Close dialog and refresh
            this.elements.duplicateProjectDialog.style.display = 'none';
            this.onProjectChanged();
            this.showNotification(`Project duplicated as "${name}" successfully!`);
        } catch (error) {
            console.error('Failed to duplicate project:', error);
            if (error.message.includes('cancelled')) {
                // User cancelled folder selection - just close dialog
                this.elements.duplicateProjectDialog.style.display = 'none';
            } else {
                alert('Failed to duplicate project: ' + error.message);
            }
        }
    }

    handleDuplicateProjectCancel() {
        this.elements.duplicateProjectDialog.style.display = 'none';
    }

    // Open Folder functionality
    async handleOpenFolder() {
        try {
            const result = await this.projectManager.openFolder();
            if (!result) {
                // User cancelled
                return;
            }

            if (result.selectedProject) {
                // Single project was automatically opened
                this.onProjectChanged();
                this.showNotification(`Opened project "${result.selectedProject.name}" from folder!`);
            } else {
                // Multiple projects found, show selection dialog
                this.showProjectSelectionDialog(result.allProjects, result.directoryHandle);
            }
        } catch (error) {
            this.logger.error('Failed to open folder:', error);
            alert('Failed to open folder: ' + error.message);
        }
    }

    showProjectSelectionDialog(projects, directoryHandle) {
        // Store for later use
        this.pendingProjects = projects;
        this.pendingDirectoryHandle = directoryHandle;
        
        // Populate project list
        this.elements.projectSelectionList.innerHTML = '';
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = `${project.name} (${project.fileName})`;
            this.elements.projectSelectionList.appendChild(option);
        });
        
        // Show dialog
        this.elements.projectSelectionDialog.style.display = 'flex';
        if (projects.length > 0) {
            this.elements.projectSelectionList.selectedIndex = 0;
        }
    }

    async handleProjectSelectionConfirm() {
        const selectedId = this.elements.projectSelectionList.value;
        if (!selectedId || !this.pendingProjects) return;

        try {
            const selectedProject = this.pendingProjects.find(p => p.id === selectedId);
            if (selectedProject) {
                await this.projectManager.openProjectFromFolder(selectedProject, this.pendingDirectoryHandle);
                this.onProjectChanged();
                this.showNotification(`Opened project "${selectedProject.name}" from folder!`);
            }
        } catch (error) {
            this.logger.error('Failed to open selected project:', error);
            alert('Failed to open project: ' + error.message);
        } finally {
            this.handleProjectSelectionCancel();
        }
    }

    handleProjectSelectionCancel() {
        this.elements.projectSelectionDialog.style.display = 'none';
        this.pendingProjects = null;
        this.pendingDirectoryHandle = null;
    }

    async showRenameProjectDialog() {
        const currentProject = await this.projectManager.getSelectedProjectMetadata();
        if (!currentProject) return;
        
        const newName = prompt(`New project name for "${currentProject.name}"?`, currentProject.name);
        if (newName) {
            await this.projectManager.renameProject(newName);
            await this.loadProjects();
            this.showNotification('Project renamed successfully!');
        }
    }

    async showDeleteProjectDialog() {
        const currentProject = await this.projectManager.getSelectedProjectMetadata();
        if (!currentProject) return;
        
        const projectRef = this.projectManager.getSelectedProject();
        
        // Check if this is a filesystem project
        if (projectRef && projectRef.storageProvider === 'fileSystem') {
            // Show filesystem deletion dialog
            this.showFilesystemDeletionDialog(currentProject);
        } else {
            // Standard confirmation for other storage providers
            const confirmed = confirm(`Are you sure you want to delete "${currentProject.name}"?`);
            if (confirmed) {
                await this.projectManager.deleteProject();
                this.onProjectChanged();
                this.showNotification('Project deleted successfully!');
            }
        }
    }

    showFilesystemDeletionDialog(projectMetadata) {
        // Store project metadata for later use
        this.pendingDeletionProject = projectMetadata;
        
        // Reset radio button selection to default (delete files)
        this.elements.deleteFilesOption.checked = true;
        this.elements.removeReferenceOption.checked = false;
        
        // Show dialog
        this.elements.filesystemDeletionDialog.style.display = 'flex';
    }

    async handleFilesystemDeletionConfirm() {
        if (!this.pendingDeletionProject) return;
        
        try {
            const deleteFiles = this.elements.deleteFilesOption.checked;
            
            if (deleteFiles) {
                // Delete files from disk
                await this.projectManager.deleteProject(true); // true = delete files
                this.showNotification('Project and files deleted successfully!');
            } else {
                // Remove reference only
                await this.projectManager.deleteProject(false); // false = remove reference only
                this.showNotification('Project removed from Mermaiditor!');
            }
            
            this.onProjectChanged();
        } catch (error) {
            this.logger.error('Failed to delete project:', error);
            alert('Failed to delete project: ' + error.message);
        } finally {
            this.handleFilesystemDeletionCancel();
        }
    }

    handleFilesystemDeletionCancel() {
        this.elements.filesystemDeletionDialog.style.display = 'none';
        this.pendingDeletionProject = null;
    }

    // File management dialogs
    async showDeleteFileDialog() {
        const fileId = this.projectManager.getSelectedFileId();
        if (!fileId) return;
        
        const file = await this.projectManager.getFile(fileId);
        const confirmed = confirm(`Are you sure you want to delete "${file.name}"?`);
        if (confirmed) {
            const newFile = await this.projectManager.deleteFile(fileId);
            if (newFile) {
                this.onFileChanged(newFile);
            }
            await this.loadFiles();
            this.showNotification('Diagram deleted successfully!');
        }
    }

    async showRenameFileDialog() {
        const fileId = this.projectManager.getSelectedFileId();
        if (!fileId) return;
        
        const file = await this.projectManager.getFile(fileId);
        const newName = prompt(`New diagram name for "${file.name}"?`, file.name);
        if (newName) {
            await this.projectManager.renameFile(fileId, newName);
            await this.loadFiles();
            this.showNotification('Diagram renamed successfully!');
        }
    }

    async showDuplicateFileDialog() {
        const fileId = this.projectManager.getSelectedFileId();
        if (!fileId) return;
        
        const file = await this.projectManager.getFile(fileId);
        const newName = prompt(`New diagram name for "${file.name}"?`, file.name);
        if (newName) {
            const newFile = await this.projectManager.duplicateFile(fileId, newName);
            if (newFile) {
                this.onFileChanged(newFile);
            }
            await this.loadFiles();
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
    async checkForSharedProject() {
        const params = new URLSearchParams(window.location.search);
        const projectData = params.get('project');
        
        if (projectData) {
            try {
                const result = await this.projectManager.importFromUrl(projectData);
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
    async onProjectChanged() {
        await this.loadProjects();
        await this.loadFiles();
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

    requestUserAccessPromptAsync(callback) {
        return new Promise((resolve, reject) => {
            this.onUserAccessAllowed = () => {
                callback().then((res) => resolve(res))
            }
            this.onUserAccessError = (error) => {
                reject(error);
            }
            this.showFileSystemAccessPrompt();
        });
    }

    /**
     * Show the file system access prompt dialog
     */
    showFileSystemAccessPrompt() {
        this.elements.filesystemAccessDialog.style.display = 'flex';
    }

    /**
     * Handle file system access allow button
     */
    async handleFilesystemAccessAllow() {
        this.elements.filesystemAccessDialog.style.display = 'none';
        
        try {
            await this.onUserAccessAllowed();
        } catch (error) {
            this.onUserAccessError(error);
        }
    }

    /**
     * Show a notification message
     */
    showNotification(message, type = 'info') {
        // For now, use console and a simple alert
        // TODO: Implement a proper notification system
        console.log(`[${type.toUpperCase()}] ${message}`);
        if (type === 'error') {
            alert(message);
        }
    }
}