import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';

document.addEventListener('DOMContentLoaded', async () => {
    const preview = document.getElementById('preview');
    const fileSelector = document.getElementById('file-selector');
    const consoleElt = document.getElementById('console');
    const projectSelector = document.getElementById('project-selector');
    let selectedFile = null;
    let selectedProject = null;
    const defaultContent = "graph TD;\n    A[Create a project]-->B[Create a diagram];\n    B-->C[Copy diagram to clipboard];\n    B-->D[Export diagram as PNG];\n    C-->E[Happiness];\n    D-->E[Happiness];\n    A[Create a project]-->F[Export project];\n    F--Import project-->A";
    let editor = null;

    async function runAsync() {
        mermaid.initialize({ startOnLoad: false });

        editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
            lineNumbers: true,
            mode: "markdown",
            theme: "dracula",
            autoCloseBrackets: true,
            matchBrackets: true
        });
        editor.getWrapperElement().style.height = '100%';
        hookResize();
    
        editor.on("change", onChangeAsync);
    
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

        document.getElementById('delete-btn').addEventListener('click', () => {
            if (selectedFile) {
                deleteFile();
            } else {
                showNotification('No file selected to delete.');
            }
        });

        document.getElementById('rename-btn').addEventListener('click', () => {
            if (selectedFile) {
                renameFile();
            } else {
                showNotification('No file selected to rename.');
            }
        });
    
        loadLastFile();
        loadFiles();
    }

    async function onChangeAsync() {
        await renderAsync(editor);
        if (selectedFile) {
            saveFile(selectedFile, editor.getValue());
        }
    }

    function hookResize() {
        const container = document.getElementById('container');
        const leftBar = document.getElementById('left-bar');
        const splitBar = document.getElementById('split-bar');
        const previewContainer = document.getElementById('preview-container');
        let isResizing = false;

        container.style.display = 'flex';
        container.style.height = '100%';
        container.style.width = '100%';
        leftBar.style.width = '50%';
        previewContainer.style.width = '50%';
        leftBar.style.resize = 'horizontal';
        leftBar.style.overflow = 'auto';

        splitBar.addEventListener('mousedown', function(e) {
            isResizing = true;
        });

        document.addEventListener('mousemove', function(e) {
            if (!isResizing) return;
            const offsetRight = container.clientWidth - (e.clientX - container.offsetLeft);
            leftBar.style.width = `${container.clientWidth - offsetRight - 3}px`;
            previewContainer.style.width = `${offsetRight - 2}px`;
        });

        document.addEventListener('mouseup', function(e) {
            isResizing = false;
        });
    }

    async function renderAsync(editor) {
        const element = document.createElement('div', { id: 'rendered' });
        const code = editor.getValue();
        try {
            await mermaid.parse(code, { suppressErrors: false });
        } catch(err) {
            consoleElt.innerHTML = err.toString().replace(/\n/g, '<br/>');
            console.error(err);
            return;
        }
        consoleElt.innerText = '';
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

    function loadFiles() {
        const files = getFiles();
        if (!selectedFile)
            selectedFile = files[0]?.name;
        fileSelector.innerHTML = '';
        if (files.length === 0) {
            const option = document.createElement('option');
            option.value = 'default';
            option.innerText = 'Default';
            option.selected = true;
            fileSelector.appendChild(option);
        } else {
            files.forEach(file => {
                const option = document.createElement('option');
                option.value = file.name;
                option.innerText = file.name;
                option.selected = file.name === selectedFile;
                fileSelector.appendChild(option);
            });
        }
        const addOption = document.createElement('option');
        addOption.value = 'add';
        addOption.innerText = 'Add new diagram';
        fileSelector.appendChild(addOption);
        fileSelector.onchange = fileSelectorChange;
    }

    function fileSelectorChange() {
        const selected = fileSelector.value;
        if (selected === 'add') {
            const name = prompt('Diagram name');
            if (name) {
                createFile(name);
            }
        } else {
            openFile(selected);
        }
    }

    function createFile(name) {
        selectedFile = name;
        const content = defaultContent;
        editor.setValue(content);
        saveFile(name, content);
        loadFiles();
    }

    function loadLastFile() {
        selectedFile = localStorage.getItem('selectedFile');
        if (selectedFile) {
            openFile(selectedFile);
        }
    }

    function openFile(name) {
        const file = JSON.parse(localStorage.getItem(`file-${name}`));
        if (!file) {
            return
        }
        localStorage.setItem('selectedFile', name);
        selectedFile = file.name;
        editor.setValue(file.content);
     }

    function saveFile(name, content) {
        const file = { name, content };
        localStorage.setItem(`file-${file.name}`, JSON.stringify(file));
    }

    function getFiles() {
        let files = [];
        for(let i = 0; i < localStorage.length; i++) {
            if (localStorage.key(i).startsWith('file-')) {
                files.push(JSON.parse(localStorage[localStorage.key(i)]));
            }
        }
        if (files.length > 1) {
            files = files.sort((a, b) => a.name.localeCompare(b.name));
        }
        return files;
    }

    function deleteFile() {
        const confirmed = confirm(`Are you sure you want to delete "${selectedFile}"?`);
        if (confirmed) {
            localStorage.removeItem(`file-${selectedFile}`);
            const files = getFiles();
            if (files.length > 0) {
                selectedFile = files[0].name;
                openFile(selectedFile);
            } else {
                localStorage.removeItem('selectedFile');
                selectedFile = null;
                editor.setValue(defaultContent);
            }
            loadFiles();
            showNotification('Diagram deleted successfully!');
        }
    }

    function renameFile() {
        const newName = prompt(`New diagram name for "${selectedFile}"?`);
        if (newName) {
            const file = JSON.parse(localStorage.getItem(`file-${selectedFile}`));
            file.name = newName;
            localStorage.setItem(`file-${newName}`, JSON.stringify(file));
            localStorage.removeItem(`file-${selectedFile}`);
            selectedFile = newName;
            localStorage.setItem('selectedFile', selectedFile);
            loadFiles();
            showNotification('Diagram renamed successfully!');
        }
    }

    function downloadAll() {
        const files = getFiles();
        const archive = JSON.stringify(files);
        const a = document.createElement('a');
        a.href = 'data:application/json,' + encodeURIComponent(archive);
        a.download = 'diagrams.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);    
    }

    await runAsync();
});