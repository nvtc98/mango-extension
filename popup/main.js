// window.onload = () => {
//   document.getElementById("recipeImageBtn").onclick = () => {
//     document
//       .getElementById("content")
//       .setAttribute("src", "selectPinterestImage.html");
//     document.getElementById("recipeImageBtn").classList.add("active");
//     document.getElementById("youtubeBtn").classList.remove("active");
//     document.getElementById("image2Btn").classList.remove("active");
//   };
//   document.getElementById("youtubeBtn").onclick = () => {
//     document.getElementById("content").setAttribute("src", "getYoutube.html");
//     document.getElementById("youtubeBtn").classList.add("active");
//     document.getElementById("recipeImageBtn").classList.remove("active");
//     document.getElementById("image2Btn").classList.remove("active");
//   };
//   document.getElementById("image2Btn").onclick = () => {
//     document.getElementById("content").setAttribute("src", "imageParse2.html");
//     document.getElementById("image2Btn").classList.add("active");
//     document.getElementById("youtubeBtn").classList.remove("active");
//     document.getElementById("recipeImageBtn").classList.remove("active");
//   };
// };

let activeTab = "image2Btn";

$(() => {
  $("button").hide();
  $("#" + activeTab).show();
  $(".tab").hover(
    () => {
      $("button").show();
    },
    () => {
      $("button").hide();
      $("#" + activeTab).show();
    }
  );

  $("button").click(function () {
    if ($(this).attr("id") === activeTab) {
      return;
    }
    const html = $("#" + activeTab).html();
    $("#" + activeTab).html(html.substr(0, html.length - 2));
    $(this).html($(this).html() + " &#x25BC;");
    activeTab = $(this).attr("id");
    $("#content").attr("src", getIframeSrc());
  });
});

const getIframeSrc = () => {
  switch (activeTab) {
    case "image2Btn":
      return "imageParse2.html";
    case "youtubeBtn":
      return "getYoutube.html";
    case "recipeImageBtn":
      return "selectPinterestImage.html";
  }
};
