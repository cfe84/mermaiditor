import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';


document.addEventListener('DOMContentLoaded', async () => {
    mermaid.initialize({ startOnLoad: false });

    const preview = document.getElementById('preview');
    const editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
        lineNumbers: true,
        mode: "markdown",
        theme: "dracula",
        autoCloseBrackets: true,
        matchBrackets: true
    });
    editor.getWrapperElement().style.height = '100%';
    hookResize();

    editor.on("change", async function() {
        await renderAsync(editor, preview);
    });

    document.getElementById('copy-btn').addEventListener('click', async () => {
        const rendered = document.getElementById('rendered');
        const height = rendered.clientHeight;
        const width = rendered.clientWidth;
        await copyAsync(height, width, preview.innerHTML);
    });

    document.getElementById('download-btn').addEventListener('click', async () => {
        const rendered = document.getElementById('rendered');
        const height = rendered.clientHeight;
        const width = rendered.clientWidth;
        await downloadAsync(height, width, preview.innerHTML, 'diagram.png');
    });

    // Initialize with default content
    editor.value = 'graph TD;\n    A-->B;\n    A-->C;\n    B-->D;\n    C-->D;';
    await renderAsync(editor, preview);
});

function hookResize() {
    const container = document.getElementById('container');
    const editorContainer = document.getElementById('editor-container');
    const previewContainer = document.getElementById('preview-container');
    let isResizing = false;

    container.style.display = 'flex';
    container.style.height = '100%';
    container.style.width = '100%';
    editorContainer.style.width = '50%';
    previewContainer.style.width = '50%';
    editorContainer.style.resize = 'horizontal';
    editorContainer.style.overflow = 'auto';

    editorContainer.addEventListener('mousedown', function(e) {
        isResizing = true;
    });

    document.addEventListener('mousemove', function(e) {
        if (!isResizing) return;
        const offsetRight = container.clientWidth - (e.clientX - container.offsetLeft);
        editorContainer.style.width = `${container.clientWidth - offsetRight}px`;
        previewContainer.style.width = `${offsetRight}px`;
    });

    document.addEventListener('mouseup', function(e) {
        isResizing = false;
    });
}

async function renderAsync(editor, preview) {
    const element = document.createElement('div', { id: 'rendered' });
    const code = editor.getValue();
    const { svg } = await mermaid.render("rendered", code);
    if (svg) {
        preview.innerHTML = svg;
    }
}

async function downloadAsync(height, width, svgString, filename) {
    const canvas = await getPngCanvas(height, width, svgString);
    const png = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = png;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

async function copyAsync(height, width, svgString) {
    const canvas = await getPngCanvas(height, width, svgString);

    try {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
        ]);
        showNotification('Copied to clipboard!')
        console.log('PNG copied to clipboard');
    } catch (e) {
        console.error('Failed to copy PNG to clipboard:', e);
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.innerText = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '10px';
    notification.style.right = '10px';
    notification.style.backgroundColor = '#4CAF50';
    notification.style.color = 'white';
    notification.style.padding = '10px';
    notification.style.borderRadius = '5px';
    document.body.appendChild(notification);

    setTimeout(() => {
        document.body.removeChild(notification);
    }, 2000);
}

function getPngCanvas(height, width, svgString) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const svg = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svg);
    const img = new Image();

    return new Promise((resolve, reject) => {
        img.onload = function() {
            canvas.width = width;
            canvas.height = height;
            context.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(url);
    
            resolve(canvas);
        };
    
        img.onerror = function(e) {
            console.error('Failed to load SVG as image: ', e);
            alert('Failed to load SVG as image: ' + e.toString());
        };
    
        img.src = url;
    });
}