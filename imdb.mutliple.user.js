// ==UserScript==
// @name		Srrdb release lister for IMDB (multiple / search)
// @namespace	https://srrdb.com/
// @version		0.1
// @description	Lists releases from srrdb.com on imdb.com
// @author		Skalman
// @match		https://imdb.com/search/title/*
// @match		https://*.imdb.com/search/title/*
// @grant		none
// ==/UserScript==

/*global $*/

//https://www.imdb.com/search/title/?count=100&groups=top_1000&sort=user_rating
//https://www.imdb.com/search/title/?groups=top_1000&sort=num_votes,desc
//https://www.imdb.com/search/title/?num_votes=100000,&sort=num_votes,desc

(function() {
	'use strict';

	console.clear();
	var objs = [];
	var toRun = $("div.lister-item.mode-advanced");
	var idPattern = /\d{7}/;

	//run complete
	function printSummary() {
		//console.clear();
		//console.log(objs);
	}

	$("div.lister-item.mode-advanced").each(function(index) {
		var title = $(this).find(".lister-item-header a").text();
		var imdbUrl = $(this).find(".lister-item-header a").attr("href");
		var imdbId = idPattern.exec(imdbUrl);

		var year = parseInt($(this).find(".lister-item-year").text().substring(1, 5));
		var rating = parseFloat($(this).find(".ratings-imdb-rating strong").text().replace(",", "."));
		var votes = $(this).find(".sort-num_votes-visible span:nth-child(2)").data("value");

		var parentDiv = $(this).find(".lister-item-content");

		$(parentDiv).append(`<div style="background-color: #d8ffda; padding: 5px;" id="movie-${imdbId}"></div>`);

		var obj = {
			"title": title,
			"year": year,
			"imdbId": imdbId,
			"rating": rating,
			"votes" : votes,
			"releases": []
		};
		//console.log(obj);

		var url = `https://api.srrdb.com/v1/search/imdb:${obj.imdbId}/foreign:no/category:x264/720/--internal/--hdtv/--subfix/--nfofix`;
		var self = $(this);

		$.ajax({
			dataType: "json",
			url: url
		}).done(function(data) {
			obj.releases = data.results;
			objs.push(obj);

			var index = toRun.index(self);

			if(toRun.length === 0) {
				//printSummary();
			} else {
				var toInsertInto = $(`#movie-${imdbId}`)

				if(obj.releases.length > 0) {
					$.each(obj.releases, function(index, value) {
						var releasename = value.release;
						var url = `https://www.srrdb.com/release/details/${releasename}`;

						$(toInsertInto).append(`<p><a target="_blank" href="${url}">${releasename}</a></p>`);
					});
				} else {
					$(toInsertInto).css("background-color", "#ffcfcf");
				}

				$(toInsertInto).append(`<p><a target="_blank" href="https://www.srrdb.com/browse/imdb%3Att${obj.imdbId}/1">Show all...</a></p>`);
			}

			if (index > -1) {
				toRun.splice(index, 1);
			}
		});
	});
})();
