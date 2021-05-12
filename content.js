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
    element,
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

const getYoutube = () => {
  "/watch?v=f4sz7Re9f04&t=342s";
  let data = [];
  const path = '//*[@id="contents"]/ytd-video-renderer';
  const thumbnailPath = './/*[@id="img"]';
  const titlePath = './/*[@id="video-title"]/yt-formatted-string';
  const descPath = './/*[@id="description-text"]';
  const anchorPath = './/*[@id="video-title"]';

  forElementsByXpath(path, (element, index) => {
    const thumbnail = getElementByXpath(thumbnailPath, element)?.getAttribute(
      "src"
    );
    const anchor = getElementByXpath(anchorPath, element);
    const embeded = getEmbeded(getYoutubeId(anchor.getAttribute("href")));
    const title = getElementByXpath(titlePath, element)?.innerHTML;
    let description = "";
    getElementByXpath(descPath, element).childNodes.forEach(
      (x) => (description += x.innerHTML)
    );
    data.push({ thumbnail, title, description, embeded });
  });
  console.log("data", data);
  return data;
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request?.type) {
    case "getYoutube":
      sendResponse(getYoutube());
    default:
      break;
  }
  return true;
});
