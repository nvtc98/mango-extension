const extId = chrome.runtime.id;
const sizeLimit = 204800; //200KB
const dimensionsLimit = { width: 800, height: 500 };
let imageData = null;
let urlData = [];
let urlFilter = "";
let outputTag = "img";
const filterHintList = [
  { name: "Pinterest", keyword: "i.pinimg.com", siteUrl: "pinterest" },
  {
    name: "Airbnb",
    keyword: "a0.muscache.com/im/pictures",
    siteUrl: "airbnb.com.vn",
  },
  { name: "Facebook", keyword: "scontent", siteUrl: "facebook" },
];
let urlToolbarIsExpanded = false;
let tabUrl = null;
let tabId = null;
let isShowAll = false;
let data = [];
let imageScrollPosition = 0;

const getData = () => {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabArray) {
    tabId = tabArray[0].id;
    tabUrl = tabArray[0].url;
    if (tabUrl.search("chrome://extensions") !== -1) {
      return;
    }

    const interval = setInterval(() => {
      sendRequest((response) => {
        if (!response || response.length === data.length) {
          return;
        }
        imageScrollPosition = document.getElementById("imageContent").scrollTop;
        data = response;
        parse();
        // window.location.reload();
      });
    }, 1000);
    sendRequest((response) => {
      data = response || [];
      showResult();
      parse();
    });
  });
};

const sendRequest = (cb) => {
  if (tabUrl.search("facebook.com") !== -1 && tabUrl.search("photo") !== -1) {
    $("#reloadBtn").show();
    chrome.runtime.sendMessage(
      extId,
      { type: "get", tabId },
      function (response) {
        response = response ? response.filter((x) => x) : [];
        cb && cb(response);
      }
    );
  } else {
    chrome.tabs.sendMessage(
      tabId,
      { type: "getImages", data },
      function (response) {
        cb && cb(response);
      }
    );
  }
};

const parse = () => {
  let count = 0,
    countDim = 0,
    prevCount = 0,
    prevCountDim = 0,
    intervalCount = 0;
  if (!data || !data.length) {
    return;
  }
  data.forEach((x, index) => {
    let { url } = x;
    let size = null;

    //convert url
    const pinterestPattern = /pinimg.+[/]\d*x.*[/]/;
    const airbnbPattern = /muscache.+pictures.+[?]im_w=/;
    if (pinterestPattern.test(url)) {
      const sizePattern = /\d*x.*/;
      const fragments = url.split("/");
      url = fragments
        .map((x) => {
          if (sizePattern.test(x)) {
            return "originals";
          }
          return x;
        })
        .join("/");
    } else if (airbnbPattern.test(url)) {
      const fragments = url.split("?im_w=");
      fragments[1] = "1200";
      url = fragments.join("?im_w=");
    }
    data[index].url = url;

    //create interval
    const interval = setInterval(() => {
      if (count > prevCount || countDim > prevCountDim) {
        prevCount = count;
        prevCountDim = countDim;
        reShowData();
      } else {
        ++intervalCount;
        if (intervalCount > 10) {
          clearInterval(interval);
        }
      }
    }, 500);

    //get dimensions
    if (!x.width || !x.height) {
      let img = new Image();
      img.src = url;
      img.onload = function () {
        if (
          !this.width ||
          !this.height ||
          this.width < dimensionsLimit.width ||
          this.height < dimensionsLimit.height
        ) {
          data[index].poorQuality = true;
        }
        data[index].width = this.width;
        data[index].height = this.height;
        ++countDim;
      };
      img.onerror = function () {
        data[index].poorQuality = true;
        data[index].isHidden = true;
        ++countDim;
      };
    }

    //get size
    if (!x.size) {
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
              data[index] = {
                ...data[index],
                size,
                KBSize,
                poorQuality: size > sizeLimit,
              };
            } else {
            }
          } else {
          }
          ++count;
        };
        xhr.send(null);
      } catch (error) {
        ++count;
      }
    }
  });
};

const showResult = () => {
  //detect url filter
  filterHintList.forEach((x) => {
    if (tabUrl.search(x.siteUrl) !== -1) {
      urlFilter = x.keyword;
      urlFilterInp.value = urlFilter;
    }
  });

  const content = `<textarea id="parseResultTextArea" style="display: flex; flex:1; resize: none;" readonly></textarea>`;
  document.getElementById("urlContent").innerHTML = content;

  const filteredData = urlFilter
    ? data.filter((x) => {
        return (
          x.url &&
          x.url.search(urlFilter) !== -1 &&
          (x.url.search("scontent") === -1 || x.size > 30000) &&
          !x.isHidden
        );
      })
    : data;

  showImageContent(filteredData);
  showUrlContentData(filteredData);
};

const showImageContent = (data) => {
  let content = "";
  data.forEach((x, index) => {
    const { url, KBSize, size } = x;

    content += `
      <div style="margin-bottom: 20px; display: flex" id="item-${index}">
        <img src="${url}" width="160" height="120" style="object-fit: contain">
        <div style="display: flex; justify-content: center; flex-direction: column; margin-left: 20px">
          <div>Size: ${KBSize ? KBSize + " KB" : "Unknown"}</div>
          <div id="dimension-${index}">Unknown dimensions</div>
          <div><button id="downloadBtn-${index}" style="cursor: pointer">Download</button> <span style="cursor: pointer; display: ${
      isShowAll ? "none" : "inline"
    }" id="removeBtn-${index}">&#x2715</span></div>
        </div>
      </div>`;
  });
  const contentDOM = document.getElementById("imageContent");
  contentDOM.innerHTML = content;
  contentDOM.scrollTop = imageScrollPosition;

  showAfterward(data);
};

const showAfterward = (data) => {
  data.forEach((x, index) => {
    const { url, width, height } = x;
    const dimensionDiv = document.getElementById("dimension-" + index);
    const itemDiv = document.getElementById("item-" + index);

    dimensionDiv.innerHTML =
      !width || !height ? "Unknown dimensions" : `${width}x${height}`;

    document.getElementById("downloadBtn-" + index).onclick = () =>
      download(url);

    document.getElementById("removeBtn-" + index).onclick = () => {
      data[index].isHidden = true;
      // itemDiv.parentNode.removeChild(itemDiv);
      reShowData();
    };
  });
};

const showUrlContentData = (data) => {
  let content = "";
  data.forEach((x) => {
    let url = x.url;
    content += `<${outputTag} src="${url}"/>&#13;&#10;`;
  });
  document.getElementById("parseResultTextArea").innerHTML = content;
};

const download = (url) => {
  chrome.downloads.download(
    {
      url,
    },
    () => {}
  );
};

const reShowData = () => {
  const filteredData = getFilteredData();
  imageScrollPosition = document.getElementById("imageContent").scrollTop;
  showImageContent(filteredData);
  showUrlContentData(filteredData);
};

const getFilteredData = () => {
  return isShowAll
    ? data
    : urlFilter
    ? data.filter((x) => {
        return (
          x.url &&
          x.url.search(urlFilter) !== -1 &&
          (x.url.search("scontent") === -1 || x.size > 30000) &&
          !x.isHidden
        );
      })
    : data.filter((x) => !x.isHidden);
};

window.onload = function () {
  getData();

  document.getElementById("expandBtn").onclick = () => {
    $("#urlAdvancedToolbar").slideToggle("fast");
    urlToolbarIsExpanded = !urlToolbarIsExpanded;
    $("#expandBtn").html(urlToolbarIsExpanded ? "&#8963;" : "&#8964;");
  };

  document.getElementById("downloadAllBtn").onclick = () => {
    const dataToDownload = isShowAll ? data : getFilteredData();
    if (!dataToDownload.length) {
      alert("No images.");
      return;
    }
    dataToDownload.forEach((x) => {
      if (x.url) download(x.url);
    });
  };

  document.getElementById("showAllBtn").onclick = () => {
    isShowAll = !isShowAll;
    document.getElementById("showAllBtn").innerHTML = isShowAll
      ? "Show filtered"
      : "Show all";
    reShowData();
  };

  document.getElementById("urlFilterInp").onchange = () => {
    data.forEach((x) => (x.isHidden = false));
    urlFilter = document.getElementById("urlFilterInp").value;
    reShowData();
  };

  document.getElementById("outputTagInp").onchange = () => {
    outputTag = document.getElementById("outputTagInp").value;
    reShowData();
  };

  document.getElementById("reloadBtn").onclick = () => {
    const button = document.getElementById("reloadBtn");
    button.innerHTML = "Please wait...";
    button.disabled = true;
    chrome.tabs.getSelected(null, function (tab) {
      chrome.browsingData.remove(
        {
          origins: [new URL(tab.url).origin],
        },
        {
          cacheStorage: true,
          cookies: false,
          fileSystems: true,
          indexedDB: true,
          localStorage: false,
          serviceWorkers: true,
          webSQL: true,
        },
        () => {
          chrome.runtime.sendMessage(
            extId,
            { type: "reload", tabId: tab.id },
            function (response) {}
          );
          data = [];
          imageScrollPosition = 0;
          document.getElementById("imageContent").scrollTop = 0;
          chrome.tabs.sendMessage(
            tab.id,
            { type: "setImages", data },
            function (response) {}
          );
          var code = `window.location.reload(true)`;
          chrome.tabs.executeScript(tab.id, { code });
          setTimeout(() => {
            button.innerHTML = "Reload";
            button.disabled = false;
          }, 2000);
        }
      );
    });
  };

  $("#copyBtn").click(function () {
    const copyText = document.getElementById("parseResultTextArea");
    if (!copyText) {
      return;
    }
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand("copy");
    $("#copyBtn").html("Copied");
    setTimeout(() => {
      $("#copyBtn").html("Copy");
    }, 2000);
  });
};
