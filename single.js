// ==UserScript==
// @name		srrDB release lister for IMDB (single)
// @namespace	https://srrdb.com/
// @updateURL   https://bitbucket.org/srrdb/srrextra/raw/master/single.js
// @version		0.2
// @description	Lists releases from srrdb.com on imdb.com
// @author		Skalman
// @author		Lazur
// @match		https://imdb.com/title/*
// @match		https://*.imdb.com/title/*
// @require     https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.13.1/js/all.min.js
// @grant       GM_addStyle
// @grant       GM_setClipboard
// ==/UserScript==

/*global $*/

(function() {
	'use strict';

	console.clear();

    // Add styles
    GM_addStyle('.release { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }');
    GM_addStyle('.release a { border-radius:3px; }');
    GM_addStyle('.copy-release-name { display:inline-block; border-radius:3px; cursor:pointer; margin-right:5px; color:black; }');
    GM_addStyle('.blink-text { animation: blinker 0.1s steps(2) 4; }');
    GM_addStyle('@keyframes blinker { from { background-color:rgba(245,197,24,0); } to { color:#000; background-color:rgba(245,197,24,1); } }');

	var idPattern = /\d{7}/;
	var imdbId = idPattern.exec(document.location.href);

	var url = `https://www.srrdb.com/api/search/imdb:${imdbId}/foreign:no/category:x264/720/--internal/--hdtv/--subfix/--nfofix`;
	var self = $(this);

	var html = `
<div class="mini-article">
	<span class="ab_widget"><div class="ab_ninja">
		<span class="widget_header">
			<span class="oneline">
				<a title="Show more..." target="_blank" href="https://www.srrdb.com/"><h3>Scene releases - srrDB</h3></a>
			</span>
		</span>
<ul id="release-lister" style="margin-bottom: 0;">
<li id="release-loading">Loading releases...</li>
</ul>
<div style="margin-top: 15px; text-align: right;"><a target="_blank" href="https://www.srrdb.com/browse/imdb%3Att${imdbId}/1">Show more...</a></div>
		</div>
	</span>
</div>
`;
	$(html).prependTo($("#sidebar"));

	$.ajax({
		dataType: "json",
		url: url
	}).done(function(data) {
		var releases = data.results;
		$("#release-loading").remove();

		$.each(releases, function( index, value ) {
			var releasename = value.release;
			var url = `https://www.srrdb.com/release/details/${releasename}`;

			var repeatHtml = `<li class="release" title="${releasename}"><i class="copy-release-name far fa-copy"></i><a target="_blank" href="${url}">${releasename}</a></li>`;

			$("#release-lister").append(repeatHtml);
		});
	});

    $(document).on('click', '.copy-release-name', function(evt){
        var select = $(this).next();
        GM_setClipboard(select.text());

        select.addClass('blink-text');
        setTimeout(function(){ select.removeClass('blink-text') }, 500);

        evt.preventDefault();
    });
})();
