// ==UserScript==
// @name		srrDB release lister for IMDB (single)
// @icon		https://imdb.com/favicon.ico
// @namespace	https://srrdb.com/
// @downloadURL https://raw.githubusercontent.com/srrDB/srrextra/master/imdb.single.user.js
// @updateURL	https://raw.githubusercontent.com/srrDB/srrextra/master/imdb.single.user.js
// @version		0.4.1
// @description Lists releases from srrdb.com on imdb.com
// @author		Skalman
// @author		Lazur
// @match		https://imdb.com/title/*
// @match		https://*.imdb.com/title/*
// @require		https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.13.1/js/all.min.js
// @require		https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js
// @grant		GM_addStyle
// @grant		GM_setClipboard
// ==/UserScript==

/*global $*/

(function () {
	'use strict';

	console.clear();

	// Configuration -----------------------------------------------------------
	var resolution = '720p';
	var showInternal = true;
	var showHDTV = false;

	var highlightHDTV = true;
	var highlightProper = true;
	var highlightInternal = true;
	var highlightRemastered = true;

	var haveList = [""]; //a list of releases

	var showForeign = false;
	var highlightForeign = true;

	var highlightColor = 'rgb(245, 197, 24)'; // default
	var highlightHDTVColor = 'rgb(220, 20, 40)';
	var highlightLanguageColor = 'rgb(127, 106, 252)';
	// -------------------------------------------------------------------------

	// Add styles
	GM_addStyle(`.srrdb-releases {--highlight-default: ${highlightColor};--highlight-hdtv: ${highlightHDTVColor};--highlight-foreign: ${highlightLanguageColor};}`);
	GM_addStyle(`.release {white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:10pt;letter-spacing:-0.5px;display:block;}`);
	GM_addStyle(`.release a {text-shadow:0 0 1px #000;display:inline;}`);
	GM_addStyle(`.highlight {background-color:rgba(0,0,0,0.15);box-shadow: inset 0px 0px 2px 2px #000000, 0px 0px 1px var(--highlight-default);border-radius:4px;border-style:solid;border-width:1px 0;border-color:var(--highlight-default);}`);
	GM_addStyle(`.highlight-hdtv {box-shadow: inset 0px 0px 2px 2px #000000, 0px 0px 1px var(--highlight-hdtv);border-color:var(--highlight-hdtv);}`);
	GM_addStyle(`.highlight-foreign {box-shadow: inset 0px 0px 2px 2px #000000, 0px 0px 1px var(--highlight-foreign);border-color:var(--highlight-foreign);}`);
	GM_addStyle(`.copy-release-name {display:inline-block;cursor:pointer;margin-right:5px;}`);
	GM_addStyle(`.blink-text {animation: blinker 0.1s steps(2) 4;}`);
	GM_addStyle(`.green-checkmark { color: green; font-weight: bold;}`);
	GM_addStyle(`@keyframes blinker {from {background-color:rgba(245,197,24,0);} to {color:#000;background-color:rgba(245,197,24,1);}}`);

	var searchForeign = showForeign ? '' : 'foreign:no/';
	var searchInternal = showInternal ? '' : '--internal/';
	var searchHDTV = showHDTV ? '' : '--hdtv/';
	var idPattern = /\d{7,8}/;
	var imdbId = idPattern.exec(document.location.href);

	var url = `https://api.srrdb.com/v1/search/imdb:${imdbId}/${searchForeign}category:x264/${resolution}/${searchInternal}${searchHDTV}--subfix/--nfofix`;
	var self = $(this);

	var html = `
	<div class="mini-article srrdb-releases" style="margin-bottom:10px">
		<span class="ab_widget"><div class="ab_ninja">
			<span class="widget_header">
				<span class="oneline">
					<a class="ipc-link ipc-link--baseAlt" style="margin-bottom:20px;" title="srrDB.com" target="_blank" href="https://www.srrdb.com/"><h3>Scene releases from srrDB.com</h3></a>
				</span>
			</span>
			<ul id="release-lister" style="margin-bottom: 0;">
				<li id="release-loading">Loading releases...</li>
			</ul>
			<div style="margin-top: 15px; text-align: right;">
				<a class="ipc-link ipc-link--baseAlt" target="_blank" href="https://www.srrdb.com/browse/imdb%3Att${imdbId}/1">Show more...</a></div>
			</div>
		</span>
	</div>
	`;
	//$(html).prependTo($("#sidebar"));
	//$(html).prependTo($(".WatchBox__WatchParent-sc-1kx3ihk-5"));
	$(html).prependTo($("button[data-testid='tm-box-wl-button']").parent().parent());

	$.ajax({
		dataType: "json",
		url: url
	}).done(function (data) {
		var releases = data.results;

		if (releases.length > 0) {
			$("#release-loading").remove();
		} else {
			$("#release-loading").text(`No ${resolution} release found...`);
		}

		//TODO: loop instead of list below
		var foreignLanguages = ["FRENCH", "GERMAN", "ITALIAN", "SPANISH", "POLISH", "SWEDISH", "DANiSH", "NORWEGiAN"];

		$.each(releases, function (index, value) {
			var releasename = value.release;
			var url = `https://www.srrdb.com/release/details/${releasename}`;

			var releaseNameText = releasename;
			releaseNameText = highlightHDTV ? releaseNameText.replace(/(HDTV)/ig, '<span class="highlight highlight-hdtv">$1</span>') : releaseNameText;

			releaseNameText = highlightProper ? releaseNameText.replace(/(PROPER)/ig, '<span class="highlight">$1</span>') : releaseNameText;
			releaseNameText = highlightInternal ? releaseNameText.replace(/(iNTERNAL)/ig, '<span class="highlight">$1</span>') : releaseNameText;
			releaseNameText = highlightRemastered ? releaseNameText.replace(/(REMASTERED)/ig, '<span class="highlight">$1</span>') : releaseNameText;

			releaseNameText = highlightForeign ? releaseNameText.replace(/(FRENCH)/ig, '<span class="highlight-foreign">$1</span>') : releaseNameText;
			releaseNameText = highlightForeign ? releaseNameText.replace(/(GERMAN)/ig, '<span class="highlight-foreign">$1</span>') : releaseNameText;
			releaseNameText = highlightForeign ? releaseNameText.replace(/(ITALIAN)/ig, '<span class="highlight-foreign">$1</span>') : releaseNameText;
			releaseNameText = highlightForeign ? releaseNameText.replace(/(SPANISH)/ig, '<span class="highlight-foreign">$1</span>') : releaseNameText;

			releaseNameText = highlightForeign ? releaseNameText.replace(/(POLISH)/ig, '<span class="highlight-foreign">$1</span>') : releaseNameText;

			releaseNameText = highlightForeign ? releaseNameText.replace(/(SWEDISH)/ig, '<span class="highlight-foreign">$1</span>') : releaseNameText;
			releaseNameText = highlightForeign ? releaseNameText.replace(/(DANiSH)/ig, '<span class="highlight-foreign">$1</span>') : releaseNameText;
			releaseNameText = highlightForeign ? releaseNameText.replace(/(NORWEGiAN)/ig, '<span class="highlight-foreign">$1</span>') : releaseNameText;

			if (haveList.includes(releasename)) {
				releaseNameText = '<span class="green-checkmark">&#10004;</span>&nbsp;' + releaseNameText;
			}

			var repeatHtml = `<li class="release ipc-link ipc-link--baseAlt" title="${releasename}"><i class="ipc-link ipc-link--baseAlt copy-release-name far fa-copy"></i><a class="ipc-link ipc-link--baseAlt" target="_blank" href="${url}">${releaseNameText}</a></li>`;

			$("#release-lister").append(repeatHtml);
		});
	});

	$(document).on('click', '.copy-release-name', function (evt) {
		var select = $(this).next().clone().children().remove(".green-checkmark").end(); //ugly way to remove the sub-span (gren check mark)
		GM_setClipboard(select.text().trim());

		select = $(this).next();

		select.addClass('blink-text');
		setTimeout(function () { select.removeClass('blink-text') }, 500);

		evt.preventDefault();
	});
})();
