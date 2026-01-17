export interface AppUpdate {
    version: string;
    date: string;
    changes: string[];
    mandatory: boolean;
    downloadUrl?: string;
    size?: string;
}