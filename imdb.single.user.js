// ==UserScript==
// @name		srrDB release lister for IMDB (single)
// @icon		https://imdb.com/favicon.ico
// @namespace	https://srrdb.com/
// @downloadURL https://raw.githubusercontent.com/srrDB/srrextra/master/imdb.single.user.js
// @updateURL	https://raw.githubusercontent.com/srrDB/srrextra/master/imdb.single.user.js
// @version		0.4.3
// @description Lists releases from srrdb.com on imdb.com
// @author		Skalman
// @author		Lazur
// @match		https://imdb.com/title/*
// @match		https://*.imdb.com/title/*
// @require		https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/js/all.min.js
// @require		https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js
// @grant		GM_addStyle
// @grant		GM_setClipboard
// ==/UserScript==

/*global $,GM_addStyle,GM_setClipboard*/
/*jshint esversion: 6 */

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

	const languagesToHighlight = [
		'CZECH.DUAL', 'CZECH',
		'DANISH',
		'DUTCH',
		'FiNNiSH',
		'FRENCH.QC', 'SUBFRENCH', 'TRUEFRENCH', 'FRENCH',
		'GERMAN.DL', 'GERMAN.DUBBED.DL', 'GERMAN',
		'iTALiAN',
		'NORWEGiAN',
		'POLISH', 'PL.DUAL', 'PLDUB.DUAL', 'PLDUB',
		'SPANiSH',
		'SWEDiSH',
	];

	var highlightColor = 'rgb(245, 197, 24)'; // default
	var highlightHDTVColor = 'rgb(220, 20, 40)';
	var highlightLanguageColor = 'rgb(127, 106, 252)';
	// -------------------------------------------------------------------------

	// Add styles
	GM_addStyle(`.lnlBxO {align-items:start;}`);
	GM_addStyle(`.srrdb-releases {--highlight-default:rgb(245,197,24);--highlight-hdtv:rgb(220,20,40);--highlight-foreign:rgb(127,106,252);background-color:rgba(255,255,255,0.08);border-radius:var(--ipt-cornerRadius);padding:4px 8px;}`);
	GM_addStyle(`.srrdb-header {font-weight:bold;margin-bottom:0.5rem;}`);
	GM_addStyle(`.srrdb-footer {font-weight:bold;margin-top:0.5rem;margin-bottom:1rem;text-align:right;}`);
	GM_addStyle(`.srrdb-header .fa-external-link-alt,.srrdb-footer .fa-external-link-alt {margin-left:0.25rem;scale:0.7;}`);
	GM_addStyle(`.release {white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:10pt;letter-spacing:-0.5px;display:block;}`);
	GM_addStyle(`.release a {display:inline;border-radius:3px;padding:0 2px;}`);
	GM_addStyle(`.highlight {background-color:rgba(0,0,0,0.15);box-shadow:inset 0px 0px 2px 1px rgba(0,0,0,0.75);border-radius:4px;border-style:solid;border-width:1px 0;border-color:var(--highlight-default);}`);
	GM_addStyle(`.highlight-hdtv {border-color:var(--highlight-hdtv);}`);
	GM_addStyle(`.highlight-foreign {border-color:var(--highlight-foreign);}`);
	GM_addStyle(`.copy-release-name {display:inline-block;cursor:pointer;margin-right:3px;color:#fff!important;}`);
	GM_addStyle(`.have-release-check {color:rgb(103,173,75);margin-right:1px;margin-left:2px;}`);
	GM_addStyle(`.blink-text {animation:blinker 0.1s steps(1) infinite;}`);
	GM_addStyle(`.blink-text .highlight {background:none;border:none;box-shadow:none;}`);
	GM_addStyle(`@keyframes blinker {0% {color:#000;background-color:rgba(245,197,24,1);} 50% {color:rgb(245,197,24);background-color:rgba(245,197,24,0);} 100% {color:#000;background-color:rgba(245,197,24,1);}}`);
	
	var searchForeign = showForeign ? '' : 'foreign:no/';
	var searchInternal = showInternal ? '' : '--internal/';
	var searchHDTV = showHDTV ? '' : '--hdtv/';
	var idPattern = /\d{7,8}/;
	var imdbId = idPattern.exec(document.location.href);

	var url = `https://api.srrdb.com/v1/search/imdb:${imdbId}/${searchForeign}category:x264/${resolution}/${searchInternal}${searchHDTV}--subfix/--nfofix`;

	var html = `
	<div data-testid="tm-box-up" class="srrdb-header sc-5766672e-0 gBbqMF">
		<h3 class="ipc-title__text">Scene releases from <a class="ipc-link ipc-link--baseAlt" title="srrDB.com" target="_blank" href="https://www.srrdb.com/">srrDB.com<i class="fas fa-external-link-alt"></i></a></h3>
	</div>
	<div class="srrdb-releases mini-article">
		<span class="ab_widget">
			<ul id="release-lister">
				<li id="release-loading">Loading releases...</li>
			</ul>
		</span>
	</div>
	<div class="srrdb-footer">
		<a class="ipc-link ipc-link--baseAlt" target="_blank" href="https://www.srrdb.com/browse/imdb%3Att${imdbId}/1">Show all releases<i class="fas fa-external-link-alt"></i></a></div>
	</div>
	`;
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

		$.each(releases, function (index, value) {
			var releasename = value.release;
			var url = `https://www.srrdb.com/release/details/${releasename}`;

			var releaseNameText = releasename;
			releaseNameText = highlightHDTV ? releaseNameText.replace(/(HDTV)/ig, '<span class="highlight highlight-hdtv">$1</span>') : releaseNameText;

			releaseNameText = highlightProper ? releaseNameText.replace(/(PROPER)/ig, '<span class="highlight">$1</span>') : releaseNameText;
			releaseNameText = highlightInternal ? releaseNameText.replace(/(iNTERNAL)/ig, '<span class="highlight">$1</span>') : releaseNameText;
			releaseNameText = highlightRemastered ? releaseNameText.replace(/(REMASTERED)/ig, '<span class="highlight">$1</span>') : releaseNameText;

			for (const language of languagesToHighlight) {
				const regex = new RegExp(`(${language})`, 'ig');

				if (regex.test(releaseNameText)) {
					releaseNameText = highlightForeign ? releaseNameText.replace(regex, '<span class="highlight highlight-foreign">$1</span>') : releaseNameText;
					break;
				}
			}

			var haveReleaseCheck = '';
			if (haveList.includes(releasename)) {
				haveReleaseCheck = '<i class="fas fa-check-square have-release-check"></i>';
			}

			var repeatHtml = `<li class="release ipc-link ipc-link--baseAlt" title="${releasename}"><i class="ipc-link ipc-link--baseAlt copy-release-name far fa-copy"></i>${haveReleaseCheck}<a class="ipc-link ipc-link--baseAlt" target="_blank" href="${url}">${releaseNameText}</a></li>`;

			$("#release-lister").append(repeatHtml);
		});
	});

	$(document).on('click', '.copy-release-name', function (evt) {
		var select = $(this).nextAll('a').first();
		GM_setClipboard(select.text().trim());

		select.addClass('blink-text');
		setTimeout(function () { select.removeClass('blink-text'); }, 300);

		evt.preventDefault();
	});
})();
