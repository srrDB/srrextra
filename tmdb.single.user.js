// ==UserScript==
// @name        srrDB release lister for The Movie Database (TMDB)
// @icon        https://www.themoviedb.org/favicon.ico
// @namespace   https://srrdb.com/
// @match       https://*.themoviedb.org/movie/*
// @match       https://www.themoviedb.org/movie/*
// @version     1.0
// @author      Pro-Tweaker
// @author      Skalman
// @author      Lazur
// @description Lists releases from srrdb.com on themoviedb.org
// @require     https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/js/all.min.js
// @grant       GM_addStyle
// @grant       GM_setClipboard
// ==/UserScript==

const TMDB_API_KEY = ""; // Don't forget to add your TMDB API key

(function () {
  'use strict';

  console.clear();

  GM_addStyle('.release { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }');
  GM_addStyle('.release a { border-radius:3px; }');
  GM_addStyle('.copy-release-name { display:inline-block; border-radius:3px; cursor:pointer; margin-right:5px; color:black; }');
  GM_addStyle('.blink-text { animation: blinker 0.1s steps(2) 4; }');
  GM_addStyle('@keyframes blinker { from { background-color:rgba(245,197,24,0); } to { color:#000; background-color:rgba(245,197,24,1); } }');

  var id_regex = /\/(\d+)(?=-|$|\?)/;
  var id = id_regex.exec(document.location.href)[1];

  getIMDbID(id, function (imdbId) {
    if (imdbId) {
      console.log('IMDb ID:', imdbId);

      insertIMDbLink(imdbId);

      var idPattern = /\d{7,8}/;
      var imdbId = idPattern.exec(imdbId);

      var url = `https://api.srrdb.com/v1/search/imdb:${imdbId}/foreign:no/category:x264/--internal/--hdtv/--subfix/--nfofix`;

      var html = `
      <section class="panel">
        <h3 dir="auto">Scene releases - srrDB</h3>
        <div class="should_fade">
          <ul id="release-lister" style="padding-left: 0; margin-bottom: 0;">
            <li id="release-loading" class="release">Loading releases...</li>
          </ul>
          <div class="style_wrapper"></div>
        </div>
        <p class="new_button">
          <a href="https://www.srrdb.com/browse/imdb%3Att${imdbId}/1" target="_blank">Show more</a>
        </p>
      </section>
      `;

      $(html).insertBefore($(".top_billed"));

      $.ajax({
        dataType: "json",
        url: url
      }).done(function (data) {
        var releases = data.results;
        $("#release-loading").remove();

        $.each(releases, function (index, value) {
          var releasename = value.release;
          var url = `https://www.srrdb.com/release/details/${releasename}`;
          var repeatHtml = `<li class="release" title="${releasename}"><i class="copy-release-name far fa-copy"></i><a target="_blank" href="${url}">${releasename}</a></li>`;

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

    } else {
      console.log('Error fetching IMDb ID.');
    }
  });
})();

function getIMDbID(movieID, callback) {
  const apiUrl = `https://api.themoviedb.org/3/movie/${movieID}?api_key=${TMDB_API_KEY}`;

  $.get(apiUrl, function (data) {
    const imdbId = data.imdb_id;
    callback(imdbId);
  }).fail(function (jqXHR, textStatus, errorThrown) {
    console.error('Request failed with status:', jqXHR.status);
    callback(null);
  });
}

function insertIMDbLink(imdbID) {
  var html = `
  <div class="homepage">
    <a class="social_link" href="http://www.imdb.com/title/${imdbID}" target="_blank" rel="noopener" data-role="tooltip" title="Visit IMDb">
      <i class="glyphicons_v2 fa-brands fa-imdb" style="vertical-align: baseline;"></i>
    </a>
  </div>
  `;

  if ($('div.social_links div').length > 0) {
    $(html).insertAfter($("div.social_links div:last-child"));
  } else {
    $("div.social_links").append(html);
  }
}
