// Loaded in <head> without async/defer, so it runs before the page is drawn (no flash):
// - utm_content=creative_b (ad B) shows the women-angle headline (the page carries both; CSS picks one);
// - on the landing page, ?theme= or the visitor's saved choice (cookie "theme") picks light or dark.
// No personal data, no network requests.
(function () {
  try {
    var d = document.documentElement;
    var q = new URLSearchParams(location.search);
    if (/creative[_-]?b\b/i.test(q.get("utm_content") || "")) d.setAttribute("data-variant", "b");
    var path = location.pathname.replace(/\/+$/, "").replace(/\.html$/, "") || "/";
    if (path === "/dark") return d.setAttribute("data-theme", "dark");
    if (path !== "/" && path !== "/index") return;
    var t = (q.get("theme") || "").toLowerCase();
    if (t !== "dark" && t !== "light") {
      var m = document.cookie.match(/(?:^|;\s*)theme=(dark|light)/);
      t = m ? m[1] : "";
    }
    if (t) d.setAttribute("data-theme", t);
  } catch (e) {}
})();
