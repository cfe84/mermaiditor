const CHANGE_DELAY_MS = 100;

/**
 * EditorManager - Handles CodeMirror editor setup and functionality
 */
export class EditorManager {
    constructor(logger, projectManager) {
        this.logger = logger;
        this.projectManager = projectManager;
        this.editor = null;
        this.onChangeCallback = null;
        this.change = [];
        this.timeout = null;
        this.initializeEditor();
    }

    initializeEditor() {
        const editorElement = document.getElementById("editor");
        
        this.editor = CodeMirror.fromTextArea(editorElement, {
            lineNumbers: true,
            theme: "dracula",
            autoCloseBrackets: true,
            matchBrackets: true
        });
        
        this.editor.getWrapperElement().style.height = '100%';
        
        // Setup change handler
        this.editor.on("change", () => this.temporizeChange());
    }

    /**
     * This allows to prevent changing storage too often. Especially useful when saving in file.
     * @returns 
     */
    temporizeChange() {
        if (this.timeout != null) {
            return true;
        }
        this.timeout = setTimeout(() => {
            this.handleChange()
                .finally(() => this.timeout = null);
            }, CHANGE_DELAY_MS);
        return true;
    }

    async handleChange() {
        // Check for version conflicts
        const fileId = this.projectManager.getSelectedFileId();
        if (fileId) {
            const conflict = await this.projectManager.checkVersionConflict(fileId);
            if (conflict.conflict) {
                this.logger.info(`Conflict detected for file ${conflict.fileName}
                    Version in storage: ${conflict.storageVersion}
                    Version in editor: ${conflict.editorVersion}`);
                
                if (!confirm(`The diagram "${conflict.fileName}" has been modified in another tab. Do you want to overwrite it?`)) {
                    if (confirm(`Do you want to load the updated content?`)) {
                        const f = await this.projectManager.openFile(fileId);
                        this.editor.setValue(f.content);
                    }
                    return false;
                }
            }
            
            // Save the file with updated content
            const file = await this.projectManager.getFile(fileId);
            if (file) {
                file.content = this.editor.getValue();
                await this.projectManager.saveFile(file);
            }
        }

        // Trigger change callback for rendering
        if (this.onChangeCallback) {
            await this.onChangeCallback();
        }
        
        return true;
    }

    setContent(content) {
        if (this.editor) {
            this.editor.setValue(content);
        }
    }

    getContent() {
        return this.editor ? this.editor.getValue() : '';
    }

    loadFile(file) {
        if (file && this.editor) {
            this.setContent(file.content);
            this.updateTitle(file);
        }
    }

    updateTitle(file) {
        return this.projectManager.getSelectedProjectMetadata().then(project => {
            if (project && file) {
                document.title = `Mermaiditor - ${project.name} / ${file.name}`;
            }
        });
    }

    setOnChangeCallback(callback) {
        this.onChangeCallback = callback;
    }

    getEditor() {
        return this.editor;
    }

    refresh() {
        if (this.editor) {
            this.editor.refresh();
        }
    }

    focus() {
        if (this.editor) {
            this.editor.focus();
        }
    }
}