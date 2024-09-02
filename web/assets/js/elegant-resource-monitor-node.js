import { app } from '/scripts/app.js'
import { ComfyWidgets } from '/scripts/widgets.js'
import { ElegantResourceMonitorBaseServerNode } from './elegant-base-server-node.js'
import { elegant } from '../../comfyui/elegant.js'
const LAST_SEED_BUTTON_LABEL = '♻️ (Use Last Queued Seed)'
const SPECIAL_SEED_RANDOM = -1
const SPECIAL_SEED_INCREMENT = -2
const SPECIAL_SEED_DECREMENT = -3
const SPECIAL_SEEDS = [SPECIAL_SEED_RANDOM, SPECIAL_SEED_INCREMENT, SPECIAL_SEED_DECREMENT]
class ElegantResourceMonitor extends ElegantResourceMonitorBaseServerNode {
  constructor(title = ElegantResourceMonitor.title) {
    super(title)
    this.title = 'ElegantResourceMonitor'
    this.serialize_widgets = true
    this.lastSeed = undefined
    this.serializedCtx = {}
    this.lastSeedValue = null
    this.randMax = 1125899906842624
    this.randMin = 0
    this.randomRange = 1125899906842624
    this.handleApiHijackingBound = this.handleApiHijacking.bind(this)
    elegant.addEventListener('comfy-api-queue-prompt-before', this.handleApiHijackingBound)
  }
  onRemoved() {
    elegant.addEventListener('comfy-api-queue-prompt-before', this.handleApiHijackingBound)
  }
  configure(info) {
    var _a
    super.configure(info)
    if ((_a = this.properties) === null || _a === void 0 ? void 0 : _a['showLastSeed']) {
      this.addLastSeedValue()
    }
  }
  async handleAction(action) {
    if (action === 'Randomize Each Time') {
      this.seedWidget.value = SPECIAL_SEED_RANDOM
    } else if (action === 'Use Last Queued Seed') {
      this.seedWidget.value = this.lastSeed != null ? this.lastSeed : this.seedWidget.value
      this.lastSeedButton.name = LAST_SEED_BUTTON_LABEL
      this.lastSeedButton.disabled = true
    }
  }
  onNodeCreated() {
    var _a
    ;(_a = super.onNodeCreated) === null || _a === void 0 ? void 0 : _a.call(this)

    for (const [i, w] of this.widgets.entries()) {
    }
    this.addWidget(
      'button',
      '🎲 Randomize Each Time',
      null,
      () => {
        console.log('random')
      },
      { serialize: false },
    )
    this.addWidget(
      'button',
      '🎲 New Fixed Random',
      null,
      () => {
        console.log('fixed')
      },
      { serialize: false },
    )
    this.lastSeedButton = this.addWidget(
      'button',
      '🎲 Last Seed',
      null,
      () => {
        console.log('last seed')
      },
      { width: 50, serialize: false },
    )
    this.lastSeedButton.disabled = true
  }
  getExtraMenuOptions(canvas, options) {
    var _a
    ;(_a = super.getExtraMenuOptions) === null || _a === void 0
      ? void 0
      : _a.apply(this, [...arguments])
    options.splice(options.length - 1, 0, {
      content: 'Show/Hide Last Seed Value',
      callback: (_value, _options, _event, _parentMenu, _node) => {
        this.properties['showLastSeed'] = !this.properties['showLastSeed']
        if (this.properties['showLastSeed']) {
          this.addLastSeedValue()
        } else {
          this.removeLastSeedValue()
        }
      },
    })
  }
  addLastSeedValue() {
    if (this.lastSeedValue) return
    this.lastSeedValue = ComfyWidgets['STRING'](
      this,
      'last_seed',
      ['STRING', { multiline: true }],
      app,
    ).widget
    this.lastSeedValue.inputEl.readOnly = true
    this.lastSeedValue.inputEl.style.fontSize = '0.75rem'
    this.lastSeedValue.inputEl.style.textAlign = 'center'
    this.computeSize()
  }
  removeLastSeedValue() {
    if (!this.lastSeedValue) return
    this.lastSeedValue.inputEl.remove()
    this.widgets.splice(this.widgets.indexOf(this.lastSeedValue), 1)
    this.lastSeedValue = null
    this.computeSize()
  }
  handleApiHijacking(e) {
    var _a, _b, _c, _d
    if (this.mode === LiteGraph.NEVER || this.mode === 4) {
      return
    }
    const workflow = e.detail.workflow
    const output = e.detail.output
    let workflowNode =
      (_b =
        (_a = workflow === null || workflow === void 0 ? void 0 : workflow.nodes) === null ||
        _a === void 0
          ? void 0
          : _a.find((n) => n.id === this.id)) !== null && _b !== void 0
        ? _b
        : null
    let outputInputs =
      (_c = output === null || output === void 0 ? void 0 : output[this.id]) === null ||
      _c === void 0
        ? void 0
        : _c.inputs
    if (
      !workflowNode ||
      !outputInputs ||
      outputInputs[this.seedWidget.name || 'seed'] === undefined
    ) {
      const [n, v] = this.logger.warnParts(
        `Node ${this.id} not found in prompt data sent to server. This may be fine if only ` +
          `queuing part of the workflow. If not, then this could be a bug.`,
      )
      ;(_d = console[n]) === null || _d === void 0 ? void 0 : _d.call(console, ...v)
      return
    }
    const seedToUse = this.getSeedToUse()
    const seedWidgetndex = this.widgets.indexOf(this.seedWidget)
    workflowNode.widgets_values[seedWidgetndex] = seedToUse
    outputInputs[this.seedWidget.name || 'seed'] = seedToUse
    this.lastSeed = seedToUse
    if (seedToUse != this.seedWidget.value) {
      this.lastSeedButton.name = `♻️ ${this.lastSeed}`
      this.lastSeedButton.disabled = false
    } else {
      this.lastSeedButton.name = LAST_SEED_BUTTON_LABEL
      this.lastSeedButton.disabled = true
    }
    if (this.lastSeedValue) {
      this.lastSeedValue.value = `Last Seed: ${this.lastSeed}`
    }
  }
  getSeedToUse() {
    const inputSeed = this.seedWidget.value
    let seedToUse = null
    if (SPECIAL_SEEDS.includes(inputSeed)) {
      if (typeof this.lastSeed === 'number' && !SPECIAL_SEEDS.includes(this.lastSeed)) {
        if (inputSeed === SPECIAL_SEED_INCREMENT) {
          seedToUse = this.lastSeed + 1
        } else if (inputSeed === SPECIAL_SEED_DECREMENT) {
          seedToUse = this.lastSeed - 1
        }
      }
      if (seedToUse == null || SPECIAL_SEEDS.includes(seedToUse)) {
        seedToUse =
          Math.floor(Math.random() * this.randomRange) *
            ((this.seedWidget.options.step || 1) / 10) +
          this.randMin
      }
    }
    return seedToUse !== null && seedToUse !== void 0 ? seedToUse : inputSeed
  }
  static setUp(comfyClass, nodeData) {
    ElegantResourceMonitorBaseServerNode.registerForOverride(
      comfyClass,
      nodeData,
      ElegantResourceMonitor,
    )
  }
  static onRegisteredForOverride(comfyClass, ctxClass) {
    setTimeout(() => {
      ElegantResourceMonitor.category = comfyClass.category
    })
  }
}

ElegantResourceMonitor.title = 'Resource Monitor 📈'
ElegantResourceMonitor.type = 'Resource Monitor'
ElegantResourceMonitor.comfyClass = 'Resource Monitor'
ElegantResourceMonitor.exposedActions = ['Randomize Each Time', 'Use Last Queued Seed']
app.registerExtension({
  name: 'Resource Monitor',
  async beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData.name === ElegantResourceMonitor.type) {
      ElegantResourceMonitor.setUp(nodeType, nodeData)
    }
  },
})
