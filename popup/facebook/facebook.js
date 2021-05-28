let tabId = null;
let data = [];
let interval = null;

const getData = () => {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabArray) {
    tabId = tabArray[0].id;
    const tabUrl = tabArray[0].url;

    if (tabUrl.search("facebook.com") !== -1) {
      sendRequest();
    } else {
      $("#imageContent").hide();
      $("#content").html(
        "<div style='font-size: 18px'>This feature only works on Facebook.</div>"
      );
    }
  });
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
    const { contentList, imageList } = x;
    $("#content").append(
      `<div>${contentList.join("<br>")}</div>${imageList
        .map((x) => "<div style='word-break: break-all;'>" + x + "</div>")
        .join("")}<br>`
    );
  });
};

const sendRequest = (options, cb) => {
  chrome.tabs.sendMessage(
    tabId,
    { type: "getFacebook", ...options },
    function (response) {
      console.log(response);
      if (!response) {
        return;
      }
      data = response;
      showResult();
      cb && cb();
    }
  );
};

window.onload = () => {
  getData();

  $("#moreBtn").click(() => {
    $("#moreBtn").html("Loading...");
    $("#moreBtn").attr("disabled", true);
    sendRequest({ more: true });
    setTimeout(() => {
      $("#moreBtn").html("Click Xem thêm");
      $("#moreBtn").attr("disabled", false);
    }, 500);
  });

  $("#scrollBtn").click(() => {
    if ($("#scrollBtn").html() === "Stop") {
      $("#scrollBtn").html("Scroll");
      clearInterval(interval);
      return;
    }
    $("#scrollBtn").html("Stop");
    sendRequest({ scroll: true });
    interval = setInterval(() => {
      sendRequest({ scroll: true });
    }, 1000);
  });
};
