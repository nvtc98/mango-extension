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
let isShowAll = false;

const getData = () => {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabArray) {
    const tabId = tabArray[0].id;
    tabUrl = tabArray[0].url;
    chrome.runtime.sendMessage(
      extId,
      { type: "get", tabId },
      function (response) {
        response = response ? response.filter((x) => x) : [];
        imageData = response || [];
        showImageContent(imageData);
        showUrlContent(response);
      }
    );
  });
};

const showImageContent = (data, isInspect) => {
  let content =
    "<div style='overflow-x: scroll; padding: 14px 16px; display: block'>";
  index = 0;
  data.forEach((x) => {
    const { url, KBSize, size } = x;

    if ((size && size > sizeLimit) || !url) {
      data[index].poorQuality = true;
      // ++index;
      // return;
    }

    content += `
      <div style="margin-bottom: 20px; display: ${
        isShowAll || (isInspect && !x.isHidden) ? "flex" : "none"
      };" id="item-${index}">
        <img src="${url}" width="120" height="100" style="object-fit: contain">
        <div style="display: flex; justify-content: center; flex-direction: column; margin-left: 20px">
          <div>Size: ${KBSize ? KBSize + " KB" : "Unknown"}</div>
          <div id="dimension-${index}">Unknown dimensions</div>
          <div><button id="downloadBtn-${index}" style="cursor: pointer">Download</button> <span style="cursor: pointer" id="removeBtn-${index}">&#x2715</span></div>
        </div>
      </div>`;

    ++index;
  });
  const contentDOM = document.getElementById("imageContent");
  contentDOM.innerHTML = content + "</div>";
  // contentDOM.scrollTop = contentDOM.scrollHeight;

  while (index > 0) {
    const thisIndex = --index;
    const imageUrl = data[index].url;
    const dimensionDiv = document.getElementById("dimension-" + index);
    const itemDiv = document.getElementById("item-" + index);
    // if (data[index].poorQuality) {
    //   continue;
    // }
    if (
      data[index].isHidden ||
      (!isShowAll && !isInspect && data[index].poorQuality)
    ) {
      itemDiv.style.display = "none";
      continue;
    }
    document.getElementById("downloadBtn-" + thisIndex).onclick = () =>
      download(imageUrl);

    document.getElementById("removeBtn-" + thisIndex).onclick = () => {
      if (isInspect) {
        urlData[thisIndex].isHidden = true;
        showUrlContentData(urlData, true);
        showImageContent(urlData, true);
        return;
      }
      data[thisIndex].isHidden = true;
      itemDiv.parentNode.removeChild(itemDiv);
      // chrome.runtime.sendMessage(
      //   extId,
      //   { type: "remove", url: imageUrl },
      //   function (response) {}
      // );
    };

    let img = new Image();
    img.src = imageUrl;
    img.onload = function () {
      if (
        !this.width ||
        !this.height ||
        this.width < dimensionsLimit.width ||
        this.height < dimensionsLimit.height
      ) {
        data[thisIndex].poorQuality = true;
        // itemDiv.parentNode.removeChild(itemDiv);
        return;
      }
      dimensionDiv.innerHTML = `${this.width}x${this.height}`;
      itemDiv.style.display = "flex";
      // contentDOM.scrollTop = contentDOM.scrollHeight;
    };
    img.onerror = function () {
      data[thisIndex].poorQuality = true;
      itemDiv.parentNode.removeChild(itemDiv);
    };
  }
};

const showUrlContent = (data) => {
  //detect url
  filterHintList.forEach((x) => {
    if (tabUrl.search(x.siteUrl) !== -1) {
      urlFilter = x.keyword;
      urlFilterInp.value = urlFilter;
    }
  });

  document.getElementById("urlFilterInp").onchange = () => {
    urlFilter = document.getElementById("urlFilterInp").value;
    showUrlContentData(data);
  };

  document.getElementById("outputTagInp").onchange = () => {
    outputTag = document.getElementById("outputTagInp").value;
    showUrlContentData(data);
  };

  document.getElementById("reloadBtn").onclick = () => {
    const button = document.getElementById("reloadBtn");
    button.innerHTML = "Please wait...";
    button.disabled = true;
    $("#parseResultTextArea").html("Please wait...");
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
          var code = `window.location.reload(true)`;
          chrome.tabs.executeScript(tab.id, { code });
          let dataLength = -1;
          const interval = setInterval(() => {
            chrome.runtime.sendMessage(
              extId,
              { type: "get", tabId: tab.id },
              function (response) {
                if (!response || dataLength !== response.length) {
                  dataLength = response?.length;
                  return;
                }
                response = response ? response.filter((x) => x) : [];
                imageData = response || [];
                showImageContent(imageData);
                showUrlContent(response);
                clearInterval(interval);
                button.innerHTML = "Reload";
                button.disabled = false;
              }
            );
          }, 1000);
        }
      );
    });
  };

  const content = `<textarea id="parseResultTextArea" style="display: flex; flex:1; resize: none;" readonly></textarea>`;
  document.getElementById("urlContent").innerHTML = content;
  showUrlContentData(data);

  $("#copyBtn").click(function () {
    const copyText = document.getElementById("parseResultTextArea");
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand("copy");
    $("#copyBtn").html("Copied");
    setTimeout(() => {
      $("#copyBtn").html("Copy");
    }, 2000);
  });
};

const showUrlContentData = (data, isRemoved) => {
  let content = "";
  if (!data) {
    data = [];
  }
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
  filteredData.forEach((x) => {
    let url = x.url;
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
    content += `<${outputTag} src="${url}"/>&#13;&#10;`;
    !isRemoved && urlData.push(x);
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

window.onload = function () {
  getData();

  document.getElementById("expandBtn").onclick = () => {
    $("#urlAdvancedToolbar").slideToggle("fast");
    urlToolbarIsExpanded = !urlToolbarIsExpanded;
    $("#expandBtn").html(urlToolbarIsExpanded ? "&#8963;" : "&#8964;");
  };

  document.getElementById("downloadAllBtn").onclick = () => {
    const list = imageData.filter((x) =>
      isShowAll ? !x.isHidden : !x.poorQuality && !x.isHidden
    );
    if (!list.length) {
      alert(
        isShowAll
          ? "No images."
          : "No images smaller than 200KB, larger than 800x500."
      );
      return;
    }
    list.forEach((x) => {
      if (x.url) download(x.url);
    });
  };

  document.getElementById("showAllBtn").onclick = () => {
    isShowAll = !isShowAll;
    document.getElementById("showAllBtn").innerHTML = isShowAll
      ? "Show quality"
      : "Show all";
    showImageContent(imageData);
  };

  document.getElementById("inspectBtn").onclick = () => {
    if (document.getElementById("inspectBtn").innerHTML === "Inspect off") {
      showImageContent(imageData);
      document.getElementById("inspectBtn").innerHTML = "Inspect";
      $("#imageToolbar").css({ opacity: 1 });
      $("#reloadBtn").show();
      return;
    }
    showImageContent(urlData, true);
    document.getElementById("inspectBtn").innerHTML = "Inspect off";
    $("#imageToolbar").css({ opacity: 0 });
    $("#reloadBtn").hide();
  };
};
