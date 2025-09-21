/**
 * Models for Project and ProjectReference
 */

/**
 * ProjectReference - Metadata about a project including how to access it
 */
export class ProjectReference {
    constructor(id, storageProvider, storageProviderParameters = {}, theme = 'default', selectedFileId = null) {
        this.id = id;
        this.storageProvider = storageProvider; // e.g., 'localStorage', 'remote', etc.
        this.storageProviderParameters = storageProviderParameters; // e.g., { url: '...', apiKey: '...' }
        this.theme = theme;
        this.selectedFileId = selectedFileId;
    }

    /**
     * Create a ProjectReference from a plain object
     */
    static fromObject(obj) {
        return new ProjectReference(
            obj.id,
            obj.storageProvider,
            obj.storageProviderParameters || {},
            obj.theme || 'default',
            obj.selectedFileId
        );
    }

    /**
     * Convert to plain object for serialization
     */
    toObject() {
        return {
            id: this.id,
            storageProvider: this.storageProvider,
            storageProviderParameters: this.storageProviderParameters,
            theme: this.theme,
            selectedFileId: this.selectedFileId
        };
    }
}

/**
 * Project - The actual project data (minimal, most data is in storage provider)
 */
export class Project {
    constructor(name) {
        this.name = name;
    }

    /**
     * Create a Project from a plain object
     */
    static fromObject(obj) {
        return new Project(obj.name);
    }

    /**
     * Convert to plain object for serialization
     */
    toObject() {
        return {
            name: this.name
        };
    }
}

/**
 * File - Represents a diagram file within a project
 */
export class File {
    constructor(id, name, content, version = null) {
        this.id = id;
        this.name = name;
        this.content = content;
        this.version = version;
    }

    /**
     * Create a File from a plain object
     */
    static fromObject(obj) {
        return new File(obj.id, obj.name, obj.content, obj.version);
    }

    /**
     * Convert to plain object for serialization
     */
    toObject() {
        return {
            id: this.id,
            name: this.name,
            content: this.content,
            version: this.version
        };
    }
}