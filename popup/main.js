window.onload = () => {
  document.getElementById("imageBtn").onclick = () => {
    document.getElementById("content").setAttribute("src", "imageParse.html");
    document.getElementById("imageBtn").classList.add("active");
    document.getElementById("youtubeBtn").classList.remove("active");
    document.getElementById("image2Btn").classList.remove("active");
  };
  document.getElementById("youtubeBtn").onclick = () => {
    document.getElementById("content").setAttribute("src", "getYoutube.html");
    document.getElementById("youtubeBtn").classList.add("active");
    document.getElementById("imageBtn").classList.remove("active");
    document.getElementById("image2Btn").classList.remove("active");
  };
  document.getElementById("image2Btn").onclick = () => {
    document.getElementById("content").setAttribute("src", "imageParse2.html");
    document.getElementById("image2Btn").classList.add("active");
    document.getElementById("youtubeBtn").classList.remove("active");
    document.getElementById("imageBtn").classList.remove("active");
  };
};
