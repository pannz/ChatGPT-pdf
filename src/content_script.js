const buttonTemplate = `<button class="btn flex justify-center gap-2 btn-neutral" id="download-png-button">Button</button>`

async function init() {
  const actionsArea = document.querySelector('form>div')
  if (actionsArea) {
    addActionsButtons(actionsArea)
  }
}

const Format = {
  PNG: 'png',
  PDF: 'pdf',
}

function addActionsButtons(actionsArea) {
  const buttonWrap = document.createElement('div')
  buttonWrap.innerHTML = buttonTemplate
  const button = buttonWrap.querySelector('button')

  const downloadImgButton = button.cloneNode(true)
  downloadImgButton.id = 'download-png-button'
  downloadImgButton.setAttribute('share-ext', 'true')
  downloadImgButton.innerText = 'Generate PNG'
  downloadImgButton.onclick = () => {
    downloadThread({ as: Format.PDF })
  }
  actionsArea.appendChild(downloadImgButton)

  const downloadPdfButton = TryAgainButton.cloneNode(true)
  downloadPdfButton.id = 'download-pdf-button'
  downloadPdfButton.setAttribute('share-ext', 'true')
  downloadPdfButton.innerText = 'Download PDF'
  downloadPdfButton.onclick = () => {
    downloadThread({ as: Format.PDF })
  }
  actionsArea.appendChild(downloadPdfButton)
}

function downloadThread({ as = Format.PNG } = {}) {
  const elements = new Elements()
  elements.fixLocation()
  const pixelRatio = window.devicePixelRatio
  const minRatio = as === Format.PDF ? 2 : 2.5
  window.devicePixelRatio = Math.max(pixelRatio, minRatio)

  html2canvas(elements.thread, {
    letterRendering: true,
  }).then(async function (canvas) {
    elements.restoreLocation()
    window.devicePixelRatio = pixelRatio
    const imgData = canvas.toDataURL('image/png')
    requestAnimationFrame(() => {
      if (as === Format.PDF) {
        return handlePdf(imgData, canvas, pixelRatio)
      } else {
        handleImg(imgData)
      }
    })
  })
}

function handleImg(imgData) {
  const binaryData = atob(imgData.split('base64,')[1])
  const data = []
  for (let i = 0; i < binaryData.length; i++) {
    data.push(binaryData.charCodeAt(i))
  }
  const blob = new Blob([new Uint8Array(data)], { type: 'image/png' })
  const url = URL.createObjectURL(blob)

  window.open(url, '_blank')
}

function handlePdf(imgData, canvas, pixelRatio) {
  const { jsPDF } = window.jspdf
  const orientation = canvas.width > canvas.height ? 'l' : 'p'
  var pdf = new jsPDF(orientation, 'pt', [
    canvas.width / pixelRatio,
    canvas.height / pixelRatio,
  ])
  var pdfWidth = pdf.internal.pageSize.getWidth()
  var pdfHeight = pdf.internal.pageSize.getHeight()
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
  pdf.save('chat-gpt.pdf')
}

class Elements {
  constructor() {
    this.init()
  }
  init() {
    this.spacer = document.querySelector('.w-full.h-48.flex-shrink-0')
    this.thread = document.querySelector(
      "[class*='react-scroll-to-bottom']>[class*='react-scroll-to-bottom']>div"
    )
    this.positionForm = document.querySelector('form').parentNode
    this.scroller = Array.from(
      document.querySelectorAll('[class*="react-scroll-to"]')
    ).filter((el) => el.classList.contains('h-full'))[0]
    this.hiddens = Array.from(document.querySelectorAll('.overflow-hidden'))
    this.images = Array.from(document.querySelectorAll('img[srcset]'))
  }
  fixLocation() {
    this.hiddens.forEach((el) => {
      el.classList.remove('overflow-hidden')
    })
    this.spacer.style.display = 'none'
    this.thread.style.maxWidth = '960px'
    this.thread.style.marginInline = 'auto'
    this.positionForm.style.display = 'none'
    this.scroller.classList.remove('h-full')
    this.scroller.style.minHeight = '100vh'
    this.images.forEach((img) => {
      const srcset = img.getAttribute('srcset')
      img.setAttribute('srcset_old', srcset)
      img.setAttribute('srcset', '')
    })
    //Fix to the text shifting down when generating the canvas
    document.body.style.lineHeight = '0.5'
  }
  restoreLocation() {
    this.hiddens.forEach((el) => {
      el.classList.add('overflow-hidden')
    })
    this.spacer.style.display = null
    this.thread.style.maxWidth = null
    this.thread.style.marginInline = null
    this.positionForm.style.display = null
    this.scroller.classList.add('h-full')
    this.scroller.style.minHeight = null
    this.images.forEach((img) => {
      const srcset = img.getAttribute('srcset_old')
      img.setAttribute('srcset', srcset)
      img.setAttribute('srcset_old', '')
    })
    document.body.style.lineHeight = null
  }
}

function selectElementByClassPrefix(classPrefix) {
  const element = document.querySelector(`[class^='${classPrefix}']`)
  return element
}

function getData() {
  const globalCss = getCssFromSheet(
    document.querySelector('link[rel=stylesheet]').sheet
  )
  const localCss =
    getCssFromSheet(
      document.querySelector(`style[data-styled][data-styled-version]`).sheet
    ) || 'body{}'
  const data = {
    main: document.querySelector('main').outerHTML,
    // css: `${globalCss} /* GLOBAL-LOCAL */ ${localCss}`,
    globalCss,
    localCss,
  }
  return data
}

function getCssFromSheet(sheet) {
  return Array.from(sheet.cssRules)
    .map((rule) => rule.cssText)
    .join('')
}

// run init
if (
  document.readyState === 'complete' ||
  document.readyState === 'interactive'
) {
  init()
} else {
  document.addEventListener('DOMContentLoaded', init)
}
