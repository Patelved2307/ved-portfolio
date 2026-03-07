document.addEventListener("DOMContentLoaded", function () {
  const resumeBtn = document.getElementById("resume-btn");
  if (resumeBtn) {
    resumeBtn.addEventListener("click", function (e) {
      e.preventDefault();

      const link = document.createElement("a");
      link.href = "Resume%20-%20Patel%20Ved.pdf";
      link.download = "Resume-Patel-Ved.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  const sendMessageBtn = document.querySelector("#connect .connect-form button");
  if (sendMessageBtn) {
    sendMessageBtn.addEventListener("click", function () {
      alert("Coming Soon! Please connect with me through the social media links in this section.");
    });
  }

  const startupAd = document.getElementById("startup-ad");
  const startupAdClose = document.getElementById("startup-ad-close");
  const startupAdSeconds = document.getElementById("startup-ad-seconds");
  const startupMini = document.getElementById("startup-mini");
  if (startupAd && startupAdClose && startupAdSeconds) {
    let secondsLeft = 5;
    startupAd.classList.add("show");
    startupAdSeconds.textContent = String(secondsLeft);

    const closeAd = function () {
      startupAd.classList.remove("show");
      if (startupMini) {
        startupMini.classList.add("show");
      }
    };

    const timer = setInterval(function () {
      secondsLeft -= 1;
      startupAdSeconds.textContent = String(Math.max(secondsLeft, 0));
      if (secondsLeft <= 0) {
        clearInterval(timer);
        closeAd();
      }
    }, 1000);

    startupAdClose.addEventListener("click", function () {
      clearInterval(timer);
      closeAd();
    });
  }
});