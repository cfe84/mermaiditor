import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11.6.0/dist/mermaid.esm.min.mjs';

document.addEventListener('DOMContentLoaded', async () => {
    const preview = document.getElementById('preview');
    const header = document.getElementById('header');
    const previewWrapper = document.getElementById('preview-wrapper');
    const fileSelector = document.getElementById('file-selector');
    const consoleElt = document.getElementById('console');
    const projectSelector = document.getElementById('project-selector');
    const themeSelector = document.getElementById('theme-selector');
    let fileVersion = null;
    let selectedProject = null;

    const readme = "graph TD;\n    A[\"This default project contains a number of sample diagrams that you can use for reference.\"]\n	B[\"I recommend you start by creating a new project to save your diagrams.\"]\n	C[\"If you don't want to keep those examples, you can delete the sample project using the option in the projects drop down. You  can recreate it simply by creating a new project called Default.\"]\n	D[\"Have fun!\"]\n	A --> B\n    A --> C\n    B --> D\n    C --> D";
    const defaultContent = "graph TD;\n    A[Create a project]-->B[Create a diagram];\n    B-->C[Copy diagram to clipboard];\n    B-->D[Export diagram as PNG];\n    C-->E[Happiness];\n    D-->E[Happiness];\n    A[Create a project]-->F[Export project];\n    F--Import project-->A";
    const sequenceExample = "sequenceDiagram;\n    A->>B: Hello B, how are you?\n    B->>A: I am good thanks!\n    A->>C: Hello C, how are you?\n    C->>A: I am good thanks!";
    const classDiagramExample = "---\ntitle: Animal example\n---\nclassDiagram\n    note \"From Duck till Zebra\"\n    Animal <|-- Duck\n    note for Duck \"can fly\ncan swim\ncan dive\ncan help in debugging\"\n    Animal <|-- Fish\n    Animal <|-- Zebra\n    Animal : +int age\n    Animal : +String gender\n    Animal: +isMammal()\n    Animal: +mate()\n    class Duck{\n        +String beakColor\n        +swim()\n        +quack()\n    }\n    class Fish{\n        -int sizeInFeet\n        -canEat()\n    }\n    class Zebra{\n        +bool is_wild\n        +run()\n    }\n";
    const stateDiagramExample = "stateDiagram-v2\n    [*] --> State1\n    State1 --> [*]\n    State1 --> State2\n    State2 --> State1\n    State2 --> [*]";
    const erdExample = "erDiagram\n    CUSTOMER ||--o{ ORDER : places\n    ORDER ||--|{ LINE-ITEM : contains\n    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses";
    const userJourney = "journey\n    title My working day\n    section Go to work\n      Make tea: 5: Me\n      Go upstairs: 3: Me\n      Do work: 1: Me, Cat\n    section Go home\n      Go downstairs: 5: Me\n      Sit down: 5: Me";
    const flowchartExample = "flowchart TD;\n    A[Create a project]-->B[Create a diagram];\n    B-->C[Copy diagram to clipboard];\n    B-->D[Export diagram as PNG];\n    C-->E[Happiness];\n    D-->E[Happiness];\n    A[Create a project]-->F[Export project];\n    F--Import project-->A";
    const gitGraphExample = "gitGraph\n    commit\n    branch develop\n    commit\n    branch feature\n    commit\n    checkout develop\n    merge feature\n    commit\n    checkout main\n    merge develop";
    const mindmapExample = "mindmap\n  root\n    A\n      B\n    C\n      D\n      E\n    F\n      G\n      H";
    const pieChartExample = "pie\n    title Pets adopted by volunteers\n    \"Dogs\": 386\n    \"Cats\": 85\n    \"Rats\": 15\n    \"Rabbits\": 15";
    const quadrantChartExample = "quadrantChart\n    title Reach and engagement of campaigns\n    x-axis Low Reach --> High Reach\n    y-axis Low Engagement --> High Engagement\n    quadrant-1 We should expand\n    quadrant-2 Need to promote\n    quadrant-3 Re-evaluate\n    quadrant-4 May be improved\n    Campaign A: [0.3, 0.6]\n    Campaign B: [0.45, 0.23]\n    Campaign C: [0.57, 0.69]\n    Campaign D: [0.78, 0.34]\n    Campaign E: [0.40, 0.34]\n    Campaign F: [0.35, 0.78]";
    const requirementDiagramExample = "requirementDiagram\n\n    requirement test_req {\n    id: 1\n    text: the test text.\n    risk: high\n    verifymethod: test\n    }\n\n    element test_entity {\n    type: simulation\n    }\n\n    test_entity - satisfies -> test_req\n";
    const sankeyExample = "---\nconfig:\n  sankey:\n    showValues: false\n---\nsankey-beta\n\n%% source,target,value\nElectricity grid,Over generation / exports,104.453\nElectricity grid,Heating and cooling - homes,113.726\nElectricity grid,H2 conversion,27.14\n";
    const xyExample = "---\nconfig:\n    xyChart:\n        width: 900\n        height: 600\n    themeVariables:\n        xyChart:\n            titleColor: \"#ff0000\"\n---\nxychart-beta\n    title \"Sales Revenue\"\n    x-axis [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]\n    y-axis \"Revenue (in $)\" 4000 --> 11000\n    bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]\n    line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]\n";
    const kanbanExample = "---\nconfig:\n  kanban:\n    ticketBaseUrl: 'https://mermaidchart.atlassian.net/browse/#TICKET#'\n---\nkanban\n  Todo\n    [Create Documentation]\n    docs[Create Blog about the new diagram]\n  [In progress]\n    id6[Create renderer so that it works in all cases. We also add som extra text here for testing purposes. And some more just for the extra flare.]\n  id9[Ready for deploy]\n    id8[Design grammar]@{ assigned: 'knsv' }\n  id10[Ready for test]\n    id4[Create parsing tests]@{ ticket: MC-2038, assigned: 'K.Sveidqvist', priority: 'High' }\n    id66[last item]@{ priority: 'Very Low', assigned: 'knsv' }\n  id11[Done]\n    id5[define getData]\n    id2[Title of diagram is more than 100 chars when user duplicates diagram with 100 char]@{ ticket: MC-2036, priority: 'Very High'}\n    id3[Update DB function]@{ ticket: MC-2037, assigned: knsv, priority: 'High' }\n\n  id12[Can't reproduce]\n    id3[Weird flickering in Firefox]\n";
    const ganttExample = "gantt\n    title A Gantt Diagram\n    dateFormat  YYYY-MM-DD\n    section A section\n    A task           :a1, 2014-01-01, 30d\n    Another task     :after a1  , 12d\n    section Critical tasks\n    Important task   :crit, 24d\n    Another critical task: 48h\n    section The last section\n    last task       : 30d";
    const timelineExample = "timeline\n    title History of Social Media Platform\n    2002 : LinkedIn\n    2004 : Facebook\n         : Google\n    2005 : Youtube\n    2006 : Twitter";
    
    const examples = {
        Graph: defaultContent,
        Sequence: sequenceExample,
        State: stateDiagramExample,
        Class: classDiagramExample,
        ERD: erdExample,
        Mindmap: mindmapExample,
        Flowchart: flowchartExample,
        GitGraph: gitGraphExample,
        UserJourney: userJourney,
        Requirements: requirementDiagramExample,
        PieChart: pieChartExample,
        QuadrantChart: quadrantChartExample,
        Sankey: sankeyExample,
        XY: xyExample,
        Timeline: timelineExample,
        Kanban: kanbanExample,
        Gantt: ganttExample
    }
    let editor = null;
    let onloaded = null;

    async function runAsync() {
        mermaid.initialize({ startOnLoad: false });

        editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
            lineNumbers: true,
            theme: "dracula",
            autoCloseBrackets: true,
            matchBrackets: true
        });
        editor.getWrapperElement().style.height = '100%';
        hookResize();
    
        editor.on("change", onChangeAsync);
    
        document.getElementById('copy-btn').addEventListener('click', triggerCopyAsync);
        document.getElementById('download-btn').addEventListener('click', triggerDownloadAsync);
        document.getElementById('copy-diagram').addEventListener('click', triggerCopyAsync);
        document.getElementById('save-diagram').addEventListener('click', triggerDownloadAsync);
    
        openLastSelectedProject();
        loadProjects();
        loadFiles();
        loadThemes();
    }

    function reloadMermaid() {
        mermaid.initialize({ theme: selectedProject?.theme });
        renderAsync(editor);
    }

    async function onChangeAsync() {
        await renderAsync(editor);
        const filedId = getSelectedFileId();
        if (filedId) {
            const file = getFile(filedId);
            const fileInStorage = getFileFromStorage(filedId);
            if (fileInStorage && fileInStorage.version !== fileVersion) {
                console.log(`Conflict detected for file ${file.name}`);
                console.log(`Version in storage: ${fileInStorage.version}`);
                console.log(`Version in editor: ${file.version}`);
                if (!confirm(`The diagram "${file.name}" has been modified in another tab. Do you want to overwrite it?`)) {
                    return false;
                }
            }
            file.content = editor.getValue();
            saveFile(file);
        }
    }

    function hookResize() {
        const container = document.getElementById('container');
        const previewMenu = document.getElementById('preview-menu');
        const leftBar = document.getElementById('left-bar');
        const splitBar = document.getElementById('split-bar');
        const rightBar = document.getElementById('right-bar');
        let isResizing = false;

        container.style.display = 'flex';
        container.style.height = `calc(100% - ${header.clientHeight}px)`;
        container.style.width = '100%';
        const offsetRight = container.clientWidth / 2;
        leftBar.style.width = `${container.clientWidth - offsetRight - 3}px`;
        rightBar.style.width = `${offsetRight - 2}px`;
        leftBar.style.resize = 'horizontal';
        leftBar.style.overflow = 'auto';
        previewWrapper.style.height = (container.clientHeight - previewMenu.clientHeight)+ 'px';

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

        window.addEventListener('resize', function() {
            const offset = container.clientWidth - leftBar.clientWidth;
            rightBar.style.width = `${offset - 2}px`;
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
        if (onloaded) {
                onloaded();
                onloaded = null;
        }
    }


    /********
     * Context menu
     ********/

    const contextMenu = document.getElementById('context-menu');
    // Show the context menu on right-click
    previewWrapper.addEventListener('contextmenu', (event) => {
        event.preventDefault();

        // Position the context menu
        contextMenu.style.left = `${event.pageX}px`;
        contextMenu.style.top = `${event.pageY}px`;
        contextMenu.style.display = 'block';
    });

    // Hide the context menu on click anywhere
    previewWrapper.addEventListener('click', () => {
        contextMenu.style.display = 'none';
    });

    async function triggerCopyAsync() {
        contextMenu.style.display = 'none';

        const rendered = document.getElementById('rendered');
        const height = rendered.clientHeight;
        const width = rendered.clientWidth;
        await copyAsync(height, width, preview.innerHTML);
    }

    async function triggerDownloadAsync() {
        contextMenu.style.display = 'none';

        const rendered = document.getElementById('rendered');
        const height = rendered.clientHeight;
        const width = rendered.clientWidth;
        await downloadAsync(height, width, preview.innerHTML, 'diagram.png');
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
        const encodedSvg = encodeURIComponent(svgString)
            .replace(/'/g, "%27")
            .replace(/"/g, "%22")
            .replace(/%3Cbr%3E/g, "%3Cbr%2F%3E"); // This is a fix for the <br> tag that mermaid is outputting incorrectly
        const dataUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
        const img = new Image();
        const copyScale = Math.max(scale, 4);
        height = height * copyScale;
        width = width * copyScale;

        return new Promise((resolve, reject) => {
            img.onload = function() {
                canvas.width = width;
                canvas.height = height;
                context.fillStyle = 'white';
                context.fillRect(0, 0, width, height);
                context.drawImage(img, 0, 0, width, height);
                resolve(canvas);
            };
        
            img.onerror = function(e) {
                console.error('Failed to load SVG as image: ', e.message, e.type);
                console.dir(e);
                alert('Failed to load SVG as image.');
            };
        
            img.src = dataUrl;
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

    /********
     * Project management
     * ********/

    function openLastSelectedProject() {
        const id = localStorage.getItem('selectedProject');
        if (id) {
            openProject(id);
        }
    }

    function loadProjects() {
        const projects = getProjects();
        if (projects.length === 0) {
            createProject('Default');
            return;
        }
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
        
        const shareOption = document.createElement('option');
        shareOption.value = 'share';
        shareOption.innerText = '--- Get Encoded URL';
        projectSelector.appendChild(shareOption);

        const duplicateOption = document.createElement('option');
        duplicateOption.value = 'duplicate';
        duplicateOption.innerText = '--- Duplicate this project';
        projectSelector.appendChild(duplicateOption);

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
        } else if (selected === 'duplicate') {
            duplicateProject();
        } else if (selected === 'export') {
            downloadProject();
        } else if (selected === 'share') {
            shareProjectUrl();
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
        return project;
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
        if (name === "Default") {
            project.diagrams[fileId] = { id: fileId, name: 'README', content: readme };
            Object.keys(examples).forEach(key => {
                const file = { id: uuidv4(), name: key, content: examples[key] };
                project.diagrams[file.id] = file;
            });
        } else {
            project.diagrams[fileId] = { id: fileId, name: 'Default', content: defaultContent };
        }
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
        if (selectedProject.theme) {
            mermaid.initialize({ theme: selectedProject.theme || "default" });
        }
        localStorage.setItem('selectedProject', selectedProject.id);
        loadFiles();
        openLastSelectedFile();
        loadProjects();
        loadThemes();
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
        const newName = prompt(`New project name for "${selectedProject.name}"?`, selectedProject.name);
        if (newName) {
            selectedProject.name = newName;
            saveProject(selectedProject);
            loadProjects();
            showNotification('Project renamed successfully!');
        }
    }

    function duplicateProject() {
        const name = prompt(`New project name for "${selectedProject.name}"?`, selectedProject.name);
        if (!name) {
            return;
        }
        const project = { ...selectedProject };
        project.name = name;
        project.id = uuidv4(); // Change id to prevent overwrite
        saveProject(project);
        openProject(project.id);
        showNotification('Project duplicated successfully!');
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
                    
                    // Check if a project with the same ID already exists
                    const existingProject = getProject(project.id);
                    
                    if (existingProject) {
                        // Show the conflict dialog
                        showImportConflictDialog(project, existingProject);
                    } else {
                        // No conflict, just save the project
                        saveProject(project);
                        openProject(project.id);
                        showNotification('Project imported successfully!');
                    }
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

        const duplicateOption = document.createElement('option');
        duplicateOption.value = 'duplicate';
        duplicateOption.innerText = '--- Duplicate this diagram';
        fileSelector.appendChild(duplicateOption);

        const deleteOption = document.createElement('option');
        deleteOption.value = 'delete';
        deleteOption.innerText = '--- Delete this diagram';
        fileSelector.appendChild(deleteOption);
        fileSelector.onchange = fileSelectorChange;
    }

    function fileSelectorChange() {
        const selectedFileId = fileSelector.value;
        if (selectedFileId === 'add') {
            // Show add-diagram dialog
            const dialog = document.getElementById('add-diagram-dialog');
            const nameInput = document.getElementById('diagram-name');
            const templateSelect = document.getElementById('diagram-template');
            // reset inputs
            nameInput.value = '';
            templateSelect.innerHTML = '';
            // populate templates
            Object.keys(examples).forEach(key => {
                const opt = document.createElement('option');
                opt.value = key;
                opt.innerText = key;
                templateSelect.appendChild(opt);
            });
            dialog.style.display = 'flex';
        } else if (selectedFileId === 'delete') {
            deleteFile();
        } else if (selectedFileId === 'duplicate') {
            duplicateFile();
        } else if (selectedFileId === 'rename') {
            renameFile();
        } else {
            openFile(selectedFileId);
        }
        loadFiles();
    }

    // Add dialog event handlers
    document.getElementById('add-diagram-ok').addEventListener('click', () => {
        const dialog = document.getElementById('add-diagram-dialog');
        const name = document.getElementById('diagram-name').value.trim();
        const template = document.getElementById('diagram-template').value;
        if (name) {
            const content = examples[template] || defaultContent;
            createFile(name, content);
            dialog.style.display = 'none';
        }
    });
    
    document.getElementById('add-diagram-cancel').addEventListener('click', () => {
        document.getElementById('add-diagram-dialog').style.display = 'none';
        loadFiles();
    });

    function openLastSelectedFile() {
        const id = getSelectedFileId();
        if (id) {
            openFile(id);
        }
    }

    function createFile(name, content = defaultContent) {
        const file = { id: uuidv4(), version: uuidv4(), name, content };
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
        // Reload before saving in case another editor has the project open
        selectedProject = getProject(selectedProject.id);
        const file = selectedProject.diagrams[id];
        if (!file) {
            return
        }
        fileVersion = file.version;
        setSelectedFile(id);
        editor.setValue(file.content);
        document.title = `Mermaiditor - ${selectedProject.name} / ${file.name}`;
        onloaded = resetZoom;
     }

    function saveFile(file) {
        // Reload before saving in case another editor has the project open
        selectedProject = getProject(selectedProject.id);
        file.version = uuidv4();
        selectedProject.diagrams[file.id] = file;
        fileVersion = file.version;
        saveProject(selectedProject);
        return true;
    }

    function getFiles() {
        if (!selectedProject)
            return [];
        return Object.values(selectedProject.diagrams).sort((a, b) => a.name.localeCompare(b.name));
    }

    function getFile(id) {
        return selectedProject.diagrams[id];
    }

    function getFileFromStorage(id) {
        const project = getProject(selectedProject.id);
        const versionInStorage = project.diagrams[id];
        return versionInStorage;
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
        const newName = prompt(`New diagram name for "${file.name}"?`, file.name);
        if (newName) {
            file.name = newName;
            saveFile(file);
            loadFiles();
            showNotification('Diagram renamed successfully!');
        }
    }

    function duplicateFile() {
        const fileId = getSelectedFileId();
        if (!fileId) {
            return;
        }
        const file = getFile(getSelectedFileId());
        const newName = prompt(`New diagram name for "${file.name}"?`, file.name);
        if (newName) {
            const newFile = { ...file, id: uuidv4(), name: newName };
            saveFile(newFile);
            openFile(newFile.id);
            loadFiles();
            showNotification('Diagram duplicated successfully!');
        }
    }

    function loadThemes() {
        const themes = ['default', 'neutral', 'dark', 'forest', 'base'];
        themeSelector.innerHTML = '';
        const selectedTheme = selectedProject?.theme || 'default';
        themes.forEach(theme => {
            const option = document.createElement('option');
            option.value = theme;
            option.innerText = theme.charAt(0).toUpperCase() + theme.slice(1);
            option.selected = theme === selectedTheme;
            themeSelector.appendChild(option);
        });
        themeSelector.onchange = () => {
            selectedProject.theme = themeSelector.value;
            saveProject(selectedProject);
            reloadMermaid();
        };
    }

    function uuidv4() {
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
          (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
        );
      }

    // Zoom and pan functionality

    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let isPanning = false; // Flag to track panning state
    let startX = 0; // Starting panning position
    let startY = 0;

    // Apply the transform to the preview element after panning
    function updateTransform() {
        preview.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }

    previewWrapper.addEventListener('wheel', (event) => {
        event.preventDefault();

        const zoomSpeed = 0.25;
        const delta = event.deltaY > 0 ? -zoomSpeed : zoomSpeed;

        const newScale = Math.min(Math.max(scale + delta, 0.5), 20); // Limit zoom between 0.5x and 20x

        const rect = previewWrapper.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // This needs fixing. It should center on the mouse position but it doesn't
        translateX -= (mouseX / scale - mouseX / newScale);
        translateY -= (mouseY / scale - mouseY / newScale);

        scale = newScale;
        updateTransform();
    });

    previewWrapper.addEventListener('mousedown', (event) => {
        if (event.button !== 0) return;
        isPanning = true;
        startX = event.clientX - translateX;
        startY = event.clientY - translateY;
        previewWrapper.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (event) => {
        if (!isPanning) return;

        translateX = event.clientX - startX;
        translateY = event.clientY - startY;
        updateTransform();
    });

    document.addEventListener('mouseup', (event) => {
        if (event.button !== 0) return;

        isPanning = false;
        previewWrapper.style.cursor = 'grab';
    });

    previewWrapper.addEventListener('dblclick', (event) => {
        resetZoom();
    });

    function resetZoom() {
        translateX = 0;
        translateY = 0;
        var wScale = previewWrapper.clientWidth / preview.clientWidth;
        var hScale = previewWrapper.clientHeight / preview.clientHeight;
        scale = Math.min(wScale, hScale);
        updateTransform();
    }

    // Project sharing via URL functions
    function shareProjectUrl() {
        const project = getProject(selectedProject.id);
        const projectJson = JSON.stringify(project);
        
        // Use LZ-String compression for better URL compression
        const compressed = LZString.compressToEncodedURIComponent(projectJson);
        
        // Generate the full URL with the compressed data
        const baseUrl = window.location.href.split('?')[0];
        const sharedUrl = `${baseUrl}?project=${compressed}`;
        
        // Show the share URL dialog
        const dialog = document.getElementById('share-url-dialog');
        const urlInput = document.getElementById('share-url-input');
        
        // Set the URL in the input field
        urlInput.value = sharedUrl;
        
        // Show the dialog
        dialog.style.display = 'flex';
        
        // Handle copy button
        document.getElementById('copy-share-url').onclick = () => {
            urlInput.select();
            document.execCommand('copy');
            showNotification('URL copied to clipboard!');
        };
        
        // Handle close button
        document.getElementById('share-url-close').onclick = () => {
            dialog.style.display = 'none';
            loadProjects(); // Reload the project selector dropdown
        };
    }

    // Function to check for encoded project in URL params
    function checkForSharedProject() {
        const params = new URLSearchParams(window.location.search);
        const projectData = params.get('project');
        
        if (projectData) {
            try {
                let decodedData;
                // First try LZString decompression (new format)
                try {
                    decodedData = LZString.decompressFromEncodedURIComponent(projectData);
                    if (!decodedData) {
                        // Fall back to base64 (old format)
                        decodedData = decodeURIComponent(atob(projectData));
                    }
                } catch (e) {
                    // Fall back to base64 (old format)
                    decodedData = decodeURIComponent(atob(projectData));
                }
                
                const sharedProject = JSON.parse(decodedData);
                
                // Check if a project with the same ID already exists
                const existingProject = getProject(sharedProject.id);
                
                if (existingProject) {
                    // Show the conflict dialog
                    showImportConflictDialog(sharedProject, existingProject);
                } else {
                    // No conflict, just save the project
                    saveProject(sharedProject);
                    openProject(sharedProject.id);
                    showNotification('Shared project imported successfully!');
                    
                    // Clean the URL to avoid reimporting on refresh
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            } catch (error) {
                console.error('Failed to import shared project:', error);
                alert('Failed to import shared project: ' + error.message);
            }
        }
    }
    
    // Show dialog for resolving project import conflicts
    function showImportConflictDialog(sharedProject, existingProject) {
        const dialog = document.getElementById('import-conflict-dialog');
        const messageEl = document.getElementById('import-conflict-message');
        
        messageEl.textContent = `A project with the name "${sharedProject.name}" already exists. What would you like to do?`;
        
        dialog.style.display = 'flex';
        
        // Handle overwrite button
        document.getElementById('import-overwrite').onclick = () => {
            // Overwrite existing project but keep the same ID
            saveProject(sharedProject);
            openProject(sharedProject.id);
            dialog.style.display = 'none';
            showNotification('Project overwritten successfully!');
            
            // Clean the URL to avoid reimporting on refresh
            window.history.replaceState({}, document.title, window.location.pathname);
        };
        
        // Handle create copy button
        document.getElementById('import-new-copy').onclick = () => {
            // Create new project with different ID
            sharedProject.id = uuidv4();
            sharedProject.name = `${sharedProject.name} (Copy)`;
            saveProject(sharedProject);
            openProject(sharedProject.id);
            dialog.style.display = 'none';
            showNotification('Project imported as a copy!');
            
            // Clean the URL to avoid reimporting on refresh
            window.history.replaceState({}, document.title, window.location.pathname);
        };
        
        // Handle cancel button
        document.getElementById('import-cancel').onclick = () => {
            dialog.style.display = 'none';
            
            // Clean the URL to avoid reimporting on refresh
            window.history.replaceState({}, document.title, window.location.pathname);
        };
    }

    await runAsync();
    
    // Check for shared project in URL on page load
    setTimeout(() => {
        checkForSharedProject();
    }, 500); // Short delay to ensure UI is fully loaded
});