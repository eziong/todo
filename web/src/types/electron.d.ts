interface DesktopUpdateInfo {
  version: string
  releaseNotes?: string
  releaseDate?: string
}

interface DesktopDownloadProgress {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

interface DesktopUpdateError {
  message: string
}

interface DesktopAPI {
  platform: string
  isElectron: true
  getVersion: () => Promise<string>
  checkForUpdates: () => Promise<void>
  downloadUpdate: () => Promise<void>
  installUpdate: () => Promise<void>
  onUpdateAvailable: (callback: (info: DesktopUpdateInfo) => void) => () => void
  onUpdateNotAvailable: (callback: () => void) => () => void
  onDownloadProgress: (callback: (progress: DesktopDownloadProgress) => void) => () => void
  onUpdateDownloaded: (callback: (info: { version: string }) => void) => () => void
  onUpdateError: (callback: (error: DesktopUpdateError) => void) => () => void
}

interface Window {
  desktop?: DesktopAPI
}
