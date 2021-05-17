let data = [];

window.onload = () => {
  getData();
  setInterval(() => {
    getData();
  }, 1000);
};

const getData = () => {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabArray) {
    const tabId = tabArray[0].id;
    const tabUrl = tabArray[0].url;

    if (tabUrl.search("youtube.com") !== -1) {
      chrome.tabs.sendMessage(
        tabId,
        { type: "getYoutube", hiddenData: data.filter((x) => x.isHidden) },
        function (response) {
          if (!response || response.length === data.length) {
            return;
          }
          data = response;
          showResult();
        }
      );
    } else {
      $("#imageContent").hide();
      $("#content").html(
        "<div style='font-size: 18px'>This feature only works on youtube.</div>"
      );
    }
  });
};

const showResult = () => {
  showContent();

  let imageContent = "";
  data.forEach((x, index) => {
    const { thumbnail, title, description, embeded, youtubeId, url, isHidden } =
      x;
    if ((!thumbnail && !title && !description && !url) || isHidden) {
      return;
    }

    // image content
    imageContent += `<div style="display:flex; margin: 10px" id="item-${index}">
    <img src="${thumbnail}" width="160" height="90" />
    <div>
      <div id="deleteBtn-${index}" style="cursor: pointer; float:right">&#x2715;</div>
      <div style="clear:both; margin-left: 10px; font-weight: 500">${title}</div>
    </div>
    </div>`;
  });
  $("#imageContent").html(imageContent);

  //afterward
  for (let i = 0; i < data.length; ++i) {
    $("#deleteBtn-" + i).click(() => {
      $("#item-" + i).remove();
      data[i].isHidden = true;
      showContent();
    });
  }
};

const showContent = () => {
  let content = "";
  data.forEach((x) => {
    const { thumbnail, title, description, embeded, youtubeId, url, isHidden } =
      x;
    if (isHidden) {
      return;
    }
    // content
    title &&
      (content += `${title}
`);
    description &&
      (content += `${description}
`);
    thumbnail &&
      (content += `${thumbnail}
`);
    youtubeId &&
      (content += `${youtubeId}
`);
    url &&
      (content += `${url}
`);
    content += `
    
`;
  });
  $("#textareaContent").html(content);
};
