import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';

document.addEventListener('DOMContentLoaded', async () => {
    const preview = document.getElementById('preview');
    const fileSelector = document.getElementById('file-selector');
    const consoleElt = document.getElementById('console');
    const projectSelector = document.getElementById('project-selector');
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

    
        openLastSelectedProject();
        loadProjects();
        loadFiles();
    }

    async function onChangeAsync() {
        await renderAsync(editor);
        const filedId = getSelectedFileId();
        if (filedId) {
            const file = getFile(filedId);
            file.content = editor.getValue();
            saveFile(file);
        }
    }

    function hookResize() {
        const container = document.getElementById('container');
        const leftBar = document.getElementById('left-bar');
        const splitBar = document.getElementById('split-bar');
        const rightBar = document.getElementById('right-bar');
        let isResizing = false;

        container.style.display = 'flex';
        container.style.height = '100%';
        container.style.width = '100%';
        leftBar.style.width = '50%';
        rightBar.style.width = '50%';
        leftBar.style.resize = 'horizontal';
        leftBar.style.overflow = 'auto';

        splitBar.addEventListener('mousedown', function(e) {
            isResizing = true;
        });

        document.addEventListener('mousemove', function(e) {
            if (!isResizing) return;
            const offsetRight = container.clientWidth - (e.clientX - container.offsetLeft);
            leftBar.style.width = `${container.clientWidth - offsetRight - 3}px`;
            rightBar.style.width = `${offsetRight - 2}px`;
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

    function getPngCanvas(height, width, svgString) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const svg = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svg);
        const img = new Image();
        height = height * 4;
        width = width * 4;

        return new Promise((resolve, reject) => {
            img.onload = function() {
                canvas.width = width;
                canvas.height = height;
                context.fillStyle = 'white';
                context.fillRect(0, 0, width, height);
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

    function openLastSelectedProject() {
        const id = localStorage.getItem('selectedProject');
        if (id) {
            openProject(id);
        }
    }

    function loadProjects() {
        const projects = getProjects();
        if (!selectedProject)
            selectedProject = projects[0];
        projectSelector.innerHTML = '';
        if (projects.length === 0) {
            const option = document.createElement('option');
            option.value = 'default';
            option.innerText = 'Default';
            option.selected = true;
            projectSelector.appendChild(option);
        } else {
            projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.innerText = project.name;
                option.selected = project.id === selectedProject?.id;
                projectSelector.appendChild(option);
            });
        }

        const addOption = document.createElement('option');
        addOption.value = 'add';
        addOption.innerText = '--- Add new project';
        projectSelector.appendChild(addOption);

        const importOption = document.createElement('option');
        importOption.value = 'import';
        importOption.innerText = '--- Import a project';
        projectSelector.appendChild(importOption);
        
        const exportOption = document.createElement('option');
        exportOption.value = 'export';
        exportOption.innerText = '--- Export this project';
        projectSelector.appendChild(exportOption);

        const renameOption = document.createElement('option');
        renameOption.value = 'rename';
        renameOption.innerText = '--- Rename this project';
        projectSelector.appendChild(renameOption);

        const deleteOption = document.createElement('option');
        deleteOption.value = 'delete';
        deleteOption.innerText = '--- Delete this project';
        projectSelector.appendChild(deleteOption);

        projectSelector.onchange = projectSelectorChange;
    }

    function getProjects() {
        let projects = [];
        for(let i = 0; i < localStorage.length; i++) {
            if (localStorage.key(i).startsWith('project-')) {
                const project = JSON.parse(localStorage[localStorage.key(i)]);
                projects.push(project);
            }
        }

        if (projects.length > 1) {
            projects = projects.sort((a, b) => a.name.localeCompare(b.name));
        }

        if (projects.length === 0) {
            projects.push(newProject('Default'));
            createProject('Default');
        }
        
        return projects;
    }

    function projectSelectorChange() {
        const selected = projectSelector.value;
        if (selected === 'add') {
            const name = prompt('Project name');
            if (name) {
                createProject(name);
            }
        } else if (selected === 'import') {
            importProject();
        } else if (selected === 'delete') {
            deleteProject();
        } else if (selected === 'rename') {
            renameProject();
        } else if (selected === 'export') {
            downloadProject();
        } else {
            openProject(selected);
        }
        loadProjects();
    }

    function createProject(name) {
        const project = newProject(name);
        saveProject(project);
        openProject(project.id);
        loadProjects();
    }

    function newProject(name) {
        const projectId = uuidv4();
        const fileId = uuidv4();
        const project = { 
            id: projectId,
            name,
            diagrams: {},
            selectedFile: fileId,
        };
        project.diagrams[fileId] = { id: fileId, name: 'Default', content: defaultContent };
        return project;
    }

    function saveProject(project) {
        localStorage.setItem(`project-${project.id}`, JSON.stringify(project));
    }

    function getProject(id) {
        return JSON.parse(localStorage.getItem(`project-${id}`));
    }

    function openProject(id) {
        selectedProject = getProject(id);
        localStorage.setItem('selectedProject', selectedProject.id);
        loadFiles();
        openLastSelectedFile();
        loadProjects();
    }

    function deleteProject() {
        const confirmed = confirm(`Are you sure you want to delete "${selectedProject.name}"?`);
        if (confirmed) {
            localStorage.removeItem(`project-${selectedProject.id}`);
            const projects = getProjects();
            if (projects.length > 0) {
                openProject(projects[0].id);
            } else {
                createProject('Default');
            }
            loadProjects();
            showNotification('Project deleted successfully!');
        }
    }

    function renameProject() {
        const newName = prompt(`New project name for "${selectedProject.name}"?`);
        if (newName) {
            selectedProject.name = newName;
            saveProject(selectedProject);
            loadProjects();
            showNotification('Project renamed successfully!');
        }
    }

    function getSelectedFileId() {
        return selectedProject?.selectedFile;
    }

    function setSelectedFile(fileId) {
        selectedProject.selectedFile = fileId;
        saveProject(selectedProject);
    }
        
    function loadFiles() {
        const files = getFiles();
        if (!getSelectedFileId())
            setSelectedFile(files[0]?.id);
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
                option.value = file.id;
                option.innerText = file.name;
                option.selected = file.id === getSelectedFileId();
                fileSelector.appendChild(option);
            });
        }
        const addOption = document.createElement('option');
        addOption.value = 'add';
        addOption.innerText = '--- Add a new diagram';
        fileSelector.appendChild(addOption);

        const renameOption = document.createElement('option');
        renameOption.value = 'rename';
        renameOption.innerText = '--- Rename this diagram';
        fileSelector.appendChild(renameOption);
        fileSelector.onchange = fileSelectorChange;

        const deleteOption = document.createElement('option');
        deleteOption.value = 'delete';
        deleteOption.innerText = '--- Delete this diagram';
        fileSelector.appendChild(deleteOption);
        fileSelector.onchange = fileSelectorChange;
    }

    function fileSelectorChange() {
        const selectedFileId = fileSelector.value;
        if (selectedFileId === 'add') {
            const name = prompt('Diagram name');
            if (name) {
                createFile(name);
            }
        } else if (selectedFileId === 'delete') {
            deleteFile();
        } else if (selectedFileId === 'rename') {
            renameFile();
        } else {
            openFile(selectedFileId);
        }
        loadFiles();
    }

    function openLastSelectedFile() {
        const id = getSelectedFileId();
        if (id) {
            openFile(id);
        }
    }

    function openFile(id) {
        const file = getFile(id);
        if (!file) {
            return
        }
        setSelectedFile(id);
        loadFiles();
        editor.setValue(file.content);
    }

    function createFile(name) {
        const file = { id: uuidv4(), name, content: defaultContent };
        saveFile(file);
        openFile(file.id);
        loadFiles();
    }

    function loadLastFile() {
        const selectedFile = getSelectedFileId();
        if (selectedFile) {
            openFile(selectedFile);
        }
    }

    function openFile(id) {
        const file = selectedProject.diagrams[id];
        if (!file) {
            return
        }
        setSelectedFile(id);
        editor.setValue(file.content);
     }

    function saveFile(file) {
        selectedProject.diagrams[file.id] = file;
        saveProject(selectedProject);
    }

    function getFiles() {
        if (!selectedProject)
            return [];
        return Object.values(selectedProject.diagrams);
    }

    function getFile(id) {
        return selectedProject.diagrams[id];
    }

    function deleteFile() {
        const fileId = getSelectedFileId();
        if (!fileId) {
            return;
        }
        const file = getFile(getSelectedFileId());
        const confirmed = confirm(`Are you sure you want to delete "${file.name}"?`);
        if (confirmed) {
            delete selectedProject.diagrams[fileId];
            saveProject(selectedProject);
            const files = getFiles();
            if (files.length > 0) {
                openFile(files[0].id);
            } else {
                createFile('Default');
            }
            loadFiles();
            showNotification('Diagram deleted successfully!');
        }
    }

    function renameFile() {
        const fileId = getSelectedFileId();
        if (!fileId) {
            return;
        }
        const file = getFile(getSelectedFileId());
        const newName = prompt(`New diagram name for "${file.name}"?`);
        if (newName) {
            file.name = newName;
            saveFile(file);
            loadFiles();
            showNotification('Diagram renamed successfully!');
        }
    }

    function importProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file) {
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const project = JSON.parse(e.target.result);
                    project.id = uuidv4(); // Change id to prevent overwrite
                    saveProject(project);
                    openProject(project.id);
                    showNotification('Project imported successfully!');
                } catch (error) {
                    alert('Failed to import project: ' + error.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    function downloadProject() {
        const project = getProject(selectedProject.id);
        const archive = JSON.stringify(project, null, 2);
        const a = document.createElement('a');
        a.href = 'data:application/json,' + encodeURIComponent(archive);
        a.download = project.name + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);    
    }

    function uuidv4() {
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
          (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
        );
      }

    await runAsync();
});