/**
 * Storage Utilities for localStorage operations
 */

export function saveProject(project) {
    localStorage.setItem(`project-${project.id}`, JSON.stringify(project));
}

export function getProject(id) {
    const project = localStorage.getItem(`project-${id}`);
    return project ? JSON.parse(project) : null;
}

export function getProjects() {
    const projects = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('project-')) {
            const project = JSON.parse(localStorage.getItem(key));
            projects.push(project);
        }
    }
    return projects;
}

export function deleteProject(id) {
    localStorage.removeItem(`project-${id}`);
}

export function saveFile(file) {
    localStorage.setItem(`file-${file.id}`, JSON.stringify(file));
}

export function getFile(id) {
    const file = localStorage.getItem(`file-${id}`);
    return file ? JSON.parse(file) : null;
}

export function getFiles(projectId) {
    const files = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('file-')) {
            const file = JSON.parse(localStorage.getItem(key));
            if (file.projectId === projectId) {
                files.push(file);
            }
        }
    }
    return files;
}

export function deleteFile(id) {
    localStorage.removeItem(`file-${id}`);
}