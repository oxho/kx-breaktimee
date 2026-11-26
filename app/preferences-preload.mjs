import { contextBridge, ipcRenderer } from 'electron'
import {
  exposeElectronApi,
  exposeGlobal,
  exposeI18next,
  exposeRuntime,
  exposeSettings,
  exposeStretchly,
  exposeUtils
} from './utils/context-bridge-exposers.js'

exposeElectronApi()
exposeGlobal()
exposeI18next()
exposeRuntime()
exposeSettings()
exposeStretchly()
exposeUtils()

contextBridge.exposeInMainWorld('kxSettingsAds', {
  load: () => ipcRenderer.invoke('kx-ads:load'),
  interact: (id, type) => ipcRenderer.invoke('kx-ads:interact', id, type)
})
contextBridge.exposeInMainWorld('kxBusyTimes', {
  load: () => ipcRenderer.invoke('kx-busy-times:load'),
  save: rows => ipcRenderer.invoke('kx-busy-times:save', rows)
})
