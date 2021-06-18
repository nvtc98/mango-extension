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

  $("#exportBtn").click(() => {
    showContentGrid(exportExcel);
  });
};

const showContentGrid = (cb) => {
  const gridData = [];
  data.forEach((x, index) => {
    const { content, imageList, commentList } = x;
    const rows = Math.max(imageList.length, commentList.length);
    gridData.push({
      number: index + 1,
      content,
      image: imageList[0] || "",
      comment: commentList[0] || "",
    });
    for (let i = 1; i < rows; ++i) {
      gridData.push({
        number: "",
        content: "",
        image: imageList[i] || "",
        comment: commentList[i] || "",
      });
    }
  });

  $("#contentTable").append(`<tr>
  <th>No.</th>
  <th>Content</th>
  <th>Image</th>
</tr>`);
  gridData.forEach((x) => {
    const { number, content, image, comment } = x;
    $("#contentTable").append(`<tr>
    <td>${number}</td>
    <td>${content}</td>
    <td>${image}</td>
    <td>${comment}</td>
  </tr>`);
  });

  cb && cb();
};

const exportExcel = () => {
  const table = $("#contentTable");
  var $temp = $("<input>");
  $("body").append($temp);
  $temp.val($(table).text()).select();
  document.execCommand("copy");
  $temp.remove();

  if (table && table.length) {
    var preserveColors = table.hasClass("table2excel_with_colors")
      ? true
      : false;
    $(table).table2excel({
      exclude: ".noExl",
      name: "Twitter Crawl",
      filename: "Twitter-crawl.xls",
      fileext: ".xls",
      exclude_img: true,
      exclude_links: true,
      exclude_inputs: true,
      preserveColors: preserveColors,
    });
  }
};
