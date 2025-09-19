/**
 * ViewportManager - Handles zoom, pan, and layout management
 */
export class ViewportManager {
    constructor(logger) {
        this.logger = logger;
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.isPanning = false;
        this.startX = 0;
        this.startY = 0;
        
        this.preview = document.getElementById('preview');
        this.previewWrapper = document.getElementById('preview-wrapper');
        this.container = document.getElementById('container');
        this.header = document.getElementById('header');
        
        this.initializeZoomPan();
        this.initializeResize();
    }

    initializeZoomPan() {
        // Zoom with mouse wheel
        this.previewWrapper.addEventListener('wheel', (event) => {
            event.preventDefault();
            this.handleZoom(event);
        });

        // Pan with mouse drag
        this.previewWrapper.addEventListener('mousedown', (event) => {
            this.handlePanStart(event);
        });

        document.addEventListener('mousemove', (event) => {
            this.handlePanMove(event);
        });

        document.addEventListener('mouseup', (event) => {
            this.handlePanEnd(event);
        });

        // Reset zoom on double-click
        this.previewWrapper.addEventListener('dblclick', () => {
            this.resetZoom();
        });

        // Set initial cursor
        this.previewWrapper.style.cursor = 'grab';
    }

    handleZoom(event) {
        const zoomSpeed = 0.25;
        const delta = event.deltaY > 0 ? -zoomSpeed : zoomSpeed;
        const newScale = Math.min(Math.max(this.scale + delta, 0.5), 20); // Limit zoom between 0.5x and 20x

        const rect = this.previewWrapper.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Adjust translation to zoom relative to mouse position
        this.translateX -= (mouseX / this.scale - mouseX / newScale);
        this.translateY -= (mouseY / this.scale - mouseY / newScale);

        this.scale = newScale;
        this.updateTransform();
    }

    handlePanStart(event) {
        if (event.button !== 0) return; // Only left mouse button
        
        this.isPanning = true;
        this.startX = event.clientX - this.translateX;
        this.startY = event.clientY - this.translateY;
        this.previewWrapper.style.cursor = 'grabbing';
    }

    handlePanMove(event) {
        if (!this.isPanning) return;

        this.translateX = event.clientX - this.startX;
        this.translateY = event.clientY - this.startY;
        this.updateTransform();
    }

    handlePanEnd(event) {
        if (event.button !== 0) return; // Only left mouse button
        
        this.isPanning = false;
        this.previewWrapper.style.cursor = 'grab';
    }

    updateTransform() {
        this.preview.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    }

    resetZoom() {
        this.logger.debug(`Resetting zoom`);
        this.translateX = 0;
        this.translateY = 0;
        
        var wScale = this.previewWrapper.clientWidth / this.preview.clientWidth;
        var hScale = this.previewWrapper.clientHeight / this.preview.clientHeight;
        this.scale = Math.min(wScale, hScale);
        this.logger.debug(`Scale: ${this.scale}`);
        if (wScale > hScale) {
            this.logger.debug(`Diagram is tall, center horizontally`);
            this.translateX = (this.previewWrapper.clientWidth - this.preview.clientWidth * this.scale) / 2;
        }
        else {
            this.logger.debug(`Diagram is wide, center vertically`);
            this.translateY = (this.previewWrapper.clientHeight - this.preview.clientHeight * this.scale) / 2;
        }

        this.updateTransform();
        this.logger.debug(`Done resetting zoom`);
    }

    initializeResize() {
        const previewMenu = document.getElementById('preview-menu');
        const leftBar = document.getElementById('left-bar');
        const splitBar = document.getElementById('split-bar');
        const rightBar = document.getElementById('right-bar');
        let isResizing = false;

        // Initial layout setup
        this.setupInitialLayout();

        // Split bar dragging
        splitBar.addEventListener('mousedown', (e) => {
            isResizing = true;
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            this.handleResize(e);
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
        });

        // Window resize handling
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
    }

    setupInitialLayout() {
        const previewMenu = document.getElementById('preview-menu');
        const leftBar = document.getElementById('left-bar');
        const rightBar = document.getElementById('right-bar');

        this.container.style.display = 'flex';
        this.container.style.height = `calc(100% - ${this.header.clientHeight}px)`;
        this.container.style.width = '100%';
        
        const offsetRight = this.container.clientWidth / 2;
        leftBar.style.width = `${this.container.clientWidth - offsetRight - 3}px`;
        rightBar.style.width = `${offsetRight - 2}px`;
        leftBar.style.resize = 'horizontal';
        leftBar.style.overflow = 'auto';
        
        this.previewWrapper.style.height = (this.container.clientHeight - previewMenu.clientHeight) + 'px';
    }

    handleResize(e) {
        const leftBar = document.getElementById('left-bar');
        const rightBar = document.getElementById('right-bar');
        
        const offsetRight = this.container.clientWidth - (e.clientX - this.container.offsetLeft);
        leftBar.style.width = `${this.container.clientWidth - offsetRight - 3}px`;
        rightBar.style.width = `${offsetRight - 2}px`;
    }

    handleWindowResize() {
        const leftBar = document.getElementById('left-bar');
        const rightBar = document.getElementById('right-bar');
        
        const offset = this.container.clientWidth - leftBar.clientWidth;
        rightBar.style.width = `${offset - 2}px`;
        
        // Update preview wrapper height
        const previewMenu = document.getElementById('preview-menu');
        this.previewWrapper.style.height = (this.container.clientHeight - previewMenu.clientHeight) + 'px';
    }

    // Public methods for other managers
    getScale() {
        return this.scale;
    }

    setScale(scale) {
        this.scale = Math.min(Math.max(scale, 0.5), 20);
        this.updateTransform();
    }

    getTranslation() {
        return { x: this.translateX, y: this.translateY };
    }

    setTranslation(x, y) {
        this.translateX = x;
        this.translateY = y;
        this.updateTransform();
    }

    fitToScreen() {
        this.resetZoom();
    }

    zoomIn() {
        this.setScale(this.scale + 0.25);
    }

    zoomOut() {
        this.setScale(this.scale - 0.25);
    }
}