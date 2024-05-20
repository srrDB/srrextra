// ==UserScript==
// @name		srrDB release lister for IMDB (single)
// @icon		https://imdb.com/favicon.ico
// @namespace	https://srrdb.com/
// @downloadURL	https://github.com/srrDB/srrextra/raw/master/imdb.single.user.js
// @updateURL	https://github.com/srrDB/srrextra/raw/master/imdb.single.user.js
// @version		1.0
// @description	Lists releases from srrdb.com on imdb.com
// @author		Skalman
// @author		Lazur
// @match		https://imdb.com/title/*
// @match		https://*.imdb.com/title/*
// @require		https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/js/all.min.js
// @require		https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js
// @resource	CSS https://github.com/srrDB/srrextra/raw/master/imdb.single.user.css
// @resource	HAVE file:///C:\path\to\list_of_releases_you_have.txt
// @grant		GM_addStyle
// @grant		GM_setClipboard
// @grant		GM_getResourceText
// ==/UserScript==

/*global $,GM_addStyle,GM_setClipboard*/
/*jshint esversion: 6 */

(function () {
	'use strict';

	console.clear();

	// Configuration -----------------------------------------------------------
	const resolutions = ["720p", "1080p", "2160p"]; // Possible options: 720p, 1080p, 2160p, DVDRiP
	const autoExpand = ["720p"];
	const showOther = true; // Anything that isn't defined in resolutions ends up in Other
	const groupedReleases = {};

	const showInternal = true;
	const showHDTV = false;

	const highlightKeywords = true;
	const highlightBorderStyle = 'solid'; // Valid options: none, solid & dashed

	const highlightHDTV = true;
	const highlightReadNFO = true;
	const highlightFixes = true;
	const highlightUncut = false; // Includes UNCENSORED & UNRATED
	const highlightProper = true; // Includes REPACK & RERIP
	const highlightInternal = true;
	const highlightRemastered = true;

	const showForeign = true;
	const groupForeign = true;
	const autoExpandForeign = false; // If all releases for a resolution are foreign, they will be expanded even if set to false
	const considerMultiAsForeign = true; // Releases containing MULTI will be treated as foreign even if they are not on srrDB
	const highlightForeign = true;

	const languagesToHighlight = [
		'CZECH.DUAL', 'CZECH',
		'DANISH',
		'DUTCH',
		'FiNNiSH',
		'FRENCH.QC', 'SUBFRENCH', 'TRUEFRENCH', 'FRENCH',
		'GERMAN.DL', 'GERMAN.DUBBED.DL', 'GERMAN',
		'iTALiAN',
		'MULTI',
		'NORWEGiAN',
		'POLISH', 'PL.DUAL', 'PLDUB.DUAL', 'PLDUB',
		'LATiN.SPANiSH', 'SPANiSH',
		'SWEDiSH',
	];
	// -------------------------------------------------------------------------

	const haveText = GM_getResourceText("HAVE");
    const haveList = haveText.split('\n').map(line => line.trim()).filter(line => line);

	const styles = GM_getResourceText("CSS");
	GM_addStyle(styles);

	var searchForeign = showForeign ? '' : 'foreign:no/';
	var searchInternal = showInternal ? '' : '--internal/';
	var searchHDTV = showHDTV ? '' : '--hdtv/';
	var idPattern = /\d{7,8}/;
	var imdbId = idPattern.exec(document.location.href);

	var url = `https://api.srrdb.com/v1/search/imdb:${imdbId}/${searchForeign}category:x264/${searchInternal}${searchHDTV}`;

	console.log(url);

	var html = `
	<div data-testid="tm-box-up" class="srrdb-header sc-5766672e-0 gBbqMF">
		<h3 class="ipc-title__text">Scene releases from <a class="ipc-link ipc-link--baseAlt" title="srrDB.com" target="_blank" href="https://www.srrdb.com/">srrDB.com<i class="fas fa-external-link-alt"></i></a></h3>
	</div>
	<div class="srrdb-releases mini-article ${highlightKeywords ? 'highlight-keywords' : ''} highlight-border-${highlightBorderStyle}">
		<span class="ab_widget">
			<div id="release-lister">
				<span id="release-loading">Loading releases...</span>
			</div>
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

		resolutions.forEach(resolution => {
			groupedReleases[resolution] = releases.filter(item => item.release.toLowerCase().includes(resolution.toLowerCase()));
		});

		if(showOther) {
			groupedReleases['Other'] = [];

			releases.forEach(release => {
				let isOrphaned = true;
				resolutions.forEach(resolution => {
					if (groupedReleases[resolution].includes(release)) {
						isOrphaned = false;
					}
				});

				if (isOrphaned) {
					groupedReleases['Other'].push(release);
				}
			});
		}

		if (releases.length > 0) {
			$("#release-loading").remove();
		} else {
			$("#release-loading").text(`No ${resolutions.join(' / ')} release found...`);
		}

		$.each(groupedReleases, function(resolution, releases) {
			if (releases.length > 0) {

				let htmlBlock = `<div class="srrdb-block ${resolution}-block ${autoExpand.includes(resolution) ? 'expanded' : 'collapsed'}">
				<span class="resolution-toggle" data-resolution="${resolution}"><h4><i class="fa-regular fa-square-minus"></i><i class="fa-regular fa-square-plus"></i> ${resolution} <span>(${releases.length})</span></h4></span>
				<ul>`;

				let foreignReleasesBlock = ``;

				const foreignReleases = [];

				releases.forEach(item => {
					let releasename = item.release;
					let isForeign = (item.isForeign.toLowerCase() === "yes");
					let url = `https://www.srrdb.com/release/details/${releasename}`;

					if (!isForeign && considerMultiAsForeign) {
						const multiPattern = /\.\d{4}(?:\.[^.]+)?\.MULT[Ii](?!.*?SUBS)\./;
						if (multiPattern.test(item.release)) {
							isForeign = true;
						}
					}
					
					if(isForeign) {
						foreignReleases.push(item);
					}

					var haveReleaseCheck = '';
					if (haveList.includes(releasename)) {
						haveReleaseCheck = '<i class="fas fa-check-square have-release-check"></i>';
					}

					var releaseNameText = releasename;

					const highlightRules = [
						{ condition: highlightHDTV, regex: /\.(HDTV)\./ig, classSuffix: 'hdtv' },
						{ condition: highlightReadNFO, regex: /\.(READ\.?NFO)\./ig, classSuffix: 'readnfo' },
						{ condition: highlightUncut, regex: /\.(UNCUT|UNRATED|UNCENSORED)\./g, classSuffix: 'uncut' },
						{ condition: highlightProper, regex: /\.(PROPER|REPACK|RERIP)\./ig, classSuffix: 'proper' },
						{ condition: highlightInternal, regex: /\.(iNTERNAL|iNT)\./ig, classSuffix: 'internal' },
						{ condition: highlightRemastered, regex: /\.(REMASTERED)\./ig, classSuffix: 'remastered' },
						{ condition: highlightFixes, regex: /\.((DIR|SUB|NFO|SAMPLE|PROOF?)\.?FIX)\./ig, classSuffix: 'fix' }
					];
					
					highlightRules.forEach(rule => {
						if (rule.condition) {
							releaseNameText = releaseNameText.replace(rule.regex, `.<span class="highlight highlight-${rule.classSuffix}">$1</span>.`);
						}
					});

					$.each(languagesToHighlight, function(index, language) {
						const regex = new RegExp(`\\.(${language})\\.(?!SUBS)`, 'ig');
					
						if (regex.test(releaseNameText)) {
							releaseNameText = highlightForeign ? releaseNameText.replace(regex, '.<span class="highlight highlight-foreign">$1</span>.') : releaseNameText;
							return false;
						}
					});

					const commonHtmlBlock = `<li class="release ipc-link ipc-link--baseAlt" title="${releasename}"><i
						class="ipc-link ipc-link--baseAlt copy-release-name fa-regular fa-copy"></i>${haveReleaseCheck}<a
						class="ipc-link ipc-link--baseAlt" target="_blank" href="${url}">${releaseNameText}</a></li>`;
				
					if (!isForeign || !groupForeign) {
						htmlBlock += commonHtmlBlock;
					} else {
						foreignReleasesBlock += commonHtmlBlock;
					}

				});

				if(foreignReleases.length > 0 && groupForeign) {
					const htmlForeignBlock = `<div class="srrdb-block foreign-${resolution}-block ${releases.length === foreignReleases.length || autoExpandForeign ? 'expanded' : 'collapsed'}">
					<span class="foreign-toggle" data-foreign-resolution="${resolution}"><h4><i class="fa-regular fa-square-minus"></i><i class="fa-regular fa-square-plus"></i> Foreign <span>(${foreignReleases.length})</span></h4></span>
					<ul>`;

					htmlBlock += htmlForeignBlock;
					htmlBlock += foreignReleasesBlock;
					htmlBlock += `</ul></div>`

				}

				htmlBlock += `</ul></div>`;

				$("#release-lister").append(htmlBlock);
			
			}

		});

	});

	$(document).on('click', '.resolution-toggle', function() {
		var resolution = $(this).data('resolution');
		var parentClass = '.' + resolution + '-block';
		$(parentClass).toggleClass('collapsed expanded');
	});

	$(document).on('click', '.foreign-toggle', function() {
		var resolution = $(this).data('foreign-resolution');
		var parentClass = '.foreign-' + resolution + '-block';
		$(parentClass).toggleClass('collapsed expanded');
	});

	$(document).on('click', '.copy-release-name', function (evt) {
		var select = $(this).nextAll('a').first();
		GM_setClipboard(select.text().trim());

		select.addClass('blink-text');
		setTimeout(function () { select.removeClass('blink-text'); }, 300);

		evt.preventDefault();
	});

})();
