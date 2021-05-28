let data = [];
let imageData = [];
let selectedId = null;
let selectedImage = null;
let interval = null;
let currentPage = 1;

const parseSize = (index, url) => {
  //dimensions
  let img = new Image();
  img.src = url;
  img.onload = function () {
    if (
      $("#imgLabel-" + index)
        .html()
        .indexOf("x") === -1
    ) {
      $("#imgLabel-" + index).append(`<div>${this.width}x${this.height}</div>`);
    }
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
      $("#searchImageInp").show();
      imageData.forEach((x, index) => {
        $("#imageContent").append(
          `<div style="display: flex; align-items: center" id="imgContainer-${index}" ${
            selectedImage === x.url ? "class='border'" : ""
          } >
            <img id="img-${index}" src=${
            x.url
          } width="180" height="120" style="margin: 0 10px 10px 0; cursor: pointer; object-fit: contain" loading="lazy" />
            <span id="imgLabel-${index}"></span>
          </div>`
        );
        parseSize(index, x.url);
        $("#imgContainer-" + index).click(() => {
          $(".border").removeClass("border");
          $("#imgContainer-" + index).addClass("border");
          $(`#selectBtn-${selectedId}`)
            .parent()
            .html(getImageDiv(selectedId, x.url));
          saveImage(selectedId, x.url);
        });
      });
    });
  });
};

const showTable = (ajaxData) => {
  $("#loading").hide();
  data = ajaxData;
  $("#content").append(
    `<div style="display:flex; font-size: 14px">
      <span style="flex: 3">Image</span><span style="flex: 10">Title</span>
    </div> <hr style='width: 100%' />`
  );
  data.forEach((x) => {
    const { ID: id, post_title: title, WpPostmetas } = x;
    let image = null;
    const findImageObject = WpPostmetas.find(
      (x) => x.meta_key === "_featured_image"
    );
    if (findImageObject && findImageObject.meta_value) {
      image = findImageObject.meta_value;
    }
    $("#content").append(
      `<div style="display:flex; margin-bottom: 10px; font-size: 14px">
        <span style="flex: 3">
          ${
            image
              ? getImageDiv(id, image)
              : `<button id="selectBtn-${id}">Select</button>`
          }
        </span><span style="flex: 10">${title}</span>
      </div>`
    );
    $(`#selectBtn-${id}`).click(() => {
      selectedId = id;
      if (image) {
        selectedImage = image;
      }
      $("#searchImageInp").val(title);
      $("#searchImageInp").hide();
      $("#imageContent").html("Loading...");
      chrome.tabs.getSelected(null, function (tab) {
        var code = `window.location='https://www.pinterest.com/search/pins/?q=${title}'`;
        chrome.tabs.executeScript(tab.id, { code });
        clearInterval(interval);
        interval = setInterval(() => {
          getData();
        }, 1000);
      });
      $("#searchImageInp").keyup(function (e) {
        if (e.keyCode !== 13) {
          return;
        }
        chrome.tabs.getSelected(null, function (tab) {
          $("#searchImageInp").hide();
          imageData = [];
          $("#imageContent").html("Loading...");
          var code = `window.location='https://www.pinterest.com/search/pins/?q=${$(
            "#searchImageInp"
          ).val()}'`;
          chrome.tabs.executeScript(tab.id, { code });
          clearInterval(interval);
          interval = setInterval(() => {
            getData();
          }, 1000);
        });
      });
    });
  });
  $("#content").append(
    `<div style="display: flex; justify-content: center"><div id="pageContainer"></div></div>`
  );
  let _page = currentPage < 5 ? 5 : currentPage;
  for (let i = _page - 4; i < _page + 6; ++i) {
    console.log("i", i);
    $(`<a ${i === currentPage ? "" : 'href="#"'} id="page">${i}</a>`)
      .click(function () {
        console.log("this", this, this.innerHTML);
        getTableData(parseInt(this.innerHTML));
      })
      .appendTo("#pageContainer");
    // $("#pageContainer").append(`<a href="#" id="page">${i}</a>`);
  }
};

const saveImage = (id, value) => {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  var raw = JSON.stringify({
    meta_value: value,
  });

  var requestOptions = {
    method: "PUT",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  fetch(
    "https://middleware.mangoads.com.vn/tools/recipe/posts/" +
      id +
      "/meta/featured",
    requestOptions
  )
    .then((response) => response.text())
    .then((result) => console.log(result))
    .catch((error) => console.log("error", error));
};

const getImageDiv = (id, url) => {
  return `<div id="selectBtn-${id}" style="cursor: pointer">${url.substr(
    0,
    12
  )}...</div>`;
};

const getTableData = (page) => {
  currentPage = page;
  const value = $("#searchInp").val();
  const url = encodeURI(
    `https://middleware.mangoads.com.vn/tools/recipe/search?title=${value}&limit=50&page=${currentPage}`
  );
  $.ajax({
    url,
    type: "GET",
    success: showTable,
  });
  $("#content").html("");
  $("#imageContent").html("");
  $("#loading").show();
};

$(() => {
  $("#searchBtn").click(() => {
    getTableData(1);
  });

  document
    .getElementById("searchInp")
    .addEventListener("keyup", function (event) {
      if (event.keyCode === 13) {
        $("#searchBtn").click();
      }
    });

  getTableData(1);
});
