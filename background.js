console.log("background.js running")

let isFirstTimeLoadContentScript = true
chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
  if(isFirstTimeLoadContentScript) {
    isFirstTimeLoadContentScript = false
    return
  }
  console.log('webNavSendMsg')
  chrome.tabs.query({active: true}, function(tabs){
    console.log(tabs)
    tabs.forEach(tab => {
      const tabID = tab.id
      chrome.tabs.sendMessage(tabID, 'run-workflow')
    });
  })
});
