/**
 * 
 * @param {HTMLTemplateElement} template 
 * @param {{}} obj 
 * @returns {DocumentFragment}
 */
export function fillDeclarativeTemplate(template, obj) {

  // Use always duplicate character for interpolation
  const interpolationStart = '{{'
  const interpolationEnd   = '}}'

  const loopAttributeName = '[for]'
  const loopItemPrefix    = '@'
  const loopIndexPrefix   = '#'

  function getInterpolationTokens(string) {
    // const regex = /.{0}(?={{[^{^}]+}})|(?<={{[^{^}]+}}).{0}/

    const regex = new RegExp(`.{0}(?=${interpolationStart}[^${interpolationStart[0]}^${interpolationEnd[0]}]+${interpolationEnd})|(?<=${interpolationStart}[^${interpolationStart[0]}^${interpolationEnd[0]}]+${interpolationEnd}).{0}`)
    return string.trim().split(regex).filter(s => s !== '')
  }

  function getElementsByAttribute(attr, options = {}) {
    const {startNode = document} = options
  
    const nodeList = [...startNode.querySelectorAll('*')]
    return nodeList.filter(n => n.hasAttribute(attr))
  }

  function setAttribute(element, attrName, attrValue = '') {
    const div = document.createElement('div')
    div.innerHTML = `<div ${attrName}="${attrValue}"></div>`
  
    const attribute = div.children[0].attributes[attrName].cloneNode()
  
    element.attributes.setNamedItem(attribute)
  
    return attribute
  }

  function getValueFromPropertyPath(obj, propertyPath) {
    if (propertyPath == null) return obj
  
    const propertyPathSplit = propertyPath.split('.')
  
    let valueHolder = obj
  
    for (let k = 0; k < propertyPathSplit.length; k++) {
      const property = propertyPathSplit[k]
  
      const isPrimitive = value => ['object', 'function'].every(type => typeof value !== type)
  
      if (
        isPrimitive(valueHolder) && !(property in Object.getPrototypeOf(valueHolder)) ||
        !isPrimitive(valueHolder) && !(property in valueHolder)
      ) {
        console.error(`PropertyPathError: property '${property}' does not exists in ${typeof valueHolder}`, typeof valueHolder === 'string' ? `'${valueHolder}'` : valueHolder, `from source ${typeof obj}`, typeof obj === 'string' ? `'${obj}'` : obj, `from the property path '${propertyPath}'`)
        return 'undefined'
      }
  
      valueHolder = valueHolder[property]
    }
  
    return valueHolder
  }

  function computeValueFromInterpolationTokens(tokens, obj) {
    return tokens.map(text => {
      if (!text.startsWith(interpolationStart) || !text.endsWith(interpolationEnd)) return text

      const propertyPath = text.replace(interpolationStart, '').replace(interpolationEnd, '')

      if (propertyPath.startsWith(loopItemPrefix) || propertyPath.startsWith(loopIndexPrefix)) return text

      return getValueFromPropertyPath(obj, propertyPath)
    }).join('')
  }

  function computeValueFromInterpolationTokensLoop(tokens, item, itemName, indexName, currentIndex) {
    return tokens.map(text => {
      if (!text.startsWith(interpolationStart) || !text.endsWith(interpolationEnd)) return text

      const itemPropertyPath = text.replace(interpolationStart, '').replace(interpolationEnd, '')

      if (itemPropertyPath.startsWith(`${loopIndexPrefix}${indexName}`)) return currentIndex

      if (!itemPropertyPath.startsWith(`${loopItemPrefix}${itemName}.`) && itemPropertyPath !== `${loopItemPrefix}${itemName}`) return text

      const propertyPath = itemPropertyPath.replace(`${loopItemPrefix}${itemName}.`, '').replace(`${loopItemPrefix}${itemName}`, '') || null

      return getValueFromPropertyPath(item, propertyPath)
    }).join('')
  }

  function computeElementAttributes(element, obj) {
    const attributes = [...element.attributes].filter(attr => attr.nodeName !== loopAttributeName)

    for (let k = 0; k < attributes.length; k++) {
      const attribute = attributes[k]

      const tokens = getInterpolationTokens(attribute.value)

      attribute.value = computeValueFromInterpolationTokens(tokens, obj)
    }
  }

  function computeElementAttributesLoop(element, item, itemName, indexName, currentIndex) {
    const attributes = [...element.attributes].filter(attr => attr.nodeName !== loopAttributeName)

    for (let k = 0; k < attributes.length; k++) {
      const attribute = attributes[k]

      const tokens = getInterpolationTokens(attribute.value)

      attribute.value = computeValueFromInterpolationTokensLoop(tokens, item, itemName, indexName, currentIndex)
    }
  }

  function computeElementTextNodes(element, obj) {
    const childNodes = element.childNodes

    for (let j = 0; j < childNodes.length; j++) {
      const node = childNodes[j]

      if (!(node instanceof Text)) continue

      const tokens = getInterpolationTokens(node.nodeValue)

      node.nodeValue = computeValueFromInterpolationTokens(tokens, obj)
    }
  }

  function computeElementTextNodesLoop(element, item, itemName, indexName, currentIndex) {
    const childNodes = element.childNodes

    for (let k = 0; k < childNodes.length; k++) {
      const node = childNodes[k]

      if (!(node instanceof Text)) continue

      const tokens = getInterpolationTokens(node.nodeValue)

      node.nodeValue = computeValueFromInterpolationTokensLoop(tokens, item, itemName, indexName, currentIndex)
    }
  }

  function fillDeclarativeElementTree(element, obj) {
    computeElementAttributes(element, obj)
    computeElementTextNodes(element, obj)
  }

  function fillDeclarativeElementTreeLoop(loopElement, obj) {
    const loopTokens = loopElement.getAttribute(loopAttributeName).split(/; ?/)

    const propertyPathAndItemName = loopTokens[0].split(' ')

    const itemName = propertyPathAndItemName[0]
    const collectionPropertyPath = propertyPathAndItemName[2]

    const indexName = loopTokens[1]

    if (collectionPropertyPath.includes(loopItemPrefix)) return

    loopElement.removeAttribute(loopAttributeName)


    const collection = getValueFromPropertyPath(obj, collectionPropertyPath)

    // Save reference for the last element to keep appending elements one after another
    let currentElement = loopElement

    const fistElement = loopElement

    // Read collection

    for (let i = 0; i < collection.length; i++) {
      const item = collection[i]

      const elementCopy = loopElement.cloneNode(true)

      // Read element itself

      computeElementAttributesLoop(elementCopy, item, itemName, indexName, i)
      computeElementTextNodesLoop(elementCopy, item, itemName, indexName, i)


      const innerLoops = getElementsByAttribute(loopAttributeName, {startNode: elementCopy})

      for (let j = 0; j < innerLoops.length; j++) {
        const innerLoop = innerLoops[j]

        const loopTokens = innerLoop.getAttribute(loopAttributeName).split(/; ?/)

        const itemNameAndPropertyPath = loopTokens[0].split(' ')

        const innerItemName = itemNameAndPropertyPath[0]
        const innerCollectionPropertyPath = itemNameAndPropertyPath[2]

        const innerIndexName = loopTokens[1]

        // const attrValue = innerLoop.getAttribute(loopAttributeName)

        // const tokens = attrValue.split(' ')

        // const innerCollectionPropertyPath = tokens[2]

        if (innerCollectionPropertyPath !== `${loopItemPrefix}${itemName}` && !innerCollectionPropertyPath.startsWith(`${loopItemPrefix}${itemName}.`)) continue

        const computedInnerCollectionPropertyPath = innerCollectionPropertyPath.replace(`${loopItemPrefix}${itemName}`, `${collectionPropertyPath}.${i}`)
        const value = `${innerItemName} of ${computedInnerCollectionPropertyPath}${innerIndexName ? `; ${innerIndexName}`: ''}`

        setAttribute(innerLoop, loopAttributeName, value)
      }


      // Read element childs

      const childs = elementCopy.querySelectorAll('*')

      for (let j = 0; j < childs.length; j++) {
        const child = childs[j]

        computeElementAttributesLoop(child, item, itemName, indexName, i)
        computeElementTextNodesLoop(child, item, itemName, indexName, i)
      }

      currentElement.after(elementCopy)

      currentElement = elementCopy
    }

    fistElement.remove()
  }

  if (template instanceof HTMLTemplateElement) {
    const content = template.content.cloneNode(true)

    // Read elements

    const childs = content.querySelectorAll('*')

    for (let i = 0; i < childs.length; i++) {
      fillDeclarativeElementTree(childs[i], obj)
    }

    // Read loop elements

    let loopChilds

    while (loopChilds = getElementsByAttribute(loopAttributeName, {startNode: content}), loopChilds.length) {
      for (let i = 0; i < loopChilds.length; i++) {
        fillDeclarativeElementTreeLoop(loopChilds[i], obj)
      }
    }

    return content
  }

}



/**
 * @typedef Filter
 * @property {string} name
 * @property {string[]} list
 */

/**
 * @typedef Job
 * @property {string} name
 * @property {string} icon
 * @property {{value: string, ui_value: string}} location
 * @property {string[]} tags
 * @property {boolean} isPaymentVerified
 * @property {{name: string, time: string, details: {experience: string, location: string, salary_range: string}, company_overview: string, requirements: string[]}} info
 */

/**
 * 
 * @returns {Promise<{filters: Filter[], jobs: Job[]}>}
 */
export function getJobData() {
  return fetch('./assets/job-data.json').then(r => r.json()).catch(() => null)
}

export function filterJobOfferts(jobData, filterState) {
  const isAnyFilterApplied = Object.values(filterState).some(filterTypeValues => {
    return Object.values(filterTypeValues).some(filterNameValue => filterNameValue)
  })

  let displayedJobs = jobData

  // Show if it matches at least one of the filters

  // if (isAnyFilterApplied) {
  //   displayedJobs = displayedJobs.filter(job => {
  //     let matchAnyFilter = false

  //     if (filterState.Location[job.location.value]) matchAnyFilter = true

  //     if (job.isPaymentVerified) {
  //       if (filterState.Payment.Verified) matchAnyFilter = true
  //     } else {
  //       if (filterState.Payment.Unverified) matchAnyFilter = true
  //     }

  //     if (filterState.Level[job.info.details.experience]) matchAnyFilter = true

  //     return matchAnyFilter
  //   })
  // }

  // Show if it matches all the filters

  if (isAnyFilterApplied) {
    displayedJobs = displayedJobs.filter(job => {
      for (const locationName in filterState.Location) {
        if (!filterState.Location[locationName]) continue

        if (job.location.value !== locationName) return false
      }

      for (const paymentName in filterState.Payment) {
        if (!filterState.Payment[paymentName]) continue

        switch (paymentName) {
          case 'Verified':
            if (!job.isPaymentVerified) return false
          break

          case 'Unverified':
            if (job.isPaymentVerified) return false
          break

          default:
        }
      }

      for (const levelName in filterState.Level) {
        if (!filterState.Level[levelName]) continue

        if (job.info.details.experience !== levelName) return false
      }

      return true
    })
  }

  return displayedJobs
}

/**
 * 
 * @param {HTMLElement} container 
 * @param {HTMLTemplateElement} template 
 * @param {Filter[]} filters
 */
export function populateAsideFilterUI(filterAside, filterAsideTemplate, filters) {
  const filterAsideContent = fillDeclarativeTemplate(filterAsideTemplate, {filters})
  filterAside.append(filterAsideContent)
}


/**
 * 
 * @param {HTMLElement} container 
 * @param {HTMLTemplateElement} template 
 * @param {Job[]} jobs 
 */
 export function populateJobCardsUI(jobCardsContainer, jobCardtemplate, jobs) {
  jobCardsContainer.innerHTML = ''

  const jobCardsContent = fillDeclarativeTemplate(jobCardtemplate, {jobs})
  jobCardsContainer.append(jobCardsContent)
}




/**
 * 
 * @param {HTMLElement} container 
 * @param {HTMLTemplateElement} template 
 * @param {Job} jobData 
 */

export function displayJobInfoUI(jobInfoContainer, jobInfoTemplate, jobData) {
  jobInfoContainer.innerHTML = ''

  const jobInfoContent = fillDeclarativeTemplate(jobInfoTemplate, jobData)
  jobInfoContainer.append(jobInfoContent)
}






/**
 * @param {Document | Element} node
 * @returns {{[key: string]: HTMLElement}}
 */
export function getAllElementsMapWithDataJSAttribute(node = document) {
  const hyphenToLowerCase = string => string.split('-').map((str, index) => index !== 0 ? str[0].toUpperCase() + str.slice(1) : str).join('')

  if (node == null) throw new TypeError(`param 1 cannot be null or undefined`)
  if (!(node instanceof Element || node instanceof Document)) throw new TypeError(`param 1 must be an instance of Element or Document`)

  const elements = node.querySelectorAll('*')

  const map = {}

  elements.forEach(element => {
    const dataJSPrefix = 'data-js-'
    const attribute = [...element.attributes].filter(attribute => attribute.name.startsWith(dataJSPrefix))[0]

    if (attribute == null) return

    const name  = hyphenToLowerCase(attribute.name.slice(dataJSPrefix.length))

    if (name in map) throw new DOMException(`data attribute js must be unique:\n[${attribute.name}]`)

    map[name] = element
  })

  return map
}

/**
 * 
 * @param {Document | Element} node 
 * @returns {{[key: string]: HTMLElement}}
 */
export function getAllElementsMapWithId(node = document) {
  const hyphenToLowerCase = string => string.split('-').map((str, index) => index !== 0 ? str[0].toUpperCase() + str.slice(1) : str).join('')

  if (node == null) throw new TypeError(`param 1 cannot be null or undefined`)
  if (!(node instanceof Element || node instanceof Document)) throw new TypeError(`param 1 must be an instance of Element or Document`)

  const elements = node.querySelectorAll('[id]')

  const map = {}

  elements.forEach(element => {
    const keyId = hyphenToLowerCase(element.id)

    if (element.id === '') throw new DOMException(`'id' attribute cannot be empty`)

    if (keyId in map) throw new DOMException(`'id' attribute must be unique:\n#${element.id}`)

    map[keyId] = element
  })

  return map
}
