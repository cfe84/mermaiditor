/**
 * Compression utilities using LZ-String
 */

export function compressProject(project) {
    const projectJson = JSON.stringify(project);
    return LZString.compressToEncodedURIComponent(projectJson);
}

export function decompressProject(compressedData) {
    let decodedData;
    
    // First try LZString decompression (new format)
    try {
        decodedData = LZString.decompressFromEncodedURIComponent(compressedData);
        if (!decodedData) {
            // Fall back to base64 (old format)
            decodedData = decodeURIComponent(atob(compressedData));
        }
    } catch (e) {
        // Fall back to base64 (old format)
        decodedData = decodeURIComponent(atob(compressedData));
    }
    
    return JSON.parse(decodedData);
}