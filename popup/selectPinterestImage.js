let data = [];
let imageData = [];
let selectedId = null;
let isFirstTime = true;

const parseSize = (index, url) => {
  //dimensions
  let img = new Image();
  img.src = url;
  img.onload = function () {
    $("#imgLabel-" + index).html(
      $("#imgLabel-" + index).html() + `<div>${this.width}x${this.height}</div>`
    );
  };
  img.onerror = function () {
    $("#imgContainer-" + index).hide();
  };

  //size
  try {
    var xhr = new XMLHttpRequest();
    xhr.open("HEAD", url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          const size = xhr.getResponseHeader("Content-Length");
          const KBSize = size
            ? Math.round(((1.0 * size) / 1024) * 100) / 100
            : null;
          $("#imgLabel-" + index).html(
            `<div>${KBSize} KB</div>` + $("#imgLabel-" + index).html()
          );
        } else {
        }
      } else {
      }
    };
    xhr.send(null);
  } catch (error) {}
};

const getData = () => {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabArray) {
    const tabId = tabArray[0].id;

    chrome.tabs.sendMessage(tabId, { type: "getImages" }, function (response) {
      if (!response || response.length === imageData.length) {
        return;
      }
      imageData = response.map((item) => {
        const sizePattern = /\d*x.*/;
        const fragments = item.url.split("/");
        return {
          url: fragments
            .map((x) => {
              if (sizePattern.test(x)) {
                return "originals";
              }
              return x;
            })
            .join("/"),
        };
      });
      $("#imageContent").html("");
      imageData.forEach((x, index) => {
        $("#imageContent").append(
          `<div style="display: flex; align-items: center" id="imgContainer-${index}">
            <img id="img-${index}" src=${x.url} width="180" height="120" style="margin: 0 10px 10px 0; cursor: pointer; object-fit: contain" />
            <span id="imgLabel-${index}"></span>
          </div>`
        );
        parseSize(index, x.url);
        $("#img-" + index).click(() => {
          $(".border").removeClass("border");
          $("#img-" + index).addClass("border");
          $(`#selectBtn-${selectedId}`)
            .parent()
            .html(x.url.substr(0, 12) + "...");
        });
      });
    });
  });
};

$(() => {
  $("#searchBtn").click();
});

const showTable = (ajaxData) => {
  $("#loading").hide();
  data = ajaxData;
  $("#content").append(
    `<div style="display:flex; margin-bottom: 10px; font-size: 14px">
      <span style="flex: 3">Image</span><span style="flex: 10">Title</span>
    </div>`
  );
  data.forEach((x) => {
    const { id, title } = x;
    $("#content").append(
      `<div style="display:flex; margin-bottom: 10px; font-size: 14px">
        <span style="flex: 3"><button id="selectBtn-${id}">Select</button></span><span style="flex: 10">${title}</span>
      </div>`
    );
    $(`#selectBtn-${id}`).click(() => {
      selectedId = id;
      chrome.tabs.getSelected(null, function (tab) {
        var code = `window.location='https://www.pinterest.com/search/pins/?q=${title}'`;
        chrome.tabs.executeScript(tab.id, { code });
        setInterval(() => {
          getData();
        }, 1000);
      });
    });
  });
};

$("#searchBtn").click(() => {
  const value = $("#searchInp").val();
  const url = encodeURI(
    `https://recipe.mangoads.com.vn/wp-json/wp/v2/search?search=${value}&per_page=50&page=1`
  );
  $.ajax({
    url,
    type: "GET",
    success: showTable,
  });
  $("#content").html();
  if (!isFirstTime) {
    $("#loading").show();
  }
  isFirstTime = false;
});
