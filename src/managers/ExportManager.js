/**
 * ExportManager - Handles image export, clipboard operations, and downloads
 */
export class ExportManager {
    constructor(viewportManager) {
        this.viewportManager = viewportManager;
        this.setupContextMenu();
    }

    setupContextMenu() {
        const contextMenu = document.getElementById('context-menu');
        const previewWrapper = document.getElementById('preview-wrapper');
        
        // Show the context menu on right-click
        previewWrapper.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            contextMenu.style.left = `${event.pageX}px`;
            contextMenu.style.top = `${event.pageY}px`;
            contextMenu.style.display = 'block';
        });

        // Hide the context menu on click anywhere
        previewWrapper.addEventListener('click', () => {
            contextMenu.style.display = 'none';
        });

        // Setup context menu handlers
        document.getElementById('copy-diagram').addEventListener('click', () => this.triggerCopy());
        document.getElementById('save-diagram').addEventListener('click', () => this.triggerDownload());
        
        // Setup button handlers
        document.getElementById('copy-btn').addEventListener('click', () => this.triggerCopy());
        document.getElementById('download-btn').addEventListener('click', () => this.triggerDownload());
    }

    async triggerCopy() {
        this.hideContextMenu();
        
        const preview = document.getElementById('preview');
        const height = preview.clientHeight;
        const width = preview.clientWidth;
        await this.copyToClipboard(height, width, preview.innerHTML);
    }

    async triggerDownload() {
        this.hideContextMenu();
        
        const preview = document.getElementById('preview');
        const height = preview.clientHeight;
        const width = preview.clientWidth;
        await this.downloadImage(height, width, preview.innerHTML, 'diagram.png');
    }

    async downloadImage(height, width, svgString, filename) {
        try {
            const canvas = await this.createPngCanvas(height, width, svgString);
            const png = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = png;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            this.showNotification('Image downloaded successfully!');
        } catch (error) {
            console.error('Failed to download image:', error);
            alert('Failed to download image: ' + error.message);
        }
    }

    async copyToClipboard(height, width, svgString) {
        try {
            const canvas = await this.createPngCanvas(height, width, svgString);
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            this.showNotification('Copied to clipboard!');
            console.log('PNG copied to clipboard');
        } catch (e) {
            console.error('Failed to copy PNG to clipboard:', e);
            alert('Failed to copy to clipboard: ' + e.message);
        }
    }

    createPngCanvas(height, width, svgString) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Encode SVG for data URL
        const encodedSvg = encodeURIComponent(svgString)
            .replace(/'/g, "%27")
            .replace(/"/g, "%22")
            .replace(/%3Cbr%3E/g, "%3Cbr%2F%3E"); // Fix for incorrect <br> tag output from mermaid
            
        const dataUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
        const img = new Image();
        
        // Use higher resolution for export
        const currentScale = this.viewportManager ? this.viewportManager.getScale() : 1;
        const copyScale = Math.max(currentScale, 4);
        const exportHeight = height * copyScale;
        const exportWidth = width * copyScale;

        return new Promise((resolve, reject) => {
            img.onload = function() {
                canvas.width = exportWidth;
                canvas.height = exportHeight;
                
                // Fill with white background
                context.fillStyle = 'white';
                context.fillRect(0, 0, exportWidth, exportHeight);
                
                // Draw the SVG
                context.drawImage(img, 0, 0, exportWidth, exportHeight);
                resolve(canvas);
            };
        
            img.onerror = function(e) {
                console.error('Failed to load SVG as image:', e);
                console.dir(e);
                reject(new Error('Failed to load SVG as image'));
            };
        
            img.src = dataUrl;
        });
    }

    hideContextMenu() {
        const contextMenu = document.getElementById('context-menu');
        contextMenu.style.display = 'none';
    }

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
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 2000);
    }
}