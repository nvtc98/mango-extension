let prevLength = -1;

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
        { type: "getYoutube" },
        function (response) {
          if (!response || response.length === prevLength) {
            return;
          }
          prevLength = response.length;
          showResult(response);
        }
      );
    } else {
      $("#content").html(
        "<div style='font-size: 18px'>This feature only works on youtube.</div>"
      );
    }
  });
};

const showResult = (data) => {
  let content = "";
  data.forEach((x) => {
    const { thumbnail, title, description, embeded, youtubeId, url } = x;
    if (!thumbnail && !title && !description && !url) {
      return;
    }
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
