export type ProjectFileHandle = {name: string; getFile: () => Promise<File>; createWritable: () => Promise<{write: (blob: Blob) => Promise<void>; close: () => Promise<void>; abort: () => Promise<void>}>};
export type ProjectDirectoryHandle = {name: string; kind: 'directory'; queryPermission: (options: {mode: 'readwrite'}) => Promise<PermissionState>; requestPermission: (options: {mode: 'readwrite'}) => Promise<PermissionState>; values: () => AsyncIterable<{name: string; kind: string}>; getFileHandle: (name: string, options?: {create?: boolean}) => Promise<ProjectFileHandle>};
type Pickers = {showDirectoryPicker?: (options: {mode: 'readwrite'}) => Promise<ProjectDirectoryHandle>; showSaveFilePicker?: (options: {suggestedName: string; types: {description: string; accept: Record<string, string[]>}[]}) => Promise<ProjectFileHandle>};
export const directorySupported = () => Boolean((window as unknown as Pickers).showDirectoryPicker);
export const savePickerSupported = () => Boolean((window as unknown as Pickers).showSaveFilePicker);
export function chooseDirectory() {return (window as unknown as Required<Pickers>).showDirectoryPicker({mode: 'readwrite'});}
export function chooseSaveFile(name: string) {return (window as unknown as Required<Pickers>).showSaveFilePicker({suggestedName: name, types: [{description: 'Projet miniDAW', accept: {'application/octet-stream': ['.minidaw']}}]});}
export async function writeProjectFile(handle: ProjectFileHandle, blob: Blob) {
  const writable = await handle.createWritable(); try {await writable.write(blob); await writable.close();} catch (error) {try {await writable.abort();} catch {} throw error;}
}
export async function listProjectFiles(directory: ProjectDirectoryHandle) {
  const files: {name: string; modified: number; size: number}[] = [];
  for await (const entry of directory.values()) if (entry.kind === 'file' && entry.name.toLowerCase().endsWith('.minidaw')) {
    const file = await (await directory.getFileHandle(entry.name)).getFile(); files.push({name: entry.name, modified: file.lastModified, size: file.size});
  }
  return files.sort((a, b) => b.modified - a.modified || a.name.localeCompare(b.name));
}
export async function newProjectFile(directory: ProjectDirectoryHandle, preferred: string): Promise<ProjectFileHandle> {
  const names = new Set<string>(); for await (const entry of directory.values()) names.add(entry.name.toLocaleLowerCase());
  let name = preferred, index = 2; while (names.has(name.toLocaleLowerCase())) name = preferred.replace(/\.minidaw$/i, ` (${index++}).minidaw`);
  return directory.getFileHandle(name, {create: true});
}
async function settings() {
  return new Promise<IDBDatabase>((resolve, reject) => {const request = indexedDB.open('mini-daw-project-folders', 1); request.onupgradeneeded = () => request.result.createObjectStore('settings'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);});
}
export async function rememberDirectory(handle: ProjectDirectoryHandle | null) {
  const database = await settings(); try {await new Promise<void>((resolve, reject) => {const tx = database.transaction('settings', 'readwrite'); if (handle) tx.objectStore('settings').put(handle, 'directory'); else tx.objectStore('settings').delete('directory'); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);});} finally {database.close();}
}
export async function recallDirectory(): Promise<ProjectDirectoryHandle | null> {
  const database = await settings(); try {return await new Promise((resolve, reject) => {const request = database.transaction('settings').objectStore('settings').get('directory'); request.onsuccess = () => resolve(request.result ?? null); request.onerror = () => reject(request.error);});} finally {database.close();}
}
