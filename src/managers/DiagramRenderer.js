/**
 * DiagramRenderer - Handles Mermaid diagram rendering and theme management
 */
export class DiagramRenderer {
    constructor(mermaid) {
        this.mermaid = mermaid;
        this.preview = document.getElementById('preview');
        this.consoleElt = document.getElementById('console');
        this.onLoadedCallback = null;
        this.initializeMermaid();
    }

    initializeMermaid() {
        this.mermaid.initialize({ 
            startOnLoad: false,
            theme: 'default'
        });
    }

    async renderDiagram(code) {
        try {
            // Parse first to catch syntax errors
            await this.mermaid.parse(code, { suppressErrors: false });
            this.clearConsole();
            
            // Create a temporary element for rendering
            const element = document.createElement('div');
            element.id = 'rendered';
            
            // Render the diagram
            const { svg } = await this.mermaid.render("rendered", code);
            
            if (svg) {
                this.preview.innerHTML = svg;
                
                // Ensure the SVG has proper styling for responsive scaling
                const svgElement = this.preview.querySelector('svg');
                if (svgElement) {
                    svgElement.style.maxWidth = '100%';
                    svgElement.style.height = 'auto';
                    
                    // Trigger onloaded callback if set (for zoom reset, etc.)
                    if (this.onLoadedCallback) {
                        // Wait for the SVG to be fully rendered in the DOM
                        requestAnimationFrame(() => {
                            setTimeout(() => {
                                if (this.onLoadedCallback) {
                                    this.onLoadedCallback();
                                    this.onLoadedCallback = null;
                                }
                            }, 50);
                        });
                    }
                }
            }
            
            return { success: true, svg };
        } catch (err) {
            this.showError(err.toString());
            return { success: false, error: err };
        }
    }

    setTheme(theme) {
        this.mermaid.initialize({ 
            startOnLoad: false,
            theme: theme || 'default'
        });
    }

    showError(errorMessage) {
        this.consoleElt.innerHTML = errorMessage.replace(/\n/g, '<br/>');
    }

    clearConsole() {
        this.consoleElt.innerText = '';
    }

    setOnLoadedCallback(callback) {
        this.onLoadedCallback = callback;
    }

    getPreviewContent() {
        return this.preview.innerHTML;
    }

    getPreviewElement() {
        return this.preview;
    }

    getConsoleElement() {
        return this.consoleElt;
    }
}