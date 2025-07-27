// File System Access API の型定義
declare global {
  interface Window {
    showDirectoryPicker(options?: {
      id?: string
      mode?: "read" | "readwrite"
      startIn?: FileSystemHandle | string
    }): Promise<FileSystemDirectoryHandle>

    showOpenFilePicker(options?: {
      id?: string
      startIn?: FileSystemHandle | string
      types?: Array<{
        description?: string
        accept: Record<string, string[]>
      }>
      excludeAcceptAllOption?: boolean
      multiple?: boolean
    }): Promise<FileSystemFileHandle[]>
  }

  interface FileSystemHandle {
    readonly kind: "file" | "directory"
    readonly name: string
    isSameEntry(other: FileSystemHandle): Promise<boolean>
    queryPermission(descriptor?: { mode?: "read" | "readwrite" }): Promise<PermissionState>
    requestPermission(descriptor?: { mode?: "read" | "readwrite" }): Promise<PermissionState>
  }

  interface FileSystemFileHandle extends FileSystemHandle {
    readonly kind: "file"
    getFile(): Promise<File>
    createWritable(options?: { keepExistingData?: boolean }): Promise<FileSystemWritableFileStream>
  }

  interface FileSystemDirectoryHandle extends FileSystemHandle {
    readonly kind: "directory"
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>
    keys(): AsyncIterableIterator<string>
    values(): AsyncIterableIterator<FileSystemHandle>
    getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>
    getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>
    removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>
    resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null>
    [Symbol.asyncIterator](): AsyncIterableIterator<[string, FileSystemHandle]>
  }

  interface FileSystemWritableFileStream extends WritableStream {
    write(data: FileSystemWriteChunkType): Promise<void>
    seek(position: number): Promise<void>
    truncate(size: number): Promise<void>
    close(): Promise<void>
  }

  type FileSystemWriteChunkType =
    | BufferSource
    | Blob
    | string
    | { type: "write"; position?: number; data: BufferSource | Blob | string }
    | { type: "seek"; position: number }
    | { type: "truncate"; size: number }
}

export {}
