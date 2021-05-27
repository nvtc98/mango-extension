// let storedData = [];
// let tabId = null;
let data = [];
let existence = {};
let tabUrl = null;
let youtubeHiddenData = {};
let interval = null;

const getEmbeded = (id) =>
  id
    ? `<iframe width="560" height="315" src="https://www.youtube.com/embed/${id}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
    : null;

const getYoutubeId = (url) => {
  const queryString = url.split("?")[1];
  let result;
  queryString.split("&").forEach((x) => {
    if (x.substr(0, 2) === "v=") {
      result = x.substr(2);
    }
  });
  return result;
};

const getElementByXpath = (path, element) => {
  return document.evaluate(
    path,
    element || document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;
};

const forElementsByXpath = (path, cb) => {
  let index = 0;
  const nodes = document.evaluate(
    path,
    document,
    null,
    XPathResult.ANY_TYPE,
    null
  );
  let result = nodes.iterateNext();
  while (result) {
    cb && cb(result, ++index);
    result = nodes.iterateNext();
  }
};

const getYoutube = (hiddenData) => {
  hiddenData.forEach((x) => {
    if (x.youtubeId) {
      youtubeHiddenData[x.youtubeId] = true;
    } else if (x.title) {
      youtubeHiddenData[x.title] = true;
    }
  });
  let data = [];
  const path = '//*[@id="contents"]/ytd-video-renderer';
  const thumbnailPath = './/*[@id="img"]';
  const titlePath = './/*[@id="video-title"]/yt-formatted-string';
  const descPath = './/*[@id="description-text"]';
  const anchorPath = './/*[@id="video-title"]';

  forElementsByXpath(path, (element, index) => {
    const anchor = getElementByXpath(anchorPath, element);
    const youtubeId = getYoutubeId(anchor.getAttribute("href"));
    if (youtubeId && existence[youtubeId]) {
      return;
    }
    const thumbnail = getElementByXpath(thumbnailPath, element)?.getAttribute(
      "src"
    );
    const embeded = getEmbeded(youtubeId);
    const url = "https://www.youtube.com" + anchor.getAttribute("href");
    const title = getElementByXpath(titlePath, element)?.innerHTML;
    let description = "";
    const descNode = getElementByXpath(descPath, element);
    if (descNode.childNodes.length === 1) {
      description = descNode.innerHTML;
    } else {
      descNode.childNodes.forEach((x) => (description += x.innerHTML));
    }
    data.push({
      thumbnail,
      title,
      description,
      embeded,
      url,
      youtubeId,
      isHidden:
        youtubeHiddenData[youtubeId] || youtubeHiddenData[title] ? true : false,
    });
  });
  return data;
};

const getImages = (oldData) => {
  if (oldData && oldData.length) {
    data = oldData;
  }
  const path = "//img";
  forElementsByXpath(path, (element) => {
    const url = element.getAttribute("src");
    if (!url || existence[url]) {
      return;
    }
    existence[url] = true;
    data.push({ url });
  });
  return data;
};

const getFacebook = async (options, cb) => {
  const { more, scroll } = options;
  const path = '//div[@role="feed"]/div';
  let facebookData = [];
  if (scroll) {
    window.scrollTo(0, document.body.scrollHeight);
  }
  if (more) {
    forElementsByXpath(path, (element) => {
      $(element)
        .find("div[role='button']")
        .each((i, item) => {
          if ($(item).html() === "Xem thêm") {
            $(item).click();
          }
        });
    });
  }
  return await new Promise((resolve) => {
    setTimeout(
      () => {
        forElementsByXpath(path, (element, index) => {
          let contentList = [],
            imageList = [];

          const contentPath =
            "./div/div/div/div/div/div/div/div/div/div[2]/div/div[3]";
          const contentNode = getElementByXpath(contentPath, element);

          $(contentNode)
            .find("div[dir='auto']")
            .each((i, item) => {
              const children = $(item).children();
              if (!children || !children.length) {
                contentList.push(item.innerHTML);
              } else if (children.length) {
                let isContent = true;
                children.each((index, element) => {
                  if (element.tagName !== "SPAN") {
                    isContent = false;
                  }
                });
                if (isContent) {
                  contentList.push($(item).text());
                }
              }
            });

          $(contentNode)
            .find("img")
            .each((i, item) => {
              if ($(item).attr("class")?.length) {
                imageList.push($(item).attr("src"));
              }
            });
          if (contentList.length) {
            facebookData.push({ contentList, imageList });
          }
        });
        resolve(facebookData);
        cb && cb(facebookData);
      },
      more ? 500 : 0
    );
  });
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request?.type) {
    case "getYoutube":
      sendResponse(getYoutube(request.hiddenData));
      break;

    case "getImages":
      setTimeout(() => {
        // if (window.location.href.search("facebook.com/photo") !== -1) {
        //   sendResponse(storedData);
        //   return true;
        // }
        if (window.location.href !== tabUrl) {
          tabUrl = window.location.href;
          data = [];
          existence = {};
        }
        sendResponse(getImages(request.data));
      }, 1);
      break;

    case "setImages":
      data = request.data;
      existence = {};
      data.forEach((x) => {
        existence[x.url] = true;
      });
      break;

    case "getFacebook":
      getFacebook(request, sendResponse);
      break;

    default:
      break;
  }
  return true;
});

window.onload = () => {
  tabUrl = window.location.href;
};
