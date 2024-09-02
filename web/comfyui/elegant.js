import { app, ComfyApp } from '/scripts/app.js'
import { api } from '/scripts/api.js'
import { iconGear, iconNode, iconReplace, iconStarFilled } from './svgs.js'
import { injectCss } from './shared_utils.js'

class Elegant extends EventTarget {
  constructor() {
    var _a, _b, _c, _d
    super()
    this.api = api
    this.settingsDialog = null
    this.progressBarEl = null
    this.queueNodeIds = null
    this.monitorBadLinksAlerted = false
    this.monitorLinkTimeout = null
    this.processingQueue = false
    this.loadingApiJson = false
    this.replacingReroute = null
    this.processingMouseDown = false
    this.processingMouseUp = false
    this.processingMouseMove = false
    this.lastAdjustedMouseEvent = null
    this.canvasCurrentlyCopyingToClipboard = false
    this.canvasCurrentlyCopyingToClipboardWithMultipleNodes = false
    this.initialGraphToPromptSerializedWorkflowBecauseComfyUIBrokeStuff = null
    this.elDebugKeydowns = null
    this.nodes = []
    this.isMac = !!(
      ((_a = navigator.platform) === null || _a === void 0
        ? void 0
        : _a.toLocaleUpperCase().startsWith('MAC')) ||
      ((_c = (_b = navigator.userAgentData) === null || _b === void 0 ? void 0 : _b.platform) ===
        null || _c === void 0
        ? void 0
        : _c.toLocaleUpperCase().startsWith('MAC'))
    )

    this.initializeGraphAndCanvasHooks()
    // Wrap the method
    const originalGetNodeDefs = api.getNodeDefs.bind(api)

    api.getNodeDefs = async function (...args) {
      // Trigger a custom event before calling the original method
      const event = new CustomEvent('getNodeDefsCalled', {
        detail: { args },
      })
      window.dispatchEvent(event)

      // Call the original method
      const result = await originalGetNodeDefs(...args)

      // Optionally, you can also dispatch another event after the method completes
      window.dispatchEvent(
        new CustomEvent('getNodeDefsCompleted', {
          detail: { result },
        }),
      )

      return result
    }

    // Add event listeners
    window.addEventListener('getNodeDefsCalled', (event) => {})

    window.addEventListener('getNodeDefsCompleted', (event) => {
      this.nodes = Object.values(event.detail.result).filter((n) => n.category.includes('CCTech'))
    })

    this.initializeContextMenu()
    this.cssPromise = injectCss('extensions/ComfyUI-Elegant-Resource-Monitor/comfyui/elegant.css')
  }

  async initializeGraphAndCanvasHooks() {
    const elegant = this
    const graphSerialize = LGraph.prototype.serialize
    LGraph.prototype.serialize = function () {
      const response = graphSerialize.apply(this, [...arguments])
      elegant.initialGraphToPromptSerializedWorkflowBecauseComfyUIBrokeStuff = response
      return response
    }
    const processMouseDown = LGraphCanvas.prototype.processMouseDown
    LGraphCanvas.prototype.processMouseDown = function (e) {
      elegant.processingMouseDown = true
      const returnVal = processMouseDown.apply(this, [...arguments])
      elegant.dispatchCustomEvent('on-process-mouse-down', { originalEvent: e })
      elegant.processingMouseDown = false
      return returnVal
    }
    const adjustMouseEvent = LGraphCanvas.prototype.adjustMouseEvent
    LGraphCanvas.prototype.adjustMouseEvent = function (e) {
      adjustMouseEvent.apply(this, [...arguments])
      elegant.lastAdjustedMouseEvent = e
    }
    const copyToClipboard = LGraphCanvas.prototype.copyToClipboard
    LGraphCanvas.prototype.copyToClipboard = function (nodes) {
      elegant.canvasCurrentlyCopyingToClipboard = true
      elegant.canvasCurrentlyCopyingToClipboardWithMultipleNodes =
        Object.values(nodes || this.selected_nodes || []).length > 1
      copyToClipboard.apply(this, [...arguments])
      elegant.canvasCurrentlyCopyingToClipboard = false
      elegant.canvasCurrentlyCopyingToClipboardWithMultipleNodes = false
    }
    const onGroupAdd = LGraphCanvas.onGroupAdd
    LGraphCanvas.onGroupAdd = function (...args) {
      const graph = app.graph
      onGroupAdd.apply(this, [...args])
      LGraphCanvas.onShowPropertyEditor(
        {},
        null,
        null,
        null,
        graph._groups[graph._groups.length - 1],
      )
    }
  }

  async invokeExtensionsAsync(method, ...args) {
    return Promise.resolve()
  }
  dispatchCustomEvent(event, detail) {
    if (detail != null) {
      return this.dispatchEvent(new CustomEvent(event, { detail }))
    }
    return this.dispatchEvent(new CustomEvent(event))
  }
  async initializeContextMenu() {
    const that = this
    setTimeout(async () => {
      const getCanvasMenuOptions = LGraphCanvas.prototype.getCanvasMenuOptions
      LGraphCanvas.prototype.getCanvasMenuOptions = function (...args) {
        let existingOptions = getCanvasMenuOptions.apply(this, [...args])
        const options = []
        options.push(null)
        options.push(null)
        options.push(null)
        options.push({
          content: `🤖 CCTech`,
          className: 'elegant-contextmenu-item elegant-contextmenu-main-item-elegant-comfy',
          submenu: {
            options: that.getElegantContextMenuItems(),
          },
        })
        options.push(null)
        options.push(null)
        let idx = null
        idx =
          idx ||
          existingOptions.findIndex((o) => {
            var _a, _b
            return (_b =
              (_a = o === null || o === void 0 ? void 0 : o.content) === null || _a === void 0
                ? void 0
                : _a.startsWith) === null || _b === void 0
              ? void 0
              : _b.call(_a, 'Queue Group')
          }) + 1
        idx =
          idx ||
          existingOptions.findIndex((o) => {
            var _a, _b
            return (_b =
              (_a = o === null || o === void 0 ? void 0 : o.content) === null || _a === void 0
                ? void 0
                : _a.startsWith) === null || _b === void 0
              ? void 0
              : _b.call(_a, 'Queue Selected')
          }) + 1
        idx =
          idx ||
          existingOptions.findIndex((o) => {
            var _a, _b
            return (_b =
              (_a = o === null || o === void 0 ? void 0 : o.content) === null || _a === void 0
                ? void 0
                : _a.startsWith) === null || _b === void 0
              ? void 0
              : _b.call(_a, 'Convert to Group')
          })
        idx =
          idx ||
          existingOptions.findIndex((o) => {
            var _a, _b
            return (_b =
              (_a = o === null || o === void 0 ? void 0 : o.content) === null || _a === void 0
                ? void 0
                : _a.startsWith) === null || _b === void 0
              ? void 0
              : _b.call(_a, 'Arrange (')
          })
        idx = idx || existingOptions.findIndex((o) => !o) + 1
        idx = idx || 3
        existingOptions.splice(idx, 0, ...options)
        for (let i = existingOptions.length; i > 0; i--) {
          if (existingOptions[i] === null && existingOptions[i + 1] === null) {
            existingOptions.splice(i, 1)
          }
        }
        return existingOptions
      }
    }, 1016)
  }
  getElegantContextMenuItems() {
    const [canvas, graph] = [app.canvas, app.graph]
    const selectedNodes = Object.values(canvas.selected_nodes || {})
    let rerouteNodes = []
    if (selectedNodes.length) {
      rerouteNodes = selectedNodes.filter((n) => n.type === 'Reroute')
    } else {
      rerouteNodes = graph._nodes.filter((n) => n.type == 'Reroute')
    }
    const rerouteLabel = selectedNodes.length ? 'selected' : 'all'
    const bookmarkMenuItems = getBookmarks() ?? []
    return [
      {
        content: 'Nodes',
        disabled: true,
        className: 'elegant-contextmenu-item elegant-contextmenu-label',
      },
      {
        content: iconNode + 'All',
        className: 'elegant-contextmenu-item',
        has_submenu: true,
        submenu: {
          options: this.nodes.map((n) => n.display_name),
          callback: (value, options, event) => {
            const nodeValue = this.nodes.find((n) => n.display_name.includes(value))
            const node = LiteGraph.createNode(nodeValue.name)
            node.pos = [this.lastAdjustedMouseEvent.canvasX, this.lastAdjustedMouseEvent.canvasY]
            canvas.graph.add(node)
            canvas.selectNode(node)
            app.graph.setDirtyCanvas(true, true)
          },
          extra: { elegant_doNotNest: true },
        },
      },
      // {
      //   content: 'Actions',
      //   disabled: true,
      //   className: 'elegant-contextmenu-item elegant-contextmenu-label',
      // },
      // {
      //   content: iconGear + 'Settings (coming soon)',
      //   disabled: true,
      //   className: 'elegant-contextmenu-item',
      //   callback: (...args) => {
      //     this.settingsDialog.addEventListener('close', (e) => {
      //       this.settingsDialog = null
      //     })
      //   },
      // },
      ...bookmarkMenuItems,
      {
        content: 'More...',
        disabled: true,
        className: 'elegant-contextmenu-item elegant-contextmenu-label',
      },
      {
        content: iconStarFilled + 'Star on Github',
        className: 'elegant-contextmenu-item elegant-contextmenu-github',
        callback: (...args) => {
          window.open('https://github.com/ChrisColeTech/', '_blank')
        },
      },
    ]
  }
}
function getBookmarks() {
  const graph = app.graph
  const bookmarks = graph._nodes
    .filter((n) => n.type === 'NodeTypesString.BOOKMARK')
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((n) => ({
      content: `[${n.shortcutKey}] ${n.title}`,
      className: 'elegant-contextmenu-item',
      callback: () => {
        n.canvasToBookmark()
      },
    }))
  return !bookmarks.length
    ? []
    : [
        {
          content: '🔖 Bookmarks',
          disabled: true,
          className: 'elegant-contextmenu-item elegant-contextmenu-label',
        },
        ...bookmarks,
      ]
}
export const elegant = new Elegant()
window.elegant = elegant
