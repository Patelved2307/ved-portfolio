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
});
