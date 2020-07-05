console.log("content.js running")

Array.prototype.getValueAtIndex = function (index) {
  if(Number.isInteger(index) && index >= 0 && index < this.length) {
    return this[index]
  }
  return null
}
HTMLCollection.prototype.getValueAtIndex = Array.prototype.getValueAtIndex

/* DOM parse and createElemnt logic */
function logOutlines(outlines) {
  console.log("=================")
  for (let i in outlines) {
    let tag = outlines[i]
    console.log(tag.tagName + '\ttext: ' + tag.text + '\tlevel: ' + tag.level + '\tid: ' + tag.id)
  }
  console.log("=================")
}

function getPrimarySectionOutlines() {
  let primarySectionOutlines = []
  let primarySection = document.getElementsByClassName('primary-content').getValueAtIndex(0)
  if(!primarySection) { return [] }
  let content = primarySection.getElementsByClassName('content').getValueAtIndex(0)
  if(!content) { return [] }

  for (let i in content.children) {
    let childElem = content.children[i]
    let tagName = ''
    if (childElem.tagName) tagName = childElem.tagName.toLowerCase()

    if (['h2', 'h3', 'h4'].includes(tagName)) {
      let text = childElem.innerText
      let level = parseInt(tagName[1])
      let id = childElem.getAttribute("id")
      if (text && text.length > 0) {
        primarySectionOutlines.push({
          tagName: tagName,
          level: level,
          id: id,
          text: text,
          hasSubItem: false
        })
      }
    }
  }
  logOutlines(primarySectionOutlines)
  return(primarySectionOutlines)
}

function getTopicsSectionOutlines() {
  let topicsSection = document.getElementById("topics")
  if(!topicsSection) { return [] }
  let container = topicsSection.getElementsByClassName("container").getValueAtIndex(0)
  if(!container) { return [] }

  let topicsSectionOutlines = [{
    tagName: 'h2',
    level: 2,
    id: '',
    text: 'Topics',
    hasSubItem: true
  }]
  let sectionTitles = container.getElementsByClassName("section-title")
  for (let i in sectionTitles) {
    let title = sectionTitles[i].innerText
    if (title && title.length > 0) {
      topicsSectionOutlines.push({
        tagName: 'h3',
        level: 3,
        id: '',
        text: title,
        hasSubItem: false
      })
    }
  }
  logOutlines(topicsSectionOutlines)
  return topicsSectionOutlines
}

function createUnorderedListTag(dataArray) {
  function createATagWithHref(innerHTML, href) {
    let a = document.createElement('a')
    a.innerHTML = innerHTML
    a.setAttribute("href", href)
    a.setAttribute("class", "link router-link-exact-active router-link-active")
    a.addEventListener('click', ev => {
      console.log('<a> onclick: apply offset by -53')
      setTimeout(() => { window.scrollBy(0, -53) }, 0)
    })
    return a
  }
  function addTextToLiTag(li, text, id = '') {
    if(id && text && text.length > 0) {
      let href = document.URL.split("#")[0] + '#' + id
      let a = createATagWithHref(text, href)
      li.appendChild(a)
    } else {
      li.innerHTML = text
    }
  }

  for (let i = 0; i < dataArray.length - 1; ++i) {
    if (dataArray[i].level < dataArray[i + 1].level) {
      dataArray[i].hasSubItem = true
    } else {
      dataArray[i].hasSubItem = false
    }
  }

  let ul = document.createElement('ul')
  for (let i = 0; i < dataArray.length; ++i) {
    let li = document.createElement('li')
    /* 添加本li的a节点或文本 */
    addTextToLiTag(li, dataArray[i].text, dataArray[i].id)
    
    if(dataArray[i].tagName === 'h2') {
      li.setAttribute('style', 'list-style: none;')
    }

    if (dataArray[i].hasSubItem) {
      let dataArraySlice = []  /* 创建子unordered list所需要的数据 */
      let j = i + 1
      for (; j < dataArray.length && dataArray[i].level < dataArray[j].level; ++j) {
        dataArraySlice.push(dataArray[j])
      }
      if (dataArraySlice.length > 0) {
        li.appendChild(createUnorderedListTag(dataArraySlice))  /* 递归添加子unordered list */
      }
      i = j - 1  /* 下次循环从下一个同level的元素开始 */
    }

    ul.appendChild(li)
  }

  return ul
}


/* polling page whether AJAX has completed. If yes, dispatch an ajaxReadyEvent */
function checkAJAXReady() {
  const ajaxReadyEvent = new Event('ajax-ready')
  const startCheckTime = Date.now()
  const intervelID = setInterval(function () {
    console.log('setIntervel: checking if ajax is loaded...')
    let ajaxContent = document.getElementsByClassName('primary-content')
    const ajaxContentIsLoaded = ajaxContent && ajaxContent.length > 0
    if (ajaxContentIsLoaded) {
      clearInterval(intervelID)
      console.log('about to fire ajax-ready event')
      document.dispatchEvent(ajaxReadyEvent)
    }
    if (Date.now() - startCheckTime > 10000) {
      clearInterval(intervelID)
    }
  }, 100)
}

function workflow() {
  // 获取大纲数据
  let primarySectionOutlines = getPrimarySectionOutlines()
  let topicsSectionOutlines = getTopicsSectionOutlines()
  let allOutlines = primarySectionOutlines.concat(topicsSectionOutlines)
  // 添加大纲到DOM
  const p = document.createElement('p')
  p.setAttribute('class', 'title')
  p.setAttribute('style', 'color: #333; font-size: 14px; font-family: SF Pro Display,SF Pro Icons,Helvetica Neue,Helvetica,Arial,sans-serif;font-weight: 600;margin-bottom: .5rem;    text-rendering: optimizeLegibility;')
  p.innerHTML = "Outline"
  const ul = createUnorderedListTag(allOutlines)
  ul.setAttribute('style', 'margin-left: 0;')
  const allOutlineDOM = document.createElement('div')
  allOutlineDOM.setAttribute('style', 'font-size: 14px; color: #555;')
  allOutlineDOM.appendChild(p)
  allOutlineDOM.appendChild(ul)
  const summaryColSection = document.getElementsByClassName("col summary").getValueAtIndex(0)
  if(summaryColSection) {
    summaryColSection.appendChild(allOutlineDOM)
  }
}

document.addEventListener('ajax-ready', ev => {
  console.log('received ajax-ready event')
  workflow()
})

chrome.runtime.onMessage.addListener(function (message, sender, callback) {
  console.log('received msg: ' + message + ', about to rerun workflow!')
  checkAJAXReady()
})

checkAJAXReady()
