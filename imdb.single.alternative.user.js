// ==UserScript==
// @name        srrDB release lister for IMDB (single) - Alternative
// @icon        https://imdb.com/favicon.ico
// @namespace   https://srrdb.com/
// @downloadURL https://raw.githubusercontent.com/srrDB/srrextra/master/imdb.single.alternative.user.js
// @updateURL   https://raw.githubusercontent.com/srrDB/srrextra/master/imdb.single.alternative.user.js
// @version     1.0
// @description Lists releases from srrdb.com on imdb.com
// @author      Pro-Tweaker
// @author      Skalman
// @author      Lazur
// @match       https://imdb.com/title/*
// @match       https://*.imdb.com/title/*
// @require     https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/js/all.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js
// @grant       GM_addStyle
// @grant       GM_setClipboard
// ==/UserScript==

(function () {
  'use strict';

  GM_addStyle('.release { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }');
  GM_addStyle('.release a { border-radius:3px; }');
  GM_addStyle('.copy-release-name { display:inline-block; border-radius:3px; cursor:pointer; margin-right:5px; color:black; }');
  GM_addStyle('.blink-text { animation: blinker 0.1s steps(2) 4; }');
  GM_addStyle('@keyframes blinker { from { background-color:rgba(245,197,24,0); } to { color:#000; background-color:rgba(245,197,24,1); } }');

  var idPattern = /\d{7,8}/;
  var imdbId = idPattern.exec(document.location.href);

  var url = `https://api.srrdb.com/v1/search/imdb:${imdbId}/foreign:no/category:x264/--internal/--hdtv/--subfix/--nfofix`;

  var html = `
  <section class="ipc-page-section ipc-page-section--base">
    <div class="ipc-title ipc-title--base ipc-title--section-title ipc-title--on-textPrimary">
      <a href="https://www.srrdb.com/browse/imdb%3Att${imdbId}/1" target="_blank" class="ipc-title-link-wrapper" tabindex="0">
        <h3 class="ipc-title__text">
          <span>Scene releases - srrDB</span><svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" class="ipc-icon ipc-icon--chevron-right-inline ipc-icon--inline ipc-title-link ipc-title-link-chevron" viewBox="0 0 24 24" fill="currentColor" role="presentation"><path d="M5.622.631A2.153 2.153 0 0 0 5 2.147c0 .568.224 1.113.622 1.515l8.249 8.34-8.25 8.34a2.16 2.16 0 0 0-.548 2.07c.196.74.768 1.317 1.499 1.515a2.104 2.104 0 0 0 2.048-.555l9.758-9.866a2.153 2.153 0 0 0 0-3.03L8.62.61C7.812-.207 6.45-.207 5.622.63z"></path></svg>
        </h3>
      </a>
    </div>
    <div style="margin-top: 20px; margin: 0 var(--ipt-pageMargin,1rem);">
      <ul id="release-lister" style="padding-left: 0; margin-bottom: 0;">
        <li id="release-loading" class="release">Loading releases...</li>
      </ul>
    </div>
  </section>
  `;

  var beginning = $('div.ipc-page-grid').first().children().first();
  var sections = $(beginning).find('section');

  var has_awards = $('body').html().indexOf('StaticFeature_Awards');
  if(has_awards >= 0) {
      $(html).insertBefore(sections.eq(1));
  } else {
      $(html).insertBefore(sections.first());
  }

  $.ajax({
    dataType: "json",
    url: url
  }).done(function (data) {
    var releases = data.results;
    $("#release-loading").remove();

    $.each(releases, function (index, value) {
      var releasename = value.release;
      var url = `https://www.srrdb.com/release/details/${releasename}`;

      var repeatHtml = `<li class="release" title="${releasename}"><i class="copy-release-name far fa-copy"></i><a class="ipc-link ipc-link--base" target="_blank" href="${url}">${releasename}</a></li>`;

      $("#release-lister").append(repeatHtml);
    });
  });

  $(document).on('click', '.copy-release-name', function (evt) {
    var select = $(this).next();
    GM_setClipboard(select.text());

    select.addClass('blink-text');
    setTimeout(function () { select.removeClass('blink-text') }, 500);

    evt.preventDefault();
  });
})();
