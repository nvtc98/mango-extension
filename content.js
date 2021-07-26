// let storedData = [];
// let tabId = null;
let data = [];
let existence = {};
let tabUrl = null;
let youtubeHiddenData = {};
let interval = null;
let twitterData = [];
let twitterStatus = "stopped";

const getEmbeded = (id) =>
  id
    ? `<iframe width="1200" height="675" src="https://www.youtube.com/embed/${id}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
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
  const path = '//*[@id="dismissible"]';
  const thumbnailPath = './/*[@id="img"]';
  const titlePath = './/*[@id="video-title"]/yt-formatted-string';
  const descPath = "./div/div[3]/yt-formatted-string";
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
    const descNode = getElementByXpath(descPath, element);
    let description = $(descNode).text();
    // if (descNode.childNodes.length === 1) {
    //   description = descNode.innerHTML;
    // } else {
    //   descNode.childNodes.forEach((x) => (description += x.innerHTML));
    // }
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

const getYoutubeChannel = () => {
  let data = [];
  const path = '//*[@id="dismissible"]';
  const thumbnailPath = './/*[@id="img"]';
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
    const title = anchor.innerHTML;
    data.push({
      thumbnail,
      title,
      embeded,
      url,
      youtubeId,
    });
  });
  return data;
};

const getImages = (oldData) => {
  if (oldData && oldData.length) {
    data = oldData;
  }

  let windowUrl = tabUrl.split("/");
  delete windowUrl[windowUrl.length - 1];
  windowUrl = windowUrl.join("/");
  if (windowUrl[windowUrl.length - 1] == "/") {
    windowUrl = windowUrl.substr(0, windowUrl.length - 1);
  }

  const path = "//img";
  forElementsByXpath(path, (element) => {
    let url = element.getAttribute("src");
    if (!url || existence[url]) {
      return;
    }
    existence[url] = true;
    let urlToPush = url;
    if (urlToPush.substr(0, 2) === "//") {
      urlToPush = "https:" + url;
    } else if (urlToPush[0] === "/") {
      urlToPush = windowUrl + url;
    }
    data.push({ url: urlToPush });
  });
  console.log(windowUrl, data);
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
          if ($(item).html() === "Xem thêm" || $(item).html() === "See more") {
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

const getTwitter = async (options = {}, cb) => {
  const { get = false, stop = false } = options;
  if (get) {
    cb && cb(twitterData);
    return twitterData;
  } else {
    twitterStatus = stop ? "stopped" : "started";
    if (stop) {
      return;
    }
  }
  return await new Promise((resolve) => {
    const getItem = (index) => {
      if (twitterStatus === "stopped") {
        // console.log("twitterData", twitterData);
        cb && cb(twitterData);
        resolve(twitterData);
        return;
      }
      const existPath = `//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div[1]/div/div[2]/div/div/div[2]/section/div/div/div[${index}]`;
      const itemElement = getElementByXpath(existPath);
      if (!itemElement) {
        const scrollHeight = document.body.scrollHeight;
        let intervalCount = 0;
        window.scrollTo(0, document.body.scrollHeight);
        const interval2 = setInterval(() => {
          ++intervalCount;
          if (intervalCount > 15) {
            clearInterval(interval2);
            // console.log("twitterData", twitterData);
            cb && cb(twitterData);
            resolve(twitterData);
            twitterStatus = "stopped";
            return;
          }

          if (scrollHeight !== document.body.scrollHeight) {
            clearInterval(interval2);
            let intervalCount2 = 0;
            const interval3 = setInterval(() => {
              const isExist = !!getElementByXpath(existPath);
              if (isExist) {
                clearInterval(interval3);
                getItem(index);
              } else {
                ++intervalCount2;
                if (intervalCount2 > 2) {
                  clearInterval(interval3);
                  getItem(1);
                  return;
                }
              }
            }, 1000);
          }
        }, 1000);
        return;
      }
      const path = `./div/div/article/div/div/div/div[2]`;
      const clickArea = getElementByXpath(path, itemElement);
      const maxComments = Math.min(
        parseInt(
          getElementByXpath(
            "./div/div/article/div/div/div/div[2]/div[2]/div[2]/div[3]/div[1]/div/div/div[2]/span/span",
            itemElement
          )?.innerHTML
        ) || 0,
        10
      );

      if (!clickArea) {
        getItem(index + 1);
        return;
      }

      $(clickArea).click();
      const contentPath =
        '//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div[1]/div/div[2]/div/section/div/div/div/div/div/article/div/div/div/div[3]/div[1]/div/div';

      const imagePath =
        '//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div[1]/div/div[2]/div/section/div/div/div[1]/div/div/article/div/div/div/div[3]/div[2]/div/div/div/div//img';
      let content = null,
        imageList = [],
        commentList = [];
      const interval = setInterval(() => {
        content = content ? content : getElementByXpath(contentPath);
        if (content) {
          if (!imageList.length) {
            forElementsByXpath(imagePath, (image) => {
              imageList.push(image.getAttribute("src"));
            });
          }

          const commentPath =
            '//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div[1]/div/div[2]/div/section/div/div/div/div/div/article/div/div/div/div[2]/div[2]/div[2]/div[2]/div';
          forElementsByXpath(commentPath, (comment) => {
            const commentText = $(comment).text();
            if (!commentText) {
              return;
            }
            commentList.push(commentText);
          });

          if (commentList.length < maxComments) {
            commentList = [];
            window.scrollTo(
              0,
              document.documentElement.scrollTop + screen.height
            );
            return;
          }
          clearInterval(interval);

          window.history.back();

          twitterData.push({
            content: $(content).text(),
            imageList,
            commentList,
          });
          setTimeout(() => {
            getItem(index + 1);
          }, 500);
        }
      }, 650);
    };
    getItem(1);
  });
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request?.type) {
    case "getYoutube":
      if (window.location.href.search("youtube.com/c") !== -1) {
        sendResponse(getYoutubeChannel());
      }
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

    case "getTwitter":
      getTwitter(request, sendResponse);
      break;

    default:
      break;
  }
  return true;
});

window.onload = () => {
  tabUrl = window.location.href;
};
