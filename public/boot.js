// Loaded in <head> without async/defer, so it runs before the page is drawn (no flash):
// - utm_content=creative_b (ad B) shows the women-angle headline (the page carries both; CSS picks one);
// - on the landing page, ?theme= or the visitor's saved choice (cookie "theme") picks light or dark;
// - on the landing page, the address bar never shows "#join" or any other "#section": in-page links scroll
//   without changing it, and an address that arrives with one (the thank-you page's "Try again") is cleaned
//   before the first paint, then the page opens at that section. <html data-jump> tells AdAutoScroll.
// No personal data, no network requests.
(function () {
  try {
    var d = document.documentElement;
    var q = new URLSearchParams(location.search);
    if (/creative[_-]?b\b/i.test(q.get("utm_content") || "")) d.setAttribute("data-variant", "b");
    var path = location.pathname.replace(/\/+$/, "").replace(/\.html$/, "") || "/";
    if (path !== "/" && path !== "/index" && path !== "/dark") return;
    cleanSectionLinks();
    if (path === "/dark") return d.setAttribute("data-theme", "dark");
    var t = (q.get("theme") || "").toLowerCase();
    if (t !== "dark" && t !== "light") {
      var m = document.cookie.match(/(?:^|;\s*)theme=(dark|light)/);
      t = m ? m[1] : "";
    }
    if (t) d.setAttribute("data-theme", t);
  } catch (e) {}

  function cleanSectionLinks() {
    // Keyboard and screen-reader users land in the section too, as with a normal link.
    function show(el, behavior) {
      el.scrollIntoView({ block: "start", behavior: behavior });
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
      el.focus({ preventScroll: true });
    }
    var id = decodeURIComponent(location.hash.slice(1));
    if (location.hash) {
      history.replaceState(history.state, "", location.pathname + location.search);
      if (/^[A-Za-z][\w-]*$/.test(id)) {
        document.documentElement.setAttribute("data-jump", id);
        document.addEventListener("DOMContentLoaded", function () {
          var el = document.getElementById(id);
          if (el) show(el, "instant");
        });
      }
    }
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!a || (a.target && a.target !== "_self") || !a.hash || a.origin !== location.origin || a.pathname !== location.pathname) return;
      var el = document.getElementById(decodeURIComponent(a.hash.slice(1)));
      if (!el) return;
      e.preventDefault();
      show(el, "auto"); // "auto" follows the CSS: smooth, or instant with reduced motion
    });
  }
})();
