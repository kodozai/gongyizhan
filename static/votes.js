(function () {
  "use strict";

  // 社区投票判失效——纯前端展示与投票交互，零依赖。
  // 接口失败/网络不通时一律静默隐藏投票数据，绝不阻塞或影响页面其余内容（站点照常可用）。

  function applyRowData(wrap, data) {
    var text = wrap.querySelector("[data-community-text]");
    var flag = wrap.querySelector("[data-community-flag]");
    if (!data || data.up + data.down === 0) {
      wrap.hidden = true;
      return;
    }
    if (text) text.textContent = "社区 7 天：还能用 " + data.up + " · 失效 " + data.down;
    if (flag) flag.hidden = !data.flagged;
    wrap.hidden = false;
  }

  function hideAllRows(wraps) {
    wraps.forEach(function (wrap) {
      wrap.hidden = true;
    });
  }

  function setDetailCounts(section, data) {
    if (!data) return;
    var upCount = section.querySelector('[data-vote-count="up"]');
    var downCount = section.querySelector('[data-vote-count="down"]');
    var flagNote = section.querySelector("[data-vote-flag]");
    if (upCount) upCount.textContent = data.up;
    if (downCount) downCount.textContent = data.down;
    if (flagNote) flagNote.hidden = !data.flagged;
  }

  function initDetailVoting(section) {
    var slug = section.getAttribute("data-slug");
    var upBtn = section.querySelector('[data-vote="up"]');
    var downBtn = section.querySelector('[data-vote="down"]');
    var msg = section.querySelector("[data-vote-msg]");
    if (!slug || (!upBtn && !downBtn)) return;

    function showMsg(text) {
      if (!msg) return;
      msg.hidden = false;
      msg.textContent = text;
    }

    function lockButtons() {
      if (upBtn) upBtn.disabled = true;
      if (downBtn) downBtn.disabled = true;
    }

    function castVote(vote, clickedBtn) {
      if (clickedBtn) clickedBtn.disabled = true;
      fetch("/api/votes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: slug, vote: vote }),
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
          if (!result.ok) {
            showMsg((result.data && result.data.error) || "投票失败，请稍后再试");
            if (clickedBtn) clickedBtn.disabled = false;
            return;
          }
          setDetailCounts(section, result.data);
          lockButtons();
          showMsg("感谢反馈，已记录你的投票（" + (vote === "up" ? "还能用" : "失效了") + "）。");
        })
        .catch(function () {
          showMsg("网络错误，投票未成功，请稍后再试");
          if (clickedBtn) clickedBtn.disabled = false;
        });
    }

    if (upBtn) {
      upBtn.addEventListener("click", function () {
        castVote("up", upBtn);
      });
    }
    if (downBtn) {
      downBtn.addEventListener("click", function () {
        castVote("down", downBtn);
      });
    }
  }

  function init() {
    var rowWraps = Array.prototype.slice.call(document.querySelectorAll("[data-community]"));
    var detailSection = document.querySelector(".community-vote[data-slug]");

    if (detailSection) initDetailVoting(detailSection);
    if (!rowWraps.length && !detailSection) return;

    fetch("/api/votes")
      .then(function (res) {
        if (!res.ok) throw new Error("bad status");
        return res.json();
      })
      .then(function (payload) {
        var stations = (payload && payload.stations) || {};
        rowWraps.forEach(function (wrap) {
          var row = wrap.closest("[data-slug]");
          var slug = row && row.getAttribute("data-slug");
          applyRowData(wrap, slug ? stations[slug] : null);
        });
        if (detailSection) {
          var slug = detailSection.getAttribute("data-slug");
          setDetailCounts(detailSection, stations[slug]);
        }
      })
      .catch(function () {
        hideAllRows(rowWraps);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
