export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    webViewLink?: string;
    createdTime?: string;
    modifiedTime?: string;
    size?: string;
}

export interface DriveFolder {
    id: string;
    name: string;
}