var styles = document.createElement('link')
styles.href = '/extensions/ComfyUI-Elegant-Resource-Monitor/assets/css/styles.css'
styles.property = 'stylesheet'
styles.rel = 'stylesheet'

styles.onload = async function () {
  if (localStorage.getItem('lastClass') && localStorage.getItem('lastInactiveClass')) {
    var lastClass = JSON.parse(localStorage.getItem('lastClass'))
    var lastInactiveClass = JSON.parse(localStorage.getItem('lastInactiveClass'))
    addCSS(lastInactiveClass.key, lastInactiveClass.values[0])
    addCSS(lastClass.key, lastClass.values[0])
  }
}

function addCSS(selector, styles) {
  var rule = getCSSRule(selector)

  for (var property in styles) {
    if (styles.hasOwnProperty(property)) {
      rule.style.setProperty(property, styles[property], 'important')
    }
  }
}

function getCSSRule(ruleName) {
  ruleName = ruleName.toLowerCase()
  var result = null
  var find = Array.prototype.find

  Array.prototype.find.call(document.styleSheets, (styleSheet) => {
    try {
      if (styleSheet.cssRules) {
        result = find.call(styleSheet.cssRules, (cssRule) => {
          return cssRule instanceof CSSStyleRule && cssRule.selectorText.toLowerCase() == ruleName
        })
      }
    } catch (e) {
      // Handle cross-origin or other access errors
      console.warn('Cannot access cssRules for stylesheet:', e)
    }
    return result != null
  })
  return result
}
document.head.appendChild(styles)

// Call the setup function
await setupResourceMonitor()

// Fetch HTML content and set it to the resourceMonitorContent
async function setupResourceMonitor() {
  try {
    const response = await fetch(
      '/extensions/ComfyUI-Elegant-Resource-Monitor/templates/perf-monitor/perf-monitor.html',
    )

    const content = await response.text()
    // Create a placeholder for the content fetched via AJAX
    var resourceMonitorContent = document.createElement('div')

    resourceMonitorContent.innerHTML = content

    // Find the #chart-button element in the loaded content
    const chartButton = resourceMonitorContent.querySelector('#chart-button')
    // Get the saved position
    const savedPosition = localStorage.getItem('perf-monitor-position') || 'bottom-right'

    if (chartButton) {
      // Set the savedPosition class on the #chart-button element
      chartButton.classList.add(savedPosition)
    }

    // Create the new resource monitor div
    var resourceMonitorDiv = document.createElement('div')

    // Insert the fetched content into the resourceMonitorDiv
    resourceMonitorDiv.appendChild(resourceMonitorContent)

    // Find the hamburgerDiv and its parent
    var hamburgerDiv = document.querySelector('.comfy-menu-hamburger')
    if (hamburgerDiv) {
      var parentDiv = hamburgerDiv.parentNode

      // Insert the resourceMonitorDiv before the hamburgerDiv
      parentDiv.insertBefore(resourceMonitorDiv, hamburgerDiv)
    } else {
      console.error('Hamburger div not found')
    }
  } catch (error) {
    console.error('Failed to fetch or process the resource monitor content:', error)
  }
}
