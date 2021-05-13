const sizeLimit = 204800; //200KB
let data = {};
let uniqData = {};
let prevUrl = {};

// chrome.browserAction.setBadgeBackgroundColor({ color: "#E44" });

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // chrome.browserAction.setBadgeText({ text: "" });
  switch (request?.type) {
    case "get":
      sendResponse(getData(request.tabId));
      break;

    case "reload":
      resetData(request.tabId);
      sendResponse(true);
      break;
  }
  return true;
});

chrome.tabs.onRemoved.addListener(function (tabId, removed) {
  resetData(tabId);
});

chrome.webNavigation.onHistoryStateUpdated.addListener(function (data) {
  const url = data.url.split("?")[0];
  if (
    url.search("facebook.com/photo") ||
    (prevUrl[data.tabId] && prevUrl[data.tabId] === url)
  ) {
    return;
  }
  prevUrl[data.tabId] = url;
  resetData(data.tabId);
});

chrome.webRequest.onCompleted.addListener(
  function (details) {
    const { type, url, tabId } = details;

    if (type !== "image") {
      return;
    }

    if (!data[tabId]) {
      data[tabId] = [];
      uniqData[tabId] = {};
    }

    if (!data[tabId] || !uniqData[tabId] || uniqData[tabId][url]) {
      return;
    }

    const index = data[tabId].length;
    data[tabId].push(details);
    uniqData[tabId][url] = true;

    let size = null;
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("HEAD", url, true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
          if (xhr.status == 200) {
            size = xhr.getResponseHeader("Content-Length");
            const KBSize = size
              ? Math.round(((1.0 * size) / 1024) * 100) / 100
              : null;
            if (data[tabId]) {
              data[tabId][index] = { ...data[tabId][index], size, KBSize };
            }
            // }
          } else {
          }
        } else {
        }
      };
      xhr.send(null);
    } catch (error) {}
    // console.log("data", data);
  },
  { urls: ["<all_urls>"] }
);

const getData = (tabId) => {
  return data[tabId];
};

const resetData = (tabId) => {
  delete data[tabId];
  delete uniqData[tabId];
};
