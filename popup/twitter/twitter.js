let tabId = null;
let data = [];
let interval = null;

const init = () => {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabArray) {
    tabId = tabArray[0].id;
    const tabUrl = tabArray[0].url;

    if (tabUrl.search("twitter.com") !== -1) {
      sendRequest({ get: true });
    } else {
      $("#imageContent").hide();
      $("#toolbar").hide();
      $("#content").html(
        "<div style='font-size: 18px'>This feature only works on Twitter.</div>"
      );
    }
  });
};

const getData = (get) => {
  sendRequest({ stop: !get });
  if (!get) {
    clearInterval(interval);
    return;
  }
  interval = setInterval(() => {
    sendRequest({ get: true });
  }, 1000);
};

const showResult = () => {
  showContent();

  //   let imageContent = "";
  //   data.forEach((x, index) => {
  //     const { thumbnail, title, description, embeded, youtubeId, url, isHidden } =
  //       x;
  //     if ((!thumbnail && !title && !description && !url) || isHidden) {
  //       return;
  //     }

  //     // image content
  //     imageContent += `<div style="display:flex; margin: 10px" id="item-${index}">
  //     <img src="${thumbnail}" width="160" height="90" />
  //     <div>
  //       <div id="deleteBtn-${index}" style="cursor: pointer; float:right">&#x2715;</div>
  //       <div style="clear:both; margin-left: 10px; font-weight: 500">${title}</div>
  //     </div>
  //     </div>`;
  //   });
  //   $("#imageContent").html(imageContent);

  //   //afterward
  //   for (let i = 0; i < data.length; ++i) {
  //     $("#deleteBtn-" + i).click(() => {
  //       $("#item-" + i).remove();
  //       data[i].isHidden = true;
  //       showContent();
  //     });
  //   }
};

const showContent = () => {
  $("#content").html("");
  data.forEach((x) => {
    const { content, imageList, commentList } = x;
    $("#content").append(
      `<div>${content}</div>${imageList
        .map((x) => "<div style='word-break: break-all;'>" + x + "</div>")
        .join("")}
        ${commentList.map((x) => "<div>" + x + "</div>").join("")}<br>`
    );
  });
};

const sendRequest = (options, cb) => {
  chrome.tabs.sendMessage(
    tabId,
    { type: "getTwitter", ...options },
    function (response) {
      console.log(response);
      if (!response) {
        return;
      }
      data = response;
      if (options.get) {
        showResult();
      }
      cb && cb();
    }
  );
};

window.onload = () => {
  init();

  $("#getBtn").click(() => {
    const button = $("#getBtn");
    if (button.html() === "Get") {
      button.html("Stop");
      getData(true);
    } else {
      button.html("Get");
      getData(false);
    }
  });
};
