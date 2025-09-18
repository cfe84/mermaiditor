/**
 * EditorManager - Handles CodeMirror editor setup and functionality
 */
export class EditorManager {
    constructor(projectManager) {
        this.projectManager = projectManager;
        this.editor = null;
        this.onChangeCallback = null;
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
        this.editor.on("change", () => this.handleChange());
    }

    async handleChange() {
        // Check for version conflicts
        const fileId = this.projectManager.getSelectedFileId();
        if (fileId) {
            const conflict = this.projectManager.checkVersionConflict(fileId);
            if (conflict.conflict) {
                console.log(`Conflict detected for file ${conflict.fileName}`);
                console.log(`Version in storage: ${conflict.storageVersion}`);
                console.log(`Version in editor: ${conflict.editorVersion}`);
                
                if (!confirm(`The diagram "${conflict.fileName}" has been modified in another tab. Do you want to overwrite it?`)) {
                    return false;
                }
            }
            
            // Save the file with updated content
            const file = this.projectManager.getFile(fileId);
            if (file) {
                file.content = this.editor.getValue();
                this.projectManager.saveFile(file);
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
        const project = this.projectManager.getSelectedProject();
        if (project && file) {
            document.title = `Mermaiditor - ${project.name} / ${file.name}`;
        }
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