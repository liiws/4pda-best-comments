// ==UserScript==
// @name         4pda-best-comments
// @namespace    https://4pda.ru/
// @version      1.1
// @include      /^https://4pda\.ru/\d{4}/\d{2}/\d{2}.*$/
// @grant        none
// @run-at      document-start
// @downloadURL https://bitbucket.org/liiws/4pda-best-comments/downloads/4pda-best-comments.user.js
// @updateURL   https://bitbucket.org/liiws/4pda-best-comments/downloads/4pda-best-comments.meta.js
// ==/UserScript==

window.addEventListener('load', RunDelay);

// comments' marks are not loaded immediately
function RunDelay() {
    window.removeEventListener('load', RunDelay);
    setTimeout(Run, 1500);
}

function Run() {

	// options
	var _fgAuthor = '#F76D59';
	var _bgAuthor = '#FFAA9D';
	var _fgPositiveMark = '#339900';
	var _fgNegativeMark = '#CC0000';
	var _fgZeroMark = '#548EAA';
	var _bgColor = '#F8F8F8';
	var _bgColorNew = '#E8E8FF';
	var _bgColorSelected = '#3D438D';
	var _highlightIntervalMs = 5400;
	var _scrollTopOffsetPc = 0.2;
	var _fgMedia = '#0000FF';
	var _fgLink = '#366804';


	var authorElement = $(".post__user-info.user-info");
	var authorLogin = authorElement.length == 0 ? "" : authorElement.attr("href").split("/").filter(x => x != "").pop();

	ShowCommentsPanel();
	function ShowCommentsPanel() {
		var allComments = GetAllComments();
		ShowComments(allComments);
	}

	function GetAllComments() {
		var allComments = [];
		$('div[id^="comment-"]').each(function (index, item) {
			var isComment = item && item.id && /^comment-\d+$/.test(item.id);
			if (!isComment) {
				return;
			}
			var isBanned = item.className == 'deleted';
			if (isBanned) {
				return;
			}
			var id = $(item).attr('id');
            var idNumber = id.match(/\d+/);
            idNumber = idNumber ? +idNumber[0] : 0;
            var mark = +$('> .heading > .text-right > .karma > .num-wrap > .num', item).text();
			var hasImg = false;// $('> .comment__message', item).find('img').length > 0;
			var hasVideo = false;// $('> .comment__message', item).find('iframe').length > 0;
			var hasLink = false;// $('> .comment__message', item).find('a').length > 0;

			allComments.push(
			{
				id: id,
                idNumber: idNumber,
				mark: mark,
				hasImg: hasImg,
				hasVideo: hasVideo,
				hasLink: hasLink,
			});
		});


		// remove comments without mark
		allComments = allComments.reduce(function (prev, cur) {
			if (!isNaN(cur.mark)) {
				prev.push(cur);
			}
			return prev;
		}, []);

		// best desc, time asc
		allComments.sort(function (a, b) {
			return a.mark == b.mark
				? (a.idNumber < b.idNumber ? 1 : -1)
				: ((isNaN(a.mark) ? 0 : a.mark) > (isNaN(b.mark) ? 0 : b.mark) ? 1 : -1)
		});
		allComments.reverse();

		return allComments;
	}


	function ShowComments(comments) {
		var wnd = $('<div class="hbc" style="width: 80px; top: 55px; bottom: 10px; right: 49px; overflow: auto; position: fixed; z-index: 999; line-height: 1.1em;"></div>');
		$(wnd).css('background-color', _bgColor);
		$('body').append(wnd);
		$.each(comments, function (index, comment) {

			// right panel

			// create item
			var item = $('<div class="hbc__item" style="text-align: right;"><a href="#" onclick="return false">0</a></div>');
			//$('a', item).attr('href', '#' + comment.id);
			$('a', item).text(isNaN(comment.mark) ? '?' : (comment.mark > 0 ? '+' + comment.mark : comment.mark));
			$('a', item).attr('iid', comment.id);

			// mark color
			if (comment.mark > 0)
				$('a', item).css('color', _fgPositiveMark);
			else if (comment.mark < 0)
				$('a', item).css('color', _fgNegativeMark);
			else
				$('a', item).css('color', _fgZeroMark);


			if (comment.isAuthor) {
				$('a', item).before('<span style="color: ' + _fgAuthor + '; font-weight: bold;">A </span>');
			}
			if (comment.hasImg) {
				$('a', item).before('<span style="color: ' + _fgMedia + '; font-weight: bold;">i </span>');
			}
			else if (comment.hasVideo) {
				$('a', item).before('<span style="color: ' + _fgMedia + ';">v </span>');
			}
			if (comment.hasLink) {
				$('a', item).before('<span style="color: ' + _fgLink + '; font-weight: bold;">L </span>');
			}

			// bg color
			if (comment.isNew) {
				$(item).addClass('hbc__item-when-new');
				$(item).css('background-color', _bgColorNew);
			}

			// onclick event
			$(item).bind('click', Comment_OnClick);

			// add item
			$(wnd).append(item);
		});
	}

	function Comment_OnClick() {
		$('.hbc__item').css('background-color', _bgColor);
		$('.hbc__item-when-new').css('background-color', _bgColorNew);
		$(this).css('background-color', _bgColorSelected);
		// go to url before browser "A" to emulate click at "A" two times. Habr has bug - click on "A" first time after page opening goes to wrong comment.
		//document.location = $(this).find('a').attr('href');

		// scroll to comment
		var id = $(this).find('a').attr('iid');
		var commentElement = document.getElementById(id);
		var elementPosition = GetElementPosition(commentElement);
		var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
		window.scrollTo(0, elementPosition.top - viewHeight*_scrollTopOffsetPc);

		// highlight comment
        commentElement.style.backgroundColor = 'yellow';
        setTimeout(function(){ commentElement.style.backgroundColor = '' ; }, 1500);
	}

  function GetElementPosition(elem) {
    var body = document.body;
    var docEl = document.documentElement;

    var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

    var clientTop = docEl.clientTop || body.clientTop || 0;
    var clientLeft = docEl.clientLeft || body.clientLeft || 0;

    var box = elem.getBoundingClientRect();
    var top  = box.top +  scrollTop - clientTop;
    var left = box.left + scrollLeft - clientLeft;

    return { top: Math.round(top), left: Math.round(left) };
  }
}