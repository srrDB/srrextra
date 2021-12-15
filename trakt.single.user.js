// ==UserScript==
// @name				srrDB release lister for Trakt.tv (single)
// @namespace		https://srrdb.com/
// @version			0.3
// @description	Lists releases from srrdb.com on trakt.tv
// @author			Skalman
// @author			Lazur
// @author			Pro-Tweaker (adaptation to Trakt.tv)
// @match				https://trakt.tv/movies/*
// @grant				GM_addStyle
// @grant				GM_setClipboard
// ==/UserScript==

/*global $*/

(function () {
	'use strict';

	// console.clear();

	// Add styles
	GM_addStyle('.release { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }');
	GM_addStyle('.release a { border-radius:3px; }');
	GM_addStyle('.copy-release-name { display:inline-block; border-radius:3px; cursor:pointer; margin-right:5px; color:black; }');
	GM_addStyle('.blink-text { animation: blinker 0.1s steps(2) 4; }');
	GM_addStyle('@keyframes blinker { from { background-color:rgba(245,197,24,0); } to { color:#000; background-color:rgba(245,197,24,1); } }');

	var link = "";
	var links = $('.external').first().children().first().children();

	for (let index = 0; index < links.length; ++index) {
		const element = links[index].href;

		if (element.indexOf("imdb") >= 0) {
			link = element;
			break;
		}
	}

	var idPattern = /\d{7,8}/;
	var imdbId = idPattern.exec(link);

	var url = `https://www.srrdb.com/api/search/imdb:${imdbId}/foreign:no/category:x264/--internal/--hdtv/--subfix/--nfofix`;
	var self = $(this);

	var html = `
<div>
	<h2 id="comments">
		<strong>Scene releases - srrDB</strong>
		<a class="see-more-link" target="_blank" href="https://www.srrdb.com/browse/imdb%3Att${imdbId}/1">
 			<div class="see-more">
				<span class="see-more-text">Show more</span>
				<div class="trakt-icon-circle-right fa"></div>
			</div>
		</a>
	</h2>
	<div style="margin-top: 20px;">
		<ul id="release-lister" style="padding-left: 0; margin-bottom: 0;">
			<li id="release-loading" class="release">Loading releases...</li>
		</ul>
	</div>
</div>
	`;

	$(html).insertBefore($("#actors"));

	$.ajax({
		dataType: "json",
		url: url
	}).done(function (data) {
		var releases = data.results;
		$("#release-loading").remove();

		$.each(releases, function (index, value) {
			var releasename = value.release;
			var url = `https://www.srrdb.com/release/details/${releasename}`;

			var repeatHtml = `<li class="release" title="${releasename}"><i class="copy-release-name fa fa-files-o" style="color: #ed1c24;" aria-hidden="true"></i><a target="_blank" href="${url}">${releasename}</a></li>`;

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