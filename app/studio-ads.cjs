const { randomUUID } = require('node:crypto')
const { ipcMain, shell } = require('electron')

const slot = 'settings.banner'
const origin = 'https://8.137.20.181'
const maxArtworkBytes = 2 * 1024 * 1024
const platform = { win32: 'Windows', darwin: 'macOS', linux: 'Linux' }[process.platform] || process.platform

function serverOrigin () {
  const override = process.env.KX_AD_TEST_ORIGIN
  if (!override) return origin
  const url = new URL(override)
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || url.username || url.password) {
    throw new Error('广告测试地址必须在本机')
  }
  return url.origin
}

async function responseBytes (response, limit) {
  if (!response.ok || !response.body || Number(response.headers.get('content-length')) > limit) {
    throw new Error('广告响应不可用')
  }
  const reader = response.body.getReader()
  const chunks = []
  let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > limit) throw new Error('广告响应超出大小限制')
      chunks.push(value)
    }
    return Buffer.concat(chunks, length)
  } finally {
    await reader.cancel().catch(() => {})
  }
}

function registerStudioAds ({ appId, version, getSettingsWindow }) {
  const active = new WeakMap()
  const requests = new WeakMap()

  const settingsContents = (event) => {
    const contents = getSettingsWindow()?.webContents
    return event.sender === contents && event.senderFrame === contents.mainFrame ? contents : null
  }

  ipcMain.handle('kx-ads:load', async (event) => {
    const contents = settingsContents(event)
    if (!contents || contents.isDestroyed()) return null
    const requestId = Symbol('house ad request')
    requests.set(contents, requestId)
    let placement = null
    try {
      const base = serverOrigin()
      const endpoint = `${base}/v2/apps/${appId}`
      const query = new URLSearchParams({ app_version: version })
      if (process.env.KX_AD_TEST_ORIGIN) query.set('test', '1')
      const request = () => ({ redirect: 'error', signal: AbortSignal.timeout(3000) })
      const configuration = await fetch(`${endpoint}/ads?${query}`, request())
      const config = JSON.parse(await responseBytes(configuration, 64 * 1024))
      if (config.app_id !== appId || !Array.isArray(config.placements)) return null
      const row = config.placements.find((ad) => ad?.slot === slot && ad.kind === 'banner')
      if (!row || typeof row.title !== 'string' || !row.title.trim()) return null
      const asset = new URL(row.asset)
      const target = new URL(row.target)
      if (asset.origin !== base || asset.username || asset.password || target.username || target.password ||
                (target.protocol !== 'https:' && target.origin !== base)) return null
      const artwork = await fetch(asset, request())
      const mime = artwork.headers.get('content-type')?.split(';')[0]
      if (!['image/png', 'image/jpeg'].includes(mime)) return null
      const bitmap = await responseBytes(artwork, maxArtworkBytes)
      if (contents.isDestroyed() || requests.get(contents) !== requestId) return null
      const key = JSON.stringify([row.campaign_id, row.creative_id, row.creative_version, asset.href, target.href, row.title])
      const prior = active.get(contents)
      const current = prior?.key === key ? prior : { key, exposureId: randomUUID(), seen: new Set(), dismissed: false }
      current.target = target.href
      current.report = row.campaign_id && row.creative_id && row.creative_version
        ? {
            slot,
            campaign_id: row.campaign_id,
            creative_id: row.creative_id,
            creative_version: row.creative_version,
            platform,
            app_version: version,
            is_test: row.is_test === true,
            exposure_id: current.exposureId
          }
        : null
      current.endpoint = endpoint
      active.set(contents, current)
      placement = { id: current.exposureId, title: row.title.slice(0, 100), artwork: `data:${mime};base64,${bitmap.toString('base64')}` }
      return placement
    } catch {
      return null
    } finally {
      if (!placement && requests.get(contents) === requestId) active.delete(contents)
    }
  })

  ipcMain.handle('kx-ads:interact', (event, id, action) => {
    const contents = settingsContents(event)
    const current = contents && active.get(contents)
    if (!current?.target || current.exposureId !== id || current.dismissed ||
            !['impression', 'click', 'dismiss'].includes(action)) return
    if (action === 'dismiss') current.dismissed = true
    if (action === 'click') shell.openExternal(current.target).catch(() => {})
    if (!current.report || current.seen.has(action)) return
    current.seen.add(action)
    return fetch(`${current.endpoint}/events`, {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(2500),
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...current.report, event_id: randomUUID(), event_type: action })
    }).then((response) => response.body?.cancel()).catch(() => {})
  })
}

module.exports = { registerStudioAds }
