/**
 * DiagramRenderer - Handles Mermaid diagram rendering and theme management
 */
export class DiagramRenderer {
    constructor(logger, mermaid) {
        this.logger = logger;
        this.mermaid = mermaid;
        this.preview = document.getElementById('preview');
        this.consoleElt = document.getElementById('console');
        this.onLoadedCallback = null;
        this.initializeMermaid();
    }

    initializeMermaid() {
        this.logger.debug('Initializing Mermaid');
        this.mermaid.initialize({ 
            startOnLoad: false,
            theme: 'default'
        });
    }

    async renderDiagram(code) {
        this.logger.debug('Rendering diagram');
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
                this.logger.debug('Diagram rendered successfully, displaying SVG');
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
            } else {
                this.logger.error('Mermaid render returned no SVG');
                return { success: false, error: 'No SVG output' };
            }
            
            return { success: true, svg };
        } catch (err) {
            this.logger.error('Error rendering diagram:', err);
            this.showError(err.toString());
            return { success: false, error: err };
        }
    }

    setTheme(theme) {
        this.logger.debug(`Setting theme to: ${theme}`);
        this.mermaid.initialize({ 
            startOnLoad: false,
            theme: theme || 'default'
        });
    }

    showError(errorMessage) {
        this.logger.error(`Showing error: ${errorMessage}`);
        this.consoleElt.innerHTML = errorMessage.replace(/\n/g, '<br/>');
    }

    clearConsole() {
        this.logger.debug('Clearing console');
        this.consoleElt.innerText = '';
    }

    setOnLoadedCallback(callback) {
        this.logger.debug('Setting onLoaded callback');
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