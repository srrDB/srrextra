// ==UserScript==
// @name		Srrdb release lister for IMDB (single)
// @namespace	https://srrdb.com/
// @version		0.1
// @description	Lists releases from srrdb.com on imdb.com
// @author		Skalman
// @match		https://imdb.com/title/*
// @match		https://*.imdb.com/title/*
// @grant		none
// ==/UserScript==

/*global $*/

(function() {
	'use strict';

	console.clear();
	var idPattern = /\d{7}/;
	var imdbId = idPattern.exec(document.location.href);

	var url = `https://www.srrdb.com/api/search/imdb:${imdbId}/foreign:no/category:x264/720/--internal/--hdtv/--subfix/--nfofix`;
	var self = $(this);

	var html = `
<div class="mini-article">
	<span class="ab_widget"><div class="ab_ninja">
		<span class="widget_header">
			<span class="oneline">
				<a title="Show more..." target="_blank" href="https://www.srrdb.com/browse/imdb%3Att${imdbId}/1"><h3>Scene releases - srrDB</h3></a>
			</span>
		</span>
<ul id="release-lister" style="margin-bottom: 0;">
<li id="release-loading">Loading releases...</li>
</ul>
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

			var repeatHtml = `<li title="${releasename}" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"><a target="_blank" href="${url}">${releasename}</a></li>`;

			$("#release-lister").append(repeatHtml);
		});
	});
})();