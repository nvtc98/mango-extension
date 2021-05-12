// const getYoutube = (cb) => {
//   let txt = "";
//   const thumpnailPath = '//*[@id="img"]';
//   const path = '//*[@id="video-title"]';
//   // "/html/body/ytd-app/div/ytd-page-manager/ytd-browse/ytd-two-column-browse-results-renderer/div[1]/ytd-rich-grid-renderer/div[6]/ytd-rich-item-renderer[1]/div/ytd-rich-grid-media/div[1]/div/div[1]/h3/a/yt-formatted-string";
//   const nodes = document.evaluate(
//     thumpnailPath,
//     document,
//     null,
//     XPathResult.ANY_TYPE,
//     null
//   );
//   cb && cb(nodes);
//   let result = nodes.iterateNext();
//   while (result) {
//     txt += result.childNodes[0].getAttribute("src") + "<br>";
//     result = nodes.iterateNext();
//   }
//   return txt;
// };

// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//   switch (request?.type) {
//     case "getYoutube":
//       sendResponse(document.all[0].outerHTML);
//       return true;
//     default:
//       break;
//   }
// });
