(function () {
  "use strict";

  // /feedback/ 表单——纯前端零依赖，提交到 functions/api/feedback.js。
  // 支持 ?slug=xxx&category=yyy 预填（详情页「补充说明 →」链接靠这个把上下文带过来）。

  var form = document.getElementById("feedback-form");
  if (!form) return;

  var categorySelect = document.getElementById("fb-category");
  var slugSelect = document.getElementById("fb-slug");
  var messageInput = document.getElementById("fb-message");
  var contactInput = document.getElementById("fb-contact");
  var resultEl = document.getElementById("feedback-result");
  var submitBtn = form.querySelector(".feedback-submit");

  function qs(name) {
    try {
      return new URLSearchParams(window.location.search).get(name) || "";
    } catch (e) {
      return "";
    }
  }

  function selectHasValue(select, value) {
    return Array.prototype.some.call(select.options, function (opt) {
      return opt.value === value;
    });
  }

  function prefillFromQuery() {
    var slug = qs("slug");
    var category = qs("category");
    if (slug && slugSelect && selectHasValue(slugSelect, slug)) {
      slugSelect.value = slug;
    }
    if (category && categorySelect && selectHasValue(categorySelect, category)) {
      categorySelect.value = category;
    }
  }

  function showResult(text, isError) {
    if (!resultEl) return;
    resultEl.hidden = false;
    resultEl.textContent = text;
    resultEl.className = "feedback-result " + (isError ? "is-error" : "is-ok");
  }

  form.addEventListener("submit", function (evt) {
    evt.preventDefault();

    var message = messageInput.value.trim();
    if (message.length < 5) {
      showResult("留言至少 5 个字，请再补充一下具体情况。", true);
      return;
    }

    var payload = {
      category: categorySelect.value,
      message: message,
      contact: contactInput.value.trim(),
    };
    if (slugSelect.value) payload.slug = slugSelect.value;

    if (submitBtn) submitBtn.disabled = true;

    fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res
          .json()
          .catch(function () {
            return {};
          })
          .then(function (data) {
            return { ok: res.ok, data: data };
          });
      })
      .then(function (result) {
        if (submitBtn) submitBtn.disabled = false;
        if (!result.ok) {
          showResult((result.data && result.data.error) || "提交失败，请稍后再试", true);
          return;
        }
        showResult("已收到你的反馈，感谢！", false);
        form.reset();
        prefillFromQuery();
      })
      .catch(function () {
        if (submitBtn) submitBtn.disabled = false;
        showResult("网络错误，提交未成功，请稍后再试", true);
      });
  });

  prefillFromQuery();
})();
