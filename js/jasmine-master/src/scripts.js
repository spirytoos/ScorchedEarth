"use strict";

var ansarada=ansarada || {};

ansarada.frog=(function($) {

	var lava;

	function init() {
		// add green bar that we will be animating later
		if(!$("#frog").length)
			$(".lava").after('<div id="frog" style="top: 25px;position: absolute;height: 2px; background-color:#75b81b;"></div>');
		lava=$(".lava").next();
	};

	function fadeIn()
	{
		var currentPageItem=$(".mainNav.lava .current_page_item");

		if(currentPageItem.length)
		lava.css({"left": currentPageItem.position().left,
		"width":currentPageItem.width() }).hide().fadeIn(300);
	}

	function highlight(item)
	{
		var currentPageItem;

		if(!item.length) { removeFrog(); return; }

		if(!$("#frog").length) init();

		var l=$(item).position().left;
		var t=$(item).position().top;
		var w=$(item).width();

		if(!(currentPageItem=$(".mainNav.lava .current_page_item")).length)
		{
			lava.css({"left": item.position().left,
		"width":item.width() }).hide().fadeIn(300);
		}
		else
		{
			var ls=currentPageItem.position().left,
				ws=currentPageItem.width();
		}

		if(ls<l)
		{
			lava.animate({
			"left":ls,
			"top":t+25,
			"width": ws+w*0.7},300,"linear")
			.animate({
				"left":l,
				"top":t+25,
				"width": w},300,"linear",function() {});
		}
		else
		{
			lava.animate({
			"left":ls-w*0.7,
			"top":t+25,
			"width": ws+w*0.7},300,"linear")
			.animate({
				"left":l,
				"top":t+25,
				"width": w},{
				duratioN: 300,
				easing: "linear",
				step: function(n,t)
				{}});
		}

		// manually move current page item to clicked element as header might not be reloaded due to ajax request for new page
		if(currentPageItem.length) currentPageItem.removeClass("current_page_item");

		$(item).addClass("current_page_item");
	}

	function removeFrog()
	{
		$("#frog").fadeOut(1000,function() { $(this).remove(); });

		$(".mainNav.lava .current_page_item").removeClass("current_page_item");
	}

	return {
		init:init,
		fadeIn:fadeIn,
		highlight: highlight
	};

})(jQuery);

// framework module used across all the pages

ansarada.framework=(function($) {

	// used to flag if page content is loaded via ajax or should be full page reload

	var ajaxLoading=false;

	var $header;
	var ie8=false;
	var ie9=false;
	var ie10=false;
	var mobile = ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? true : false );
	var safariWin=false;

	/* as IE10 dosent use conditional coments we apply special class when IE10 is detected and target it from css */

	if (Function('/*@cc_on return document.documentMode===10@*/')()) {

		$("html").addClass("ie10");
		ie10=true;
	}

	if($("html").hasClass("ie8"))
	{
		ie8=true;
	}
	else if($("html").hasClass("ie9"))
	{
		ie9=true;
	}

	if (navigator.appVersion.indexOf("Win")!=-1 && (navigator.userAgent.match(/AppleWebKit/) && ! navigator.userAgent.match(/Chrome/)))
		safariWin=true;

	if(safariWin)
	{
		$("html").addClass("safariWin");
	}


	/* when user clicks browser buttons quickly some of the elements of the page might be trying to modify url, this might happen during scroll event etc. This will be the case with Features page which needs to moodify url as the page is being scrolled. This might happen as user scrolls the page or scroll event is triggered because elements in the page change size.
	Features page loads panels via ajax and when panels are loaded the page scroll will be triggered as there is different  number of panels and panels are of differnet sizes.
	The other case is when features page url points to particular panel and so when page open it needs to scroll somewhere down the page. So the url of fewatures page is ansarada.com/features, url pointing to particular panel is in a form of ansarada.com/features/somefeaturepanelname, this should scroll page to this particular panel and so scroll event will be triggered and url will be modified inside of scroll handler.
	Now, when someone clicks back/forward button in a browser, this by default browser behaviour changes url in browser. Then it triggers ajax loading of some page and in goto() method requests whatever page is in next/prev in history. This will be ajax call to request this page and JS execution ends.
	Then scroll event might be executed as this might be next in the queue waiting. This scroll even will attempt to  modify url of the page that might be some panel in featues page e.g. ansarada.com/features/featurename BUT other page is not loaded yet. So scroll event willmodify url and finish. Then ajax page we requested might load and user will end up withurl not matching what is displayed on a screen. This will open possibility to many other hard to find bugs related to how the url is read by the code.
	This is the reason for a flag below. mSimply places where the url is being modified need to check this flag to see if url can be modified or not.
	*/

	var lockURL=false;

	//mobile=true;

	var clickedMenuItem=null;

	// init method, needs to run when framework is ready

	function init() {

//		if (window.attachEvent && !window.addEventListener) {
	//		ie8 = true;
		//}

		$header=$("header");

		// set flag when ajax pages loading is available in browser

		if (typeof history.pushState !== "undefined" && !mobile && !safariWin)
			 ajaxLoading=true;

		// uncomment line below to make wordpress always reload the whole page rather than only main part via ajax
		//ajaxLoading=false

		// check for support before we move ahead

		ajaxLoading = false;  // HACK: remove ajax loading from all the things
		
		if(ajaxLoading) {

			// before anything we need to store current menu item name in history object so when user navigates via browser buttons the menu itmes will update accordingly

			//history.replaceState({"menuItemURL":$(".mainNav.lava .current_page_item").text()}, null, document.location);
			history.replaceState({"menuItemURL":$(".mainNav.lava .current_page_item a").attr("href")}, null, document.location);
			var historyCount = 0;

			// THIS IS DELEGATED EVENT AND TAKES CARE OF LOCAL LINKS LOADED VIA AJAX BUT IT BUBBLES ALL THE WAY TO BODY AND NEEDS TO BE WATCHED CAREFULLY TO MAKE SURE IT WONT CAUSE PERFORMANCE PROBLEMS. IF SO THEN NEEDS TO BE REVERED SO PAGES LOADED VIA AJAX CALLS WILL RELOAD WHOLE PAGE AS BELOW
			//$('a[href*="'+tempURL+'"]').on('click',function(e){

			var lastClicked=document.location.href,doubleClick=false;

			$('body').on('click.framework','a[href*="'+tempURL+'"]',function(e){


			if($(this).attr("target")=="_blank")
			{
				open($(this).attr("href"),"_blank")

				e.preventDefault();
				return false;
			}


				//$(window).off("scroll.features");

				// lock url till the page is loaded and diplayed
				lockURL=true;

				//set timer to avoid users clicking very, very fast in between items

				setTimeout(function() { doubleClick=false; }, 700);


				if($(this).parent().hasClass("current_page_item") || ($(this).parent().hasClass("contactIcon") && $(this).parent().hasClass("current-menu-item")) && $(this).parents('header').length)
				{
					$("html,body").animate({ scrollTop: 0 }, 300);
					e.preventDefault();
					return false;
				}


				// check if the sme item is clicked or if its doubleclick and if so ignore

				if($(this).attr('href')===lastClicked || doubleClick) {
					doubleClick=false;
					e.preventDefault();
					return;
				}



				doubleClick=true;

				// when user clicks menu item and we using ajax to grab another page then we need to remove all the iframes from the page as otherwise iframes also will be added to history and when user will click browsers back button the previous page will show be displayed in history twice. If there are two iframes in a page this will be 3 times, if 3 iframes then 4 times and so on. Extremely weird behaviour. THats why iframes need to be removed before navigating anywhere else
				// this is simple remove however nicer method might be implemented later like replacing with sized box so there will be no visible jump in a page when remove happen

				$("iframe").remove();

				lastClicked=$(this).attr('href');

				$('iframe').removeAttr('src');

				// we requesting new page here so cancel previous requests if any in progress
				if(currentAJAXRequest) currentAJAXRequest.abort();

				var href = $(this).attr('href');

				//clickedMenuItem=getLiFromName($(this).text());
				clickedMenuItem=getAnchorFromURL(href);

				goTo(href,$(this).text());

				history.pushState({"menuItemURL":href}, null, href);

				ansarada.frog.highlight(clickedMenuItem.parent());

				// also highlight footer items selected
				
				$("footer .current_page_item").removeClass("current_page_item");
				getFooterLiFromURL(href).addClass("current_page_item");
				
				e.preventDefault();
			});

			window.onpopstate = function(e){

				if(e.state!=null)
				{
					lockURL=true;

					$("iframe").remove();

					if(currentAJAXRequest) currentAJAXRequest.abort();

					//$(window).off("scroll.features");
					goTo(document.location,e.state.menuItemURL);

					//clickedMenuItem=getLiFromName(e.state.menuItemURL);
					clickedMenuItem=getAnchorFromURL(e.state.menuItemURL);
					
					ansarada.frog.highlight(clickedMenuItem.parent());

					// also highlight footer items selected
					
					$("footer .current_page_item").removeClass("current_page_item");
					getFooterLiFromURL(e.state.menuItemURL).addClass("current_page_item");
					
					lastClicked=document.location.href;
				}
			};
		}

		// proximity plugin

		if (!ansarada.framework.isIE8()) {
			$header.find("> .content > nav > .homeButton").css({ opacity: 0.55 });
			
			$header.find("> .content > nav > ul > li").css({ opacity: 0.55 });

			if(!mobile)
			{
				$header.find("> .content > nav > ul > li").approach({
						  "opacity": "0.85"
				}, 200);
				
				// this below throws errors with ipad so should be wrapped into mobile check
				
				$header.find("> .content > nav > .homeButton").approach({
						  "opacity": "0.85"
				}, 200);
			}
		}

		$header.find("> .content > nav > ul > li").on("click", function(e){
		//	$(this).find("a")[0].click();
		});

		// if its not homepage display home arrow
		
		if(isHomepage()) 
			$(".homeButton").fadeOut(300);
		
		
		// green bar we need to animate initially when page is open. It needs however to wait till everything is loaded in as to potition itself under specific menu item it needs to know the size and position of the imtem on the screen. As this menu items are using custom font these will not be displayed till the font is downloaded and ready. If we grab positions before this happens it will be probably wrong. Still to make sure we use further delay of 1s. This has to be tested to make sure it consistently works

		$(window).on("load",function() {
			setTimeout(function() {
				ansarada.frog.init();
				//ansarada.frog.highlight($(".mainNav.lava .current_page_item"));
				ansarada.frog.fadeIn();

			},1000);
		});

		// if there are any videos, for mobile we need to provide different functionality so run the plugin that will take care of videos on pages like advisors, features and all the rest
		// each of these pages where the videos sit need to have wistia ifrmae script downloaded in html template from  wistia website. This will be used to manipulate videos from JS and change volume of video, pause video etc.
		// This call below should take care of videos in pages like advisors, about us etc. in features page however where the videos are downloaded via ajax calls this needs to be tkaen care of separately e.g. in features module when all the videos are loaded so features page has the script run from JS rather than placed in html template

		if(mobile)
		{
			$("body").addClass("mobile");

			//$(".video,.introVideo").coverVideos();

			$(".getAquote").insertBefore("footer");

		}

		// this is functional not in use however currently as we decided to remove animated banner as it was laggy
		// it is used with certain templates but these are not assigned to pages in wordress
		// uncomment to use

		if(!ie8 && !safariWin && !mobile)
		{
			try
			{
				$("#animatedBanner")
				.animatedBanner().find("> .slide")
				.css("background-image","none");
			}
			catch(ex){}
		}

		// for mobile devices we using native dropdown, for desktops our fancy plugin

		if(mobile)
		{
			$("#countryQuotePluginSelect").hide();
			$(".getAquote").css("position","static");

			$("#countryQuoteNativeSelect").on("change",function(e) {

				$("#countryQuote").val($(this).find(":selected").val());

			});

		}
		else
		{
			$("#countryQuoteNativeSelect").hide();

			// for other devices open dropdown and let select only

			$(".getAquote .selectEditable").multiDropDown( { multiSelect: false, editable: false, onSelect: function() {

				$(".selectEditable").removeClass("invalid");
				$("#countryQuote").val($(this).data("selected-option"));

			} });
		}

		$("input[type=tel]").on("keydown",function(event) {
        // Allow: backspace, delete, tab, escape, enter and .
        if ( $.inArray(event.keyCode,[46,8,9,27,13,190]) !== -1 ||
             // Allow: Ctrl+A
            (event.keyCode == 65 && event.ctrlKey === true) || 
             // Allow: home, end, left, right
            (event.keyCode >= 35 && event.keyCode <= 39) ||
            (event.shiftKey && event.keyCode ==48) ||
            (event.shiftKey && event.keyCode ==57) ||
            (event.keyCode ==32))
			{
                 // let it happen, don't do anything
                 return;
        }
        else {
            // Ensure that it is a number and stop the keypress
            if (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105 )) {
                event.preventDefault(); 
            }   
        }
    });


		// attach quote to the bottom of the screen

		$(".getAquoteButton").on("click",function(e) {

			// unfold get a quote panel

			$(".getAquote").hasClass("active") ? $(".getAquote").removeClass("active") : $(".getAquote").addClass("active");
		});

		// attach validation to getquote form. This might be different from contact us page hence here in separrate code

		$(".getAquote form input,.getAquote form textarea").on("keypress",function(e) {

			if($(this).val()=="") $(this).removeClass("invalid");

		});

		$(".getAquote form input,.getAquote form textarea").on("keydown",function(e) {
			if($(this).val()==$(this).data("error")) $(this).val("");

		});

		// very basic validation for now

		$(".getAquote form input[type=submit]").on("click",function() {

			if(sending) return;

			var sending=true;
			var invalid=false;


			$(".getAquote input:not(':hidden'), .getAquote  textarea").each(function() {

				if(!$(this).parent().hasClass("inputField"))
				{
					if($(this).val()=="" || $(this).val()==$(this).data("error"))
					{
						if(!invalid) this.focus();
						invalid=true;
						$(this).addClass("invalid");
						$(this).val($(this).data("error"));
					}
					else
					{
						$(this).removeClass("invalid");
					}
				}

				// now if its our custom dropdown set invalid flag on one of outside containers
				else
				{
					if($(this).val()=="")
					{
						invalid=true;
						$(this).parents(".selectEditable").addClass("invalid");
					}
					else
					{
						$(this).parents(".selectEditable").removeClass("invalid");
					}
				}
			});

			// validate email
			
			if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($("#emailQuote").val()))
			{
				invalid=true;
				$("#emailQuote").addClass("invalid");
				$("#emailQuote").val($("#emailQuote").data("error"));
			}
			
			// validate phone
			
			if(!/^(\d|\s|[)(])*$/.test($("#phoneQuote").val()))
			{
				invalid=true;
				$("#phoneQuote").addClass("invalid");
				$("#phoneQuote").val($("#phoneQuote").data("error"));
			}
						
			if(invalid)
				return false;

				
			return true;
			// sshow busy ndicator, ake reqquest andso on

			$(".getAquote .submitbtn").fadeOut(300, function(e) {

				$(".getAquote .busy").fadeIn(300);

			});

			$(".getAquote .closebtn").fadeOut(300);

			currentAJAXRequest=$.ajax({
				type: "post",
				url: tempURL+"/contact",
				data: $('.getAquote form').serialize(), // success callback might be moved to "done"
			}).done(function(data, textStatus, jqXHR) {
					// when request comes back we need to inject new content into a page

					if(data=="0")
						alert("OKAY - DONE!\n\nYour interest is much appreciated.\n\nAt ansarada, we are only successful if you're successful, so we are keen to discuss with you how we can best help you and your transactions needs. A member of our friendly team will contact you shortly.");
					else
						alert("Ooops.. something went wrong. Please try again.");

			}).always(function(e) {

				$(".getAquote .busy").fadeOut(300, function(e) {

					$(".getAquote .submitbtn,.getAquote .closebtn").fadeIn(300);
					$('.getAquote form')[0].reset();
				});
			});

			return false;
		});


		$(".getAquote .closebtn").on("click",function(e){

			$(".getAquote form")[0].reset();
			
			$(".getAquote form input").removeClass("invalid");
			$(".getAquote form textarea").removeClass("invalid");
			
			e.preventDefault();
			return false;
		});



		// load script from wistia website as this is needed for wistiaApi to be accessible from JS

		//$.getScript("//fast.wistia.net/static/iframe-api-v1.js",function(e){});
	}

	function getLiFromName(anchorText)
	{
		return $(".lava").find("li").filter(function() {
			return $(this).text() == anchorText;
		});
	}

	function getAnchorFromURL(url)
	{
		return $(".lava").find("li a").filter(function() {
			return $(this).attr("href") == url;
		});
	}

	function getFooterLiFromURL(url)
	{
		return $("footer").find("li a").filter(function() {
			return $(this).attr("href") == url;
		}).parent();
	}

	// load main part of pages via ajax rather then the whole thing every time. Function takes URL as parameter as well as text of the menu that user clicked. This is used to check when for example link to page "advisors" is clicked from somewhere else rather than main menu. If thats the case we still need to move frog (green bar in main menu) to the menu item of the page that will be displayed.

	var currentAJAXRequest=false;

	function goTo(href,anchorText) {

		$('.main').fadeTo('fast', 0.5);

		currentAJAXRequest=$.ajax({
			url: href,
			data: {"ajax":ajaxLoading}, // success callback might be moved to "done"
		}).done(function(data, textStatus, jqXHR) {
				// when request comes back we need to inject new content into a page

				$('.main').fadeOut('fast', function(){

					$(this).html(data);

					$(this).fadeTo('fast',1, function() {

						// this happens when the page is loaded via ajax only so it dosent happen when the page is initially load full

						// now the new content of the page is faded in and if there is anything that we need to init not specific to any particular page so something that can be reused on various pages e.g. animated banner, video plugin for mobile etc. this should be checked for existence here and initialised
						// something that will not be reused between pages e.g. features page functionality wehre panels are loaded via ajax need their own init method

						// also if there are any animated banners then init these

						// this is functional not in use however currently as we decided to remove animated banner as it was laggy
						// it is used with certain templates but these are not assigned to pages in wordress

						try
						{
							if(!safariWin)
							{
								$("#animatedBanner")
								.animatedBanner().find("> .slide")
								.css("background-image","none");
							}
						}
						catch(ex){}

						// if there are any videos for mobile we need to provide different functionality so run the plugin that will take care of videos on pages like advisors etc.
						// each of these pages where the videos sit need to have wistia ifrmae script downloaded in html template from  wistia website
						// THis should take care of videos in pages like advisors, about us etc. in features page however where the videos are downloaded via ajax calls this needs to be tkaen care of separately e.g. in features module when all the videos are loaded so features page has the script run from JS rather than placed in html template

					//	if(mobile)
					//		$(".video,.introVideo").coverVideos();

						//wistiaBindIframes();
//	$.getScript("//fast.wistia.net/static/iframe-api-v1.js",function(e){});

						// update the page title

						var title = $('.main').find('h1').text();

						$('head').find('title').text(title);

						// page loaded so mark it in google analytics
						// object or not get string out of it
						var hrefStr=href.toString();
						// "_trackEvent" is the pageview event,
						_gaq.push(['_trackPageview', '/'+hrefStr.replace(tempURL+"/","")]);

						lockURL=false;
										
						if(isHomepage()) 
							$(".homeButton").fadeOut(300);
						else
							$(".homeButton").fadeIn(300);

					});

				});

				//pageTracker._trackPageview('/\');

				// also inform other interested modules that page change happened. E.g. module features needs to listen to it so it will unattach window.scroll event when this happens. Scrolling on features page has specific functionality that will not work and possibly cause trouble on other pages so module needs to know when other page is loaded and needs to reset some values, maybe some objects, or as in this case remove listener for scroll event

				$(document).trigger("pageChanged");

				//setTimeout(function() {lockURL=false},700);

			}).fail(function(jqXHR, textStatus, errorThrown){
				$(".main").html(jqXHR.responseText);
				$('.main').fadeTo('fast',1);

				//alert("fail");
			});
	}

	// do it only for desktops not for mobiles

	if(!mobile)
	{
		// ie chokes on addEvent listener so do check here, its for ipad only anyway so no alternate code for ie

		var currentScrollY=$(document).scrollTop();

		if(document.addEventListener)
		{
			var currentY=0;
			var startY=0;
			var clickedElement=null;
			var dragging=false;
			var scrollAmount=0;

			document.addEventListener('touchstart', function(e) {


				clickedElement=document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);

				dragging=true;
				startY=e.touches[0].clientY;

			}, false);

			document.addEventListener('touchend', function(e) {

				dragging=false;
				startY=0;
				currentY=0;
				scrollAmount=0;

			}, false);


			document.addEventListener('touchmove', function(e) {

				e.preventDefault();

				if(dragging)
				{
					currentY=e.touches[0].clientY;

					scrollAmount=currentY-startY;
					currentScrollY=currentScrollY-scrollAmount;

					startY=e.touches[0].clientY;

					$(document).scrollTop(currentScrollY);
				}

			}, false);
		}

		var fixed=false;

		$(window).scroll(function(e)
		{
			//adjust sticky bar
			currentScrollY=$(document).scrollTop();
			adjustStickyBar();
		});

		$(window).resize(function(e)
		{
			// there is number of things we need to take care off when user scrolls the window

			//adjust sticky bar

			adjustStickyBar();
			
			if($(window).width()>1058 && $(window).scrollTop()>104)
				showHomeButton();
			else
				hideHomeButton();
		});
	}

	function adjustStickyBar()
	{
		// e.g unfolding panels, main navigation and scroll bar must behave differently and must be sticky to the top of the screen

		// check if nav is getting out of visible area. it means it should be sticky

		if(!fixed && $(window).scrollTop()>104)
		{
			$header.addClass("fixed");
			fixed=true;
			$header.css({"left":-$(window).scrollLeft()+"px", "width": document.body.clientWidth+$(window).scrollLeft()+"px"});
			
			// if width of the window is more then 1000 then show home button
			
			if($(window).width()>1000)
				showHomeButton();
			else
				hideHomeButton();
				
		}
		else if(fixed && $(window).scrollTop()<104)
		{
			$header.removeClass("fixed");
			fixed=false;
			$header.css({"left":"auto", "width":"100%"});
			hideHomeButton();
		}
		// check if fixed as user might be scrolling horizontally and header should be moving right/left
		else if(fixed && $(window).scrollTop()>104)
		{
			// track horizontal scrolling
			// also set width to something large enough soo the header will cover whole width of the window
			$header.css({"left":-$(window).scrollLeft()+"px", "width": document.body.clientWidth+$(window).scrollLeft()+"px"});
		}
	}

	function showHomeButton()
	{
		$(".homeButton").fadeIn(300);
	}
	
	function hideHomeButton()
	{
		$(".homeButton").fadeOut(300);
	}
	
	function getAjaxLoading()
	{
		return ajaxLoading;
	}

	function isIE8()
	{
		return ie8;
	}

	function isIE9()
	{
		return ie9;
	}

	function isIE10()
	{
		return ie10;
	}

	function isSafariWin()
	{
		return safariWin;
	}

	function isMobile()
	{
		return mobile;
	}

	function isUrlLocked()
	{
		return lockURL;
	}

	function isHomepage()
	{
		var normalisedLocation=null;
		
		location.href.substr(-1)=="/" ? normalisedLocation=location.href.slice(0,location.href.length-1) : normalisedLocation=location.href;
		
		return normalisedLocation==tempURL;
	}

	return {
		getAjaxLoading 	: 	getAjaxLoading, // specifies if ajax loading of pages is available
		isIE8			: 	isIE8,
		isIE9			: 	isIE9,
		isIE10			: 	isIE10,
		isHomepage		: isHomepage,
		isSafariWin		: 	isSafariWin,
		isMobile			: 	isMobile,
		init			:	init,
		isUrlLocked		:	isUrlLocked
	};
})(jQuery);



// this plugin provides functonality onlyfor mobile devices. THe problem is as we control window scrolling and disable native mobile scrolling. THis however is not working on mobiles as mobiles will still detect video touch and grab and will use native scrolling rather than our own scrolling callback. So for mobiles we need to cover video with another transparent div and this will disable native mobile scrolling as video in fact will never be cicked. It will also completely disable video functionality  on mobile unfortunately so on click of the cover we will need to resize video behind it to full screen and let user play it from there

(function($)
{
	$.fn.coverVideos=function(options,extra) {


		this.each(function()
		{
			var $iframe=$(this).find(".wistia_embed");

			if(!$iframe.length) return;

			// remove covering image as mobile opens videos in new window anyway

			//$(".videoPlay").remove();

			//alert("aaa");
			// wrap iframe into container and append a cover aftrer iframe

			$iframe.wrap('<div class="mobileVideoContainer"></div>');
			var $mobileVideoContainer=$(this).find(".mobileVideoContainer");

			//$iframe.before('<a class="ipadVideoClose">Close</a>');
			$mobileVideoContainer.append('<div class="mobileVideoCover"></div>');

			var $mobileVideoCover=$(this).find(".mobileVideoCover");
			//var $ipadVideoClose=$(this).find(".ipadVideoClose");


			function videoClickHandler() {

				// now we need to get access to api of the video so we can pause it when popup close. to get it we need to look up the value of the id that is inside of embed code that we got generated from wistia api. This code contains piece of javascript which attaches api to variable. We could possibly graab and eval() this piece of code or even better look it up via regular expression, grab id of the video from it and run JS code in here quickly
				//we looking for something inside of second script tag. That usually has a format
				// wistiaEmbed = Wistia.embed("ankia12npz")
				// and we are interested in getting id inside of quotation marks. regex below will get it for us and return array where [1] will contain id we looking for
				var patt1=new RegExp('wistiaEmbed = Wistia.embed\\(\\"(\\w*)\\"\\)')

				// now we grab content of this second script tag which should contain JS code we will run against our pattern and run our regex against it

				var res=patt1.exec($mobileVideoContainer.next().next().text());

				//alert(res[1]);
				// now we have id in [1] we can run JS code and grab api access

				window.open("http://fast.wistia.net/embed/iframe/"+res[1]+"/");
				return;

			};


			// get direct access to qistiaapi. As this plugin might be executed via ajax call by this time the file from wistia website might not be downloaded yet so before calling wistiaApi later (e.g. pause() etc) we will need to double check later if the wistiaApi is attached to iframe elements

			var wistiaEmbed;

			if($(this).hasClass("introVideo"))
				$(".videoPlay,.playButton").on("click",videoClickHandler);
			else
				$mobileVideoCover.on("click",videoClickHandler);


			// NOT NEEDED AS VIDEOS OPEN IN NEW WINDOWN NOW


		});

		return this;
	}
})(jQuery);


// plugin for animaed panel. On certain pages this might include video as first panel hence we need to take care of wistia iframe api. This is used to manipulate sound volume as user scrolls

(function($)
{
	$.fn.animatedBanner=function(options,extra) {

		if(!this.length)
			throw { message:"No animated banner found"};

		// we need to know when we dealing with ipad so we can take care of its weird behaviour comparing to desktop browsers
		// I'm not a fan of user agent sniffing but in this case it should do

		var mobile = ansarada.framework.isMobile();

		// here we can provide additional options for plugin if necessarylike position of text etc
		// default settings

		var settings = $.extend( {
			'textTop': 40,
			'textLeft': 0,
			'textwidth': 200
		}, options);

		// initialise stuff

		var $t=this;

		//videoPanelIframe.width(4000);

		// height of top bar with navigation. this is needed as slider needs to move up as the screen is initially scrolled untill the header becomes sticky

		var topNavHeight=36;

		var allSlides=$t.find(">.slide");
		//var allSlides=$t.find(">.slide:not(:first-child)");
		var allTextBoxes=allSlides.find("> .content > .textBox");

		var windowHeight=$(window).height();
		var windowWidth=($(window).width()<960 ? 960 : $(window).width());

		var middleX=windowWidth/2;
		var middleY=windowHeight/2;

		// on different pages first panel/slide might contain video and if so there will not be any svg mask on it so we need to make adjustments so the code later will not try to refer to mask that dosent exissts. THis flag specifies if the panel without mask is the first one or not. 1 means yes, 0 means no
		// this asumes that if video exists it is always as first panel

		var isVideoFirst=0;

		// when video ifrmae is loaded get reference to it so later we can manipulate video here from plugin

		//var wistiaEmbed;

		// flag indicating if video was paused specifically by scrolling rather then by clicking pause. This is so when user scrolls down the page and sound fades out when sound is 0 and video probably is not visible anymore on the screen then we might as well pause the video. From there when user scrolls up back to the video we need to start playing from the same point

		var pausedBySlider=false;

		var $videoPanel=$t.find(">.slide.introVideo:first-child");
		var videoPanelIframe=$videoPanel.find(".wistia_embed");

		//wistiaEmbed = Wistia.embed("5404sm6jxt");

		$(".panel.slide.introVideo .wistia_embed").ready(function(){

			// not sure why this callback is executed even if .wistia_embed dosent exist in html so we need to check for its existence

			if(typeof wistiaEmbed==="undefined") return;

			//wistiaEmbed = this.wistiaApi;

			if($t.find(">.slide.introVideo:first-child").length)
			{
				isVideoFirst=1;
				$videoPanel=$t.find(">.slide.introVideo:first-child");
				videoPanelIframe=$videoPanel.find(".wistia_embed");
			}

			updateVideoIframe();

			// also listen to events from player when its stopped we need to remove the message from top of it, when stopped we need to fade it in again

			wistiaEmbed.bind("play", function() {
			  $(allTextBoxes[0]).fadeOut(300);
			  $(".playButton").fadeOut(300);
			});

			wistiaEmbed.bind("pause", function() {
			  $(allTextBoxes[0]).fadeIn(300);
				$(".playButton").fadeIn(300);
			});

			wistiaEmbed.bind("end", function() {
			  $(allTextBoxes[0]).fadeIn(300);
			  $(".videoPlay").fadeIn(700);
			  $(".playButton").fadeIn(700);
			});

			$(".playButton").on("click",function(e) {
				wistiaEmbed.play();

				$(allTextBoxes[0]).fadeOut(700);
				$(".videoPlay").fadeOut(300);
				$(this).fadeOut(300);
				$("body,html").animate({scrollTop:103},300);


			});

			$('.wistia_embed').on("click", "video", function(e) {
				wistiaEmbed.pause();
				e.preventDefault();
				return false;
			});
		})

		function updateVideoIframe()
		{
			videoPanelIframe.height("100%");
			//videoPanelIframe.width("100%");
			//return;

			var originalVideoHeight=360;
			var originalVideoWidth=640;
			var prop=(windowHeight-topNavHeight)/originalVideoHeight;

			videoPanelIframe.width(originalVideoWidth*prop);
			videoPanelIframe.css({"left":-(originalVideoWidth*prop)/2+middleX+"px",
			//videoPanelIframe.css({"left":-(originalVideoWidth*prop)/2+($(window).width()/2)+"px",
			"position":"absolute"});

		}

		// used to keep track of previous slide so we know when we scrolling back

		var previousSlide=0;

		// set animated banner height to total of all panels
		// this is added so the scrollbar will be shown and user will be able to scroll it up down and moving animation back and forth
		// total height of all the slides stack on top of each other. We need to know it now so we can create outside container that will force correct size slidebar in a window. This slides we will flatten later so these will overlap each other and so that is the time to get the height of all slides

		allSlides.height(windowHeight-topNavHeight);

		// set textboxes position under the slide so these will slide in from bottom

		var dist=windowHeight-settings.textTop;

		allTextBoxes.css({
			"top":windowHeight+"px",
			"left":settings.textLeft+"px",
			"width":settings.textWidth+"px"
		});

		// wrap all slides into container with the height we just calculated

		//$t.wrap('<div></div>');


		var $p=$t.parent();

		// this we will reuse later so might as well grab values and sotre in variables

		var pHeight=$p.height();
		var allSlidesLength=allSlides.length;

		var realParentTop=windowHeight-$p.position().top;

		// resize and reposition all the images that we will animate in. THis has to be done so no matter what the size of the window is images will show full height

		$t.find(".slide").height(windowHeight-topNavHeight);

		// now we have the height of the animated panel and we know how long the scrollbar shoould be we need to make all the panels overlap

		// position all svg elements

		allSlides.find("svg")
			.attr("width", windowWidth)
			.attr("height", windowHeight-topNavHeight);

		allSlides.find("svg mask")
			.attr("width", "110%")
			.attr("height", "110%");

		allSlides.find("svg image")
			.attr("width", windowWidth)
			.attr("height", windowHeight-topNavHeight);

		allSlides.find("svg image")
			.attr("width", windowWidth)
			.attr("height", windowHeight-topNavHeight);

		// store all the references to circles we will animate in array so later we grab it from array quickly rather then looking via jquery selectors every time

		var animatedCircles=allSlides.find("circle");

		// now hide all slides apart from the very first

		$((allSlides.hide())[0]).show();

		$t.height((windowHeight-topNavHeight)*allSlidesLength);
		$p.height((windowHeight-topNavHeight)*allSlidesLength);

		allSlides.find("svg circle")
		.attr("cx",middleX)
		.attr("cy",middleY)
		.attr("r","100%");

		updateCircle();


		function recalculateSizes()
		{
			// recalculate new positions, resize svg's etc
			windowHeight=$(window).height();
			windowWidth=($(window).width()<960 ? 960 : $(window).width());

			middleX=windowWidth/2;
			middleY=windowHeight/2;

			//allSlides.css({"position":"static"});
			allSlides.height(windowHeight-topNavHeight);
			$t.height((windowHeight-topNavHeight)*allSlidesLength);
			$p.height((windowHeight-topNavHeight)*allSlidesLength);

			pHeight=$p.height();
			allSlidesLength=allSlides.length;

			realParentTop=windowHeight-$p.position().top;

			// resize and reposition all the images that we will animate in. THis has to be done so no matter what the size of the window is images will show full height

			$t.find(".slide").height(windowHeight-topNavHeight);

/*			allSlides.find("svg")
				.attr("width", windowWidth)
				.attr("height", windowHeight-topNavHeight);
*/
		allSlides.find("svg")
				.attr("width", windowWidth)
				.attr("height", windowHeight-topNavHeight);

			allSlides.find("svg mask")
				.attr("width", "140%")
				.attr("height", "140%");

			allSlides.find("svg image")
				.attr("width", windowWidth)
				.attr("height", windowHeight-topNavHeight);

			allSlides.find("svg circle")
			.attr("cx",middleX)
			.attr("cy",middleY);

			dist=windowHeight-settings.textTop;

			allTextBoxes.css({
				//"top":windowHeight+"px",
				"left":settings.textLeft+"px",
				"width":settings.textWidth+"px"
			});

			// also take care of positioning animatedbanner container as user moves horizintal scrollbar right/left

			if($t.hasClass("fixed"))
				allSlides.css({"left":-$(window).scrollLeft()+"px", "width": document.body.clientWidth+$(window).scrollLeft()+"px"});
			else
				allSlides.css({"left":"0px", "width": "100%"});
		}

		window.onorientationchange =  function () {

			recalculateSizes();
			if(isVideoFirst) updateVideoIframe();

			updateCircle(e);
		}


		$(window).on("resize.animatedBanner",function(e) {

			if(mobile) return;

			recalculateSizes();
			if(isVideoFirst) updateVideoIframe();
			updateCircle(e);

		});

		var lastScrollY=0;
		var isScrolling=false;
			var cur;

		$(window).on("scroll.animatedBanner",function(e)
		{
			updateCircle(e);
		});


		if(!ansarada.framework.isIE10() && !ansarada.framework.isIE9())
		{
			$('#animatedBanner').on('wheel.animatedBanner', function(e){
				e.preventDefault();
				if($("html").is(":animated")) return;

				if(e.originalEvent.deltaY < 0) {
				  // up
					$("html").animate({scrollTop:(currentSlide-1)*$(".slide").height()},1700);
				}
				else
				{
					//down
					// check if current slide is fully open


					if(window.scrollY<=103 && isVideoFirst)
					{
						$("html").animate({scrollTop:$(".slide").height()},1700);

					}
					else if(currentSlide*$(".slide").height()==window.scrollY)
					{
						// slide is not fully open so finish opening current slide
						$("html").animate({scrollTop:(currentSlide+1)*$(".slide").height()},1700);

					}
					else
					{
						// fully open so go to next
						$("html").animate({scrollTop:currentSlide*$(".slide").height()},1700);
					}


				}
			});

			$('#animatedBanner').on('mousewheel.animatedBanner', function(e){

				e.preventDefault();
				if($("body").is(":animated")) return;

				if(e.originalEvent.wheelDelta /120 > 0) {
				  // up
					$("body").animate({scrollTop:(currentSlide-1)*$(".slide").height()},1700);
				}
				else
				{
					//down
					// check if current slide is fully open or the video is playng so there scrollis up tostickyheader position

					if(window.scrollY<=103 && isVideoFirst)
					{
						$("body").animate({scrollTop:$(".slide").height()},1700);

					}
					else if(currentSlide*$(".slide").height()==window.scrollY)
					{
						// slide is not fully open so finish opening current slide
						$("body").animate({scrollTop:(currentSlide+1)*$(".slide").height()},1700);

					}
					else
					{
						// fully open so go to next
						$("body").animate({scrollTop:currentSlide*$(".slide").height()},1700);
					}


				}
			});
		}


		// listen to pageChanged custom event as when page is changed e.g. to analysts, we need to remove scroll and resize callback we attached as this is not needed on other pages. Otherwise when other pages load it will still be called when user scrolls or resizes the window causing havoc

		$(document).one("pageChanged",function() {

			$(window).off("scroll.animatedBanner");
			$(window).off("resize.animatedBanner");
			$(window).off("mousewheel.animatedBanner");
			$(window).off("wheel.animatedBanner");

		});

		var currentSlide, currentSlidePosition;

		function updateCircle(e)
		{
			// NOTE: with current implementation scriolling circles banner needs to be at the top of the window as top panel and not in between oteh not animated panels. Thats the requirement and as this has to be content managed no reason to cater for other locations for now

			var windowScrollTop=$(window).scrollTop();

			// figure out which panel should be playing at this point in scroll
			// this is approximation of scroll position, should do for now but has to be tested

			var currentScrollPosition=windowScrollTop+realParentTop;

			if(currentScrollPosition<=0) return;

			var csp=currentScrollPosition/pHeight*allSlidesLength;
			var mfCSP=Math.floor(csp);

			// avoid half finished circles

			if(mfCSP>currentSlide)
			{
				$(animatedCircles[currentSlide])
					.attr("r","100%");

				$(allTextBoxes[currentSlide]).css("top",windowHeight-dist);
			}

			currentSlide=mfCSP;
			currentSlidePosition="0."+((csp).toString().split(".")[1]);

			$(allSlides.slice(0,currentSlide)).show();

			// there is number of things we need to take care off when user scrolls the window

			if(windowScrollTop>104 && currentScrollPosition<pHeight)
			{
				$t.addClass("fixed").css({
					"top": topNavHeight
				});
			}
			else
			{
				$t.removeClass("fixed").css({
					"top":-windowScrollTop+140
				});

			//	if(!isVideoFirst) $(allSlides[1]).hide();
			}
			// check if we scrolling backward. quick and dirty for now as we got onloy few elements

			// #################### FROM HERE
			if(previousSlide>currentSlide && currentSlide>0)	allSlides.slice(currentSlide).hide();

			previousSlide=currentSlide;

			// show current slide

			$(allSlides[currentSlide]).show();

			//######################to here

			// if you ever need to calculate exactly when the circle inner rectangle use var r=Math.sqrt(2)*r;
			// also in here we checking if the first slide is video and if so changing currentSlide-1

			if(!isNaN(currentSlidePosition))
				$(animatedCircles[currentSlide-(isVideoFirst ? 1 : 0)])
				.attr("r",(currentSlidePosition*100)+"%") // adjust this value to control speed of circle opening

			/*	var	middleX=windowWidth/2;
				var middleY=windowHeight/2;

				var cs=$(allSlides[currentSlide]);
				var a=cs.find("circle");;

			cs.css("width", (currentSlidePosition*100)+"%")
					.css("height", (currentSlidePosition*100)+"%")
					.css("left", middleX-cs.width()/2)
					.css("top", middleY-cs.height()/2);



			a.attr("r", (cs.width()))
				.attr("cx", (cs.width()/2))
				.attr("cy", (cs.height()/2));

				*/



			// manipulate video volume as user scrolls

			if(isVideoFirst)
			{
				if(typeof wistiaEmbed==="undefined")
				{
				//wistiaBindIframes();
					//wistiaEmbed = $(".panel.slide.introVideo:first-child .wistia_embed")[0].wistiaApi;
					/*wistiaEmbed.bind("end", function() {
					alert("The video ended!");
					});
					wistiaEmbed.time(30).play();*/
					//wistiaEmbed.width(500);

					if($t.find(">.slide.introVideo:first-child").length)
					{
						isVideoFirst=1;
						$videoPanel=$t.find(">.slide.introVideo:first-child");
						videoPanelIframe=$videoPanel.find(".wistia_embed");
					}
				}

				if(typeof wistiaEmbed!=="undefined" && currentSlide!=0)
				{
					if(currentSlide==0)
						wistiaEmbed.volume(1);
					else if(currentSlide==1)
					{
						wistiaEmbed.volume(1-currentSlidePosition);
						if(pausedBySlider)
							wistiaEmbed.play();
						pausedBySlider=false;
					}
					else
					{
						wistiaEmbed.volume(0);
						if(wistiaEmbed.state()=="playing")
						{
							wistiaEmbed.pause();
							pausedBySlider=true;
						}
					}
				}
			}

			// as user scrolls the window slide in text
			// quick and dirty adjustment to pause textboxes when circles opening
			//$(allTextBoxes[currentSlide]).css("top",windowHeight*1.8-dist*1.8*((currentSlidePosition*1+0.8>1 ? 1 :currentSlidePosition*1+0.8)));


			$(allTextBoxes[currentSlide]).css("top",windowHeight-dist*((currentSlidePosition*=2.2)>1 ? 1 : currentSlidePosition));


		}

		return this;
	}

})(jQuery);


// features page module

ansarada.features=(function($) {

	// set the name of features page as in url. This needss to be changed in case if the url to features page changes in wordpress
	// so for example if current url is set to
	// http://127.0.0.1/wordpress/features
	// then below is correct. If its changed e.g. to
	// http://127.0.0.1/wordpress/ansarada-awesome-features
	//then set variable below to
	// var featuresPageName="ansarada-awesome-features";
	// this is used in a code below to find links etc for this page

	var featuresPageName="features";

	// IMPORTANT: some values here in the module are simply hardcoded to cater for sizes of header when it becomes sticky and other elements. These might be made more generic later

	// allPanels represents all the panels displayed in features page inlcuding panel aloready loaded as well as the very first panel. So when we do operations later on panels we need to keep this in mind.. Each panel is in fact a separate page

	var allPanels,allPanelsLength;

	// this is used as value of how much the jump should be offset to cater for sticky bar with icons. this has to be modified in scroll callback depending on if bar is sticky or not

	var topBarHeight=0,
		stickyTopBarHeight=130;

		// this is offset to control how much icons list should stick out when its made sticky to the top

		var featureIconsVerticalOffset=25;

	function init()
	{
		$($(".mainNav.lava li")[3]).addClass("current_page_item")
			.on("click.features",function(e) {
				if(!ansarada.framework.isIE10() && !ansarada.framework.isIE9())
				{
					$("html,body").animate({ scrollTop: 0 }, 300,function(e) {

					$("html,body").scroll();
					});


					return false;
				}

			});

		loadedPanels=0,
		allLoaded=false;

		allPanels=$(".panel");
		allPanelsLength=allPanels.length;

		// start plugin for animated icons in the first panel. This will make text under the icon to appear and move  smoothly

		$("#features .icons").itemList();

		// request ajax loading of all feature panels. We want to load everything as soon as possible rather then load on scroll as this is annoying more than anything else
		// we not loading the very first one as this is the top panel of features page with thiree columns and large icons

		// if mobile then dont load panels one by one as this causing issues with videos and there are not displayed at all sometimes in panels loaded via ajax. Thats why when mobile detected, backend  will return and load the whole features page at once with all the panels, for all other devices will be one initial panel and the rest via ajax
		// all google and other search engines will see is only  one initial panel

		if(!ansarada.framework.isMobile())
		{
			for(var i=1;i<allPanelsLength;i++)
			{
				loadFeaturePage($(allPanels[i]));
			}
		}
		else
		{
			allLoaded=true;
			$(window).scrollTop(1);
			//alert($(window).scrollTop());
		}


		//$('#features .panel:not(":first-child")').on('mousewheel.features', function(e){

		// uncomment to make srolling with mouse wheel snap to panels. On mac apparently it scrolls twice so removed for now
		/*
		if(!ansarada.framework.isIE10() && !ansarada.framework.isIE9())
		{

			$('#features .panel').on('wheel.features', function(e){

				if(!allLoaded)
				{
					e.preventDefault();
					return false;
				}

				if($("html").is(":animated")) return;
				var $topPanel=$(getTopPanel());

				var firstPanelHeight=$firstPanel.height()+parseInt($firstPanel.css("padding-bottom"));


				if(e.originalEvent.deltaY < 0) {
				  // up
					if(!$topPanel.prev().prev().prev().length) return;
				e.preventDefault();
					// get top of the panel below the one that is current
					var t=$topPanel.prev().prev().prev().offset().top-featureIconsVerticalOffset;

					t>firstPanelHeight ? topBarHeight=stickyTopBarHeight : topBarHeight=0;

					$("html").animate({ scrollTop: t-topBarHeight }, 300);

				}
				else
				{
					if(!$topPanel.next().length) return;
				e.preventDefault();

					// get top of the panel below the one that is current
					var t=$topPanel.next().offset().top-featureIconsVerticalOffset;

					t>firstPanelHeight ? topBarHeight=stickyTopBarHeight : topBarHeight=0;

					$("html").animate({ scrollTop: t-topBarHeight }, 300);


				}
			});

			$('#features .panel').on('mousewheel.features', function(e){

				if(!allLoaded)
				{
					e.preventDefault();
					return false;
				}

				if($("body").is(":animated")) return;
				var $topPanel=$(getTopPanel());

				var firstPanelHeight=$firstPanel.height()+parseInt($firstPanel.css("padding-bottom"));


				if(e.originalEvent.wheelDelta /120 > 0) {
				  // up
					if(!$topPanel.prev().prev().prev().length) return;
				e.preventDefault();
					// get top of the panel below the one that is current
					var t=$topPanel.prev().prev().prev().offset().top-featureIconsVerticalOffset;

					t>firstPanelHeight ? topBarHeight=stickyTopBarHeight : topBarHeight=0;

					$("body").animate({ scrollTop: t-topBarHeight }, 300);

				}
				else
				{
					if(!$topPanel.next().length) return;
				e.preventDefault();

					// get top of the panel below the one that is current
					var t=$topPanel.next().offset().top-featureIconsVerticalOffset;

					t>firstPanelHeight ? topBarHeight=stickyTopBarHeight : topBarHeight=0;

					$("body").animate({ scrollTop: t-topBarHeight }, 300);


				}
			});
		};
	*/


			$('#features .panel').on('mousewheel.features', function(e){

				if(!allLoaded)
				{
					e.preventDefault();
					return false;
				}
			});

			$('#features .panel').on('wheel.features', function(e){

				if(!allLoaded)
				{
					e.preventDefault();
					return false;
				}
			});

		$("body > .main").on("click.features","[data-scroll-to]",function(e){
			//e.preventDefault();

			var t=$("a[name="+$(this).data("scroll-to")+"]").offset().top-featureIconsVerticalOffset;

			// now we need to know if the bar will be sticky when we already scroll as we need to offset position of the scroll then

			var firstPanelHeight=$firstPanel.height()+parseInt($firstPanel.css("padding-bottom"));

			t>firstPanelHeight ? topBarHeight=stickyTopBarHeight : topBarHeight=0;

			$("html, body").animate({ scrollTop: t-topBarHeight }, 300);

			// color current icon

			$("[data-scroll-to]").removeClass("active");
			$(this).addClass("active");

			e.preventDefault();
			return false;
		});

		
		var fixed=false;
		var $firstPanel=$(allPanels[0]);

		// on scroll do whole bunch of things so check which panel

		$(window).on("scroll.features",function(e)
		{
			if(!allLoaded) return false;

			//if($("body").is(":animated")) return;

			//if (typeof history.pushState === "undefined") return;

			// this is required when user is in features page, scrolls down and url changing to something else for example http://ansarada.com/features/somefeaturename then user navigates to e.g. advisors page or somewhere else. The url will be stored in history object and when later from other pages user navigates back to http://ansarada.com/features/somefeaturename page as stored in history, we need to scroll to panel that matches url in a browser.
			// this scroll even twill be triggered then as the window will be scrolled down obviously

			var $currentTopPanel;
			// do we need to scroll window to panel matching url?

			if($(".panel.panelMatchingURL").length)
			{
				// yes

				$currentTopPanel=$(".panel.panelMatchingURL");
				var url=$currentTopPanel.data("purl");
				$currentTopPanel.removeClass("panelMatchingURL");

				var t=$currentTopPanel.offset().top;

				var firstPanelHeight=$firstPanel.height()+parseInt($firstPanel.css("padding-bottom"));

				t>firstPanelHeight ? topBarHeight=stickyTopBarHeight : topBarHeight=0;

				// check if url can be modified at this point
				if(!ansarada.framework.isUrlLocked())
				{
					$("html, body").scrollTop(t-topBarHeight-featureIconsVerticalOffset);
					if (typeof history.pushState !== "undefined")
						history.replaceState({ "menuItemURL": tempURL+"/"+featuresPageName}, null, url);
				}
			}
			else
			{
				// no

				$currentTopPanel=$(getTopPanel());
				var url=$currentTopPanel.data("purl");

				// check if url can be modified at this point
				if(!ansarada.framework.isUrlLocked())
				{
					if (typeof history.pushState !== "undefined")
						history.replaceState({ "menuItemURL": tempURL+"/"+featuresPageName}, null, url);
				}

				// color current icon. we find it by mattching data-pane-id with data-scroll-to on the icons itself

				$("[data-scroll-to]").removeClass("active");
				$("[data-scroll-to=scrollTo"+$currentTopPanel.data("panel-id")+"]").addClass("active");
			}

			// at this point if its mobile device simply exit

			if(ansarada.framework.isMobile()) return;

			// we also need to make first panel sticky
			// check if nav is getting out of visible area. it means it should be sticky

			var firstPanelHeight=$firstPanel.height()+parseInt($firstPanel.css("padding-bottom"));

			if(!fixed && $(window).scrollTop()>firstPanelHeight-featureIconsVerticalOffset)
			{
				// this is confusing but we need to multiply firstPanelHeight by 2 as when later we add padding to #features it will push first panel down so we need to move it twice up

				$firstPanel.addClass("fixed").css({"margin-top":(-firstPanelHeight*2)+featureIconsVerticalOffset});
				fixed=true;

				// as now the first features panel will be fixed, all the following panels will jump up so we need to add apropriate space at the top of second panel so the panels will not jump

				$("#features").css({"padding-top":firstPanelHeight});
			}
			else if(fixed && $(window).scrollTop()<firstPanelHeight-featureIconsVerticalOffset)
			{
				$firstPanel.removeClass("fixed").css({"margin-top":0});;
				fixed=false;

				// remove the space from the top of second panel

				$("#features").css({"padding-top":0});
			}

		});

		$(".mainBox").on("mouseenter",function(e) {

			if(!ansarada.framework.isIE8())
				$(this).find(".learnMore").fadeIn(300);
			else
				$(this).find(".learnMore").show();

		});

		$(".mainBox").on("mouseleave",function(e) {

			if(!ansarada.framework.isIE8())
				$(this).find(".learnMore").fadeOut(300);
			else
				$(this).find(".learnMore").show();
		});

		// listen to pageChanged custom event as when page is changed e.g. to analysts, we need to reset this module and in this case it means we need to remove scroll callback we attached as this is not needed on other pages

		$(document).one("pageChanged",function() {

			$(window).off("scroll.features");
			$("[data-scroll-to]").off("click.features");
			$("#features .panel").off("mousewheel.features");
			$("#features .panel").off("wheel.features");
			$($(".mainNav.lava li")[3]).off("click.features");

		});
	}

	// we cannot do anything on this page until all the panels are loaded so we ned to keep track of how many are sucessfuly loaded

	var loadedPanels=0,
		allLoaded=false;

	function loadFeaturePage(panel)
	{
		// we loading all the panels here one by one and once all is loaded in we can trigger scroll event. Scroll callback will scroll the page to the point where the panel is located requested by url

		// dont load the one already loaded, waste simply and also causing trouble with scrolling down the page, its very confusing out there

		if(panel.hasClass("panelMatchingURL")) return;

		$.ajax({
			url: panel.data("purl"),
			data: {
					"panelRequest" : "true",
					"panelId": panel.data("panel-id")}
		})
		.done(function(data) {

			panel.find("> .content").html(data);

			loadedPanels++;

			// -2 because first panel is not counted and the one already loaded from server for this particular url

			if(loadedPanels>=allPanels.length-2 && !allLoaded) {
				allLoaded=true;

				// all is loaded now so we need to fake scroll. Scroll callback will move the page to the place where the requested by url panel is

				$(window).scrollTop(1);

				//alert("all loaded");

		// now make sure all the links linked to other panels in this feature page are scrolling rather then jumping to the top of the page. So we grabbing all anchors from panels, en check its hrefs to see if these match url of this particular page which should be something like
		// http://127.0.0.1/wordpress/features


		$("#features .content a").each(function(i) {


			// use regex to see if the link is to item in the same page
			if($(this).attr("href").match("^"+tempURL+"/"+featuresPageName))
			{

				// links to the same page so make it scroll and cancel jump
				// assign new event to this link

				$(this).on("click",function(e) {

					// find item where to scroll

					var $panelToScrollTo=$(".panel[data-purl='"+$(this).attr("href")+"']");

					// now we need to scroll to anchor tag located before this panel

					var t=$panelToScrollTo.prev().offset().top-featureIconsVerticalOffset;

					// now we need to know if the bar will be sticky when we already scroll as we need to offset position of the scroll then

					var $firstPanel=$($(".panel")[0])
					var firstPanelHeight=$firstPanel.height()+parseInt($firstPanel.css("padding-bottom"));

					t>firstPanelHeight ? topBarHeight=stickyTopBarHeight : topBarHeight=0;

					$("html, body").animate({ scrollTop: t-topBarHeight }, 300);

					// color current icon

					$("[data-scroll-to]").removeClass("active");

					// current icon

					$(".icons [data-scroll-to="+$panelToScrollTo.prev().attr("name")+"]").addClass("active");

					e.preventDefault();
					return false;
				});

			}

		});

			}
		})
		.fail(function() {

		});
	}

	function getTopPanel()
	{
		// function returns panel that is closest to the top of the screen. This also takes sticky menu bar into account

		var docViewTop = $(window).scrollTop()+stickyTopBarHeight-10;

		for(var i=0;i<allPanelsLength;i++)
		{
			if($(allPanels[i]).offset().top>docViewTop)
				break;
		}

		return allPanels[i];
	}

	return {

		init: init
	};
})(jQuery);


ansarada.blog=(function($) {

	function init() {
			
		// when page loads we need to resize main part so the scrollbar will show. Otherwise on large screens the initial posts (bricks) will load and the rest won't be accessible as the scrollbar will not be showing and user will not be able to scroll any furhter to trigger load of new posts
		
		$("html").height($(window).height()+10);
		
		// the same has to happen on resize
		
		$(window).on("resize.blog",function(e)
		{
			$("html").height($(window).height()+10);
		});
		
		
		// run plugin and assign events as necessaary
		
		$("ul.bricks").masonry({
		  gutter: 27,
		  "columnWidth": 288,
		  itemSelector: 'li[data-category]'
		});	
		
		var animatingBricks=false;
		
		// we also need to make whole bricks clickable, not only the heading
		
		$(".bricks").on("click","li",function(e) { location.href=$(this).find("h2 a").attr("href"); });
		
		// this is click on ALL lozenge
		
		$("ul.categoryLozenges > li.all").on("click", function(e) {
		
			// first check if elements are being animated (hiding), if so ignore click
			
			if(animatingBricks) return;
			
			$("html,body").animate({ scrollTop: 104 }, 300);
			
			// select bricks that are hidden only, otherwise whole content will animate in again
			
			var allBricks=$(".bricks > li:not(:visible)");
			//var masonryItems=[];

			//$.each(allBricks, function(i,v) {

				//masonryItems.push($("ul.bricks").masonry("getItem",v));

			//});
			
			//$(allBricks).css({ opacity: 0 });

			$(allBricks).show();
			$("ul.bricks").masonry();
			
			$("ul.categoryLozenges >  li").removeClass("selected");
			$(this).addClass("selected");
		
			//$("ul.bricks").masonry("reveal",masonryItems);
			
			//$("ul.bricks").masonry();
			
			//$(allBricks).css({ opacity: 1 });
		});
		
		// click on other lozenges
		
		$("ul.categoryLozenges").on("click", " > li:not(.all)",function(e) {

			// first check if elements are being animated (hiding), if so ignore click
			
			if(animatingBricks) return;
					
			// when lozenge is clicked we need to hide items or show items for this lozenge category
			// if currently "all" lozenge is selected we need to however remove all items and show only the one category user just clicked
			
			var bricks;
			var masonryItems=[];
			
			if($("ul.categoryLozenges > li.all.selected").length)
			{
				// ALL is currently selected
				
				$(this).addClass("selected");
				
				// lozenge clicked so remove selected from "all" lozenge
				
				$("ul.categoryLozenges >  li.all").removeClass("selected");
				
				// rather then looping over bricks and then over its categoories we use regex to find if category is on the list
				
				var catRegExp=new RegExp("(^|[^\d])"+$(this).data("show-category")+"([^\d]|$)");
				
				// hide bricks we dont need now
				
				// iterate over bricks and check one by one if belongs to category clicked, if not then hide
				
				$.each($(".bricks > li"), function(i,v) {

					// if brick hasnt got category clicked on the list of categories that it belongs to then hide it
					
					if(!catRegExp.test($(v).data("category")))					
					{
						animatingBricks=true;
						$(v).css("display","none");
						
						animatingBricks=false;
						
					}
				});
				
				$("ul.bricks").masonry();
						
				// and exit as correct bricks are shown by now and we dont need the rest
				
				return;
			}
			else
			{	
				// check if we swithing button ON or OFF
				
				if($(this).hasClass("selected"))
				{
					// switching OFF
				
					$(this).removeClass("selected");
					
					// now check if any lozenges are selected and if not show all
					
					if(!$("ul.categoryLozenges > li.selected").length)
					{
						$("ul.categoryLozenges > li.all").addClass("selected");
						var allBricks=$(".bricks > li:not(:visible)");
						$(allBricks).show();
						$("ul.bricks").masonry();
						return;
					}
					
					// loop over all the bricks one by one and see if there is any button selected with category matching this brick
				
					var catRegExp=new RegExp("(^|[^\d])"+$(this).data("show-category")+"([^\d]|$)");
				
					$.each($(".bricks > li:visible"), function(i,v) {

						// get this bricks categories and loop over comparing to list buttons selected
						
						var brickCategories=$(v).data("category").toString().split(",");
						
						for(var i=0;i<brickCategories.length;i++)
							if($("ul.categoryLozenges > li.selected[data-show-category="+brickCategories[i]+"]").length)
								return;
								
						// none matching so hide the brick
						
						animatingBricks=true;
						
						$(v).css("display","none");
						animatingBricks=false;
												
					});
					$("ul.bricks").masonry();
					
				}
				else
				{
					// switching ON
				
					$(this).addClass("selected");
										
					// rather then looping over bricks and then over its categoories we use regex to find if category is on the list
					
					var catRegExp=new RegExp("(^|[^\d])"+$(this).data("show-category")+"([^\d]|$)");
					
					// iterate over bricks and check one by one if belongs to category clicked, if not then hide
					
					$.each($(".bricks > li").not(":visible"), function(i,v) {

						// now check all the bricks that are not visible and belong to category just clicked
						
						if(catRegExp.test($(this).data("category")))					
						{
							$("ul.bricks").masonry("reveal",[$("ul.bricks").masonry("getItem",this)]);	
							//$("ul.bricks").masonry();
						}
					});
					
					$("ul.bricks").masonry();
				
				}
			}
			
			return;
		});
		
		
		// other blog page related functionality, scroll with sticky header etc
		
		var featureIconsVerticalOffset=25;
		var fixed=false;
		var $firstPanel=$($(".panel")[0]);
		var firstPanelHeight=$firstPanel.height();
		
		// value keeps nummber of posts displayed currently so when we grab additional posts via ajax we know which ones to grab from
		
		var offset=$(".bricks > li").length;
		
		// flag to mark when the posts are being loaded. This is to avoid repeating ajax requests when user scrolls to the bottom of the window
		
		var retrevingPosts=false;

		function retrievePosts()
		{
			var lastAdded;
			
			retrevingPosts=true;
			
			$(".loadingPosts").addClass("visible");
			
			var tagsSelected=[];
			$(".categoryLozenges .greenButton.selected").each(function(i) { tagsSelected.push($(this).data("show-category")); })
			
			$.ajax({
				type: "post",
				url: tempURL+"/blog",
				data: {json: JSON.stringify({"offset": offset, "tags": tagsSelected})}
				
			}).done(function(data, textStatus, jqXHR) {
				
				// if no LI's returned dont bother
				
				if(!$(data).filter("li").length) return;
				
				// whatever is downloaded append to bricks container
				
				$(".bricks").append(data);
				
				// now if not ALL lozenge is selected then we need to hide bricks from categories that should be not visible
									
				if(!$("ul.categoryLozenges > li.all.selected").length)
				{
					// these elements are added now so grab last few that were loaded so we can go over these and hide the one that categories are not set via lozenges
					
					lastAdded=$(".bricks > li").slice(-$(data).filter("li").length);
					
					// now we go one added brick by one and check if categoy lozenges are set for each of bricks we added
					
					$(lastAdded).each(function() {
					
						var brickCategories=$(this).data("category").toString().split(",");
						
						// maybe better way to check if brick belongs to category somehow but as its not prerformance critical for now should do
						
						//var hiddenBricks=0;
						
						for(var i=0;i<brickCategories.length;i++)
						{
							if(!$(".categoryLozenges > li[data-show-category="+brickCategories[i]+"].selected").length) 
							{
								$(this).hide();
								//hiddenBricks++;
							}
							else
							{
								$(this).show();
								
								// we know this brick has to be displayed now so do not go over categories anymore as if next is hidden then the brick will also hide even though we know it should be visible now
								return;
							}
						}
						
					});
				}
				else
					// if ALL lozenge is seleted then display all loaded bricks
					lastAdded=$(".bricks > li").slice(-$(data).filter("li").length);
				
				
				
				/* now we could simply call .masonry() and have bricks fly into places but nicer effect is when bricks fade in so we need manually set opacity to 0, then fly these in  while they inviible and then animate opacity again */
				
				$(lastAdded).css({ opacity: 0 });
				
				$("ul.bricks").masonry('reloadItems',lastAdded);
				
				// layout bricks
				
				$("ul.bricks").masonry();
				
				setTimeout(function() {
					$(lastAdded).animate({ opacity: 1 },300);
				},700);
				
				// update so we know what posts to request later
				
				offset=$(".bricks > li").length;
					
			}).fail(function(jqXHR, textStatus, errorThrown){
			
				alert("Sorry, something went wrong. Please refresh the page.");
			}).always(function() {
			
				retrevingPosts=false;
				
				$(".loadingPosts").removeClass("visible");
				
			});
			
		}
		
		// resize size of panel as it looks ugly when only few bricks are displayed and footer is very tall
		
		$(".bricks").parents(".panel").css({"min-height":$(window).height()-500});
		
		$(window).on("scroll.blog",function(e)
		{
			// we need to load posts so that user ideally never see them loading at the bottom so when user scrolls not necessarily to the bottom but to the half of the window we load the posts
			
			if($(window).scrollTop()+$(window).height()>=$(document).height()/2 && !retrevingPosts)
			{
				// if user scrolled window to the bottom retrieve posts
				
				retrievePosts();
			};
			
			// at this point if its mobile device simply exit

			if(ansarada.framework.isMobile()) return;

			// we also need to make first panel sticky
			// check if nav is getting out of visible area. it means it should be sticky

			if(!fixed && $(window).scrollTop()>104)
			{
				// this is confusing but we need to multiply firstPanelHeight by 2 as when later we add padding to #features it will push first panel down so we need to move it twice up

				$firstPanel.addClass("fixed").css({"margin-top":-104});
				
				// as this is removed from the flow of the document now, add the same size to the top of the blog so there will be no jump 
				
				$($(".panel")[1]).css("padding-top",firstPanelHeight+"px");
				
				fixed=true;
			}
			else if(fixed && $(window).scrollTop()<104)
			{
				$firstPanel.removeClass("fixed").css({"margin-top":0});;
				fixed=false;

				$($(".panel")[1]).css("padding-top","0px");
				
			}

		});

		$(document).one("pageChanged",function() {

			$(window).off("scroll.blog");
			$(window).off("resize.blog");
			
		});
		
	}


	return {
		init:init
	};
			
}(jQuery));



ansarada.singlePost=(function($) {

	function init() {
		
		// other blog page related functionality, scroll with sticky header etc
		
		var featureIconsVerticalOffset=25;
		var fixed=false;
		var $firstPanel=$($(".panel")[0]);
		var firstPanelHeight=$firstPanel.height();
	
		$(window).on("scroll.blog",function(e)
		{			
			// at this point if its mobile device simply exit

			if(ansarada.framework.isMobile()) return;

			// we also need to make first panel sticky
			// check if nav is getting out of visible area. it means it should be sticky

			if(!fixed && $(window).scrollTop()>104)
			{
				// this is confusing but we need to multiply firstPanelHeight by 2 as when later we add padding to #features it will push first panel down so we need to move it twice up

				$firstPanel.addClass("fixed").css({"margin-top":-104});
				
				// as this is removed from the flow of the document now, add the same size to the top of the blog so there will be no jump 
				
				$($(".panel")[1]).css("padding-top",firstPanelHeight+"px");
				
				fixed=true;
			}
			else if(fixed && $(window).scrollTop()<104)
			{
				$firstPanel.removeClass("fixed").css({"margin-top":0});;
				fixed=false;

				$($(".panel")[1]).css("padding-top","0px");		
			}
		});

		// now move all the images with special class to the right column. See comments in html to understand why
		
		$(".columnWide .alignright").each(function(i,v) {
			$(this).appendTo(".columnImages");
		});
		
		$(document).one("pageChanged",function() {

			$(window).off("scroll.blog");
			$(window).off("resize.blog");
			
		});
	}

	return {
		init:init
	};
			
}(jQuery));







// start everything when initial page is loaded

$(document).ready(function(){

	// this is run on first full load of the page, without ajax e.g. when user types in the address in url direclty or has bookmark
	// we need to initialise framework first time full page is loaded so without ajax with header and footer

	ansarada.framework.init();
});





ansarada.homepage=(function($) {

	function init()
	{
		// for holidays scroll nicely if url with #holidays2013 is requested
		
		if(window.location.hash.substr(1)=="holidays2013")
		{
			$("html,body").animate({ scrollTop: $("#holidays2013").offset().top-36 }, 300);
		}
		
		if($(".flexslider").length)	$(".flexslider").supported();
		if($(".facts").length) 	$(".facts").donuts();

		$(".homepageCircles .box").on("mouseenter",function(e) {

			var t=$(this).find("a.circle .gray");

			if(!ansarada.framework.isIE8())
			{
				$(".homepageCircles .topHeading > div:visible").stop().fadeOut(300,function(e) {

					$(".homepageCircles").find("."+$(t).data("show")).fadeIn(300);

				});
			}
			else
			{
				$(".homepageCircles .topHeading > div:visible").hide();
				$(".homepageCircles").find("."+$(t).data("show")).show();
			}
		});

		$(".homepageCircles .box").on("mouseleave",function(e) {

			if(!ansarada.framework.isIE8())
			{
				$(".homepageCircles .topHeading > div:visible").stop().fadeOut(300,function(e) {

					$(".homepageCircles .topHeading > div.default").fadeIn(300);

				});
			}
			else
			{
				$(".homepageCircles .topHeading > div:visible").hide();
				$(".homepageCircles .topHeading > div.default").show();
			}
			//$(".homepageCircles .learnMore").fadeOut(300);

		});

		// listen to pageChanged custom event as when page is changed e.g. to analysts, we need to reset this module and in this case it means we need to remove scroll callback we attached as this is not needed on other pages

		$(document).one("pageChanged",function() {

			$(window).off("mouse.homepage");
			$("[data-scroll-to]").off("click.homepage");

		});
	}

	return {
		init: init
	};

})(jQuery)




ansarada.contactUs = (function ($) {
	//need to move the donut init here

	function init() {

		// attach listener to showForm button
		
		$(".showForm").on("click",function(e) {
		
			$(".sendMessageConfirmationBox").fadeOut(300,function(e) {
			
				$("form").fadeIn(300);
			
			});
		
		});
		
		// display pointer under contact

		$(".unfoldingPanelPointer > .arrowTop > span").addClass("visible");
		$(".contactIcon").addClass("current-menu-item");
		$(window).scrollTop(0);
		// and remove when page changed

		$(document).one("pageChanged",function() {

			$(".unfoldingPanelPointer > .arrowTop > span").removeClass("visible");
			if($(".contactIcon").hasClass("current-menu-item"))
				$(".contactIcon").removeClass("current-menu-item");

		});

		var allTextBoxes=$("#support").find("> .content > .textBox");

		var settings =  {
			'textTop': 40,
			'textLeft': 0,
			'textwidth': 200
		};

		allTextBoxes.css({
			"top":settings.textTop+"px",
			"left":settings.textLeft+"px",
			"width":settings.textWidth+"px"
		});

		//form submission validation

		$("#wantmore .formpanel form :input, .selectEditable").on('keydown', function(){
			if($(this).val()==$(this).data("error")){
				$(this).val("");
				$(this).removeClass('invalid');
			}
		});

		function setValid(ctrl){
			ctrl.addClass("invalid");
			ctrl.val(ctrl.data("error"));
		}

		$('#wantmore .submitbtn').click(function (e) {
			var isValid = true;
			$("#wantmore .formpanel form :input:not([type=hidden]), .selectEditable").each(function(){
				var input = $(this); // This is the jquery object of the input, do what you will
				if(input[0].nodeName !== "DIV") {
					if(input.val() === "" || input.val() === null || input.val() === input.data("error")){
						isValid = false;
						setValid(input);
					}else{
						input.removeClass("invalid");
					}
				} else {
					//this is for the select box
					var inputCtrl = $(input).find(":input");
					if(inputCtrl){
						if(inputCtrl.val() === "" || inputCtrl.val() === null || inputCtrl.val() === inputCtrl.data("error")){
							isValid = false;
							setValid(input);
						}else{
							input.removeClass("invalid");
						}
					}
				}
			});

			// validate email
			
			if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($("#email").val()))
			{
				isValid=false;
				$("#email").addClass("invalid");
				$("#email").val($("#email").data("error"));
			}
			
			// validate phone
			
			if(!/^(\d|\s|[)(])*$/.test($("#phone").val()))
			{
				isValid=false;
				$("#phone").addClass("invalid");
				$("#phone").val($("#phone").data("error"));
			}
			
			if(isValid === true){
				//submit the form
			}else{
				$($("#wantmore .formpanel form :input.invalid, .selectEditable.invalid")[0]).focus();
				e.preventDefault();
			}
		});

		$("#wantmore .closebtn").click(function (e) {
				
			$("#wantmore .formpanel form")[0].reset();
			
			$("#wantmore .formpanel form input").removeClass("invalid");
			$("#wantmore .formpanel form textarea").removeClass("invalid");
				
			e.preventDefault();
			return false;
		});

		$(".contactlist").expandingList();

		$("#fileChoser").multiDropDown( { multiSelect: false, editable: false, onSelect: function() {
			$(".selectEditable").removeClass("invalid");
			$("#country").val($(this).data("selected-option")).removeClass("invalid");
		} });

	}
	return {

		init: init
	};

})(jQuery);

(function ($) {
	$.fn.itemList = function (options, extra) {

		var returnValue = 0;

		var animationTimeout = 0;

		this.each(function () {
			var $t = $(this);

			$t.append('<div class="hoverBox" style="left:' + (($t.width() / 2) - 50) + 'px"><div></div></div>');

			var hoverBox = $t.find("> .hoverBox");
			var hoverBoxText = hoverBox.find("> div");

			var allIcons = $t.find("> li");

			allIcons.on("mousemove", function (e) {

				clearTimeout(animationTimeout);

				hoverBoxText.text(($(this).find("> a > span").text()));

				var iconMiddle=$(this).position().left+($(this).width()/2);

				var hoverBoxMiddle=hoverBox.width()/2;
				hoverBox.css("left",iconMiddle-hoverBoxMiddle);

				//hoverBox.stop().animate({"opacity": 1},1000);

				if(!ansarada.framework.isIE8())
					hoverBox.fadeIn(300);
				else
					hoverBox.show();
			});

			allIcons.on("mouseout",function(e) {

				animationTimeout=setTimeout(function() {
					//hoverBox.animate({"opacity": 0},1000);

					if(!ansarada.framework.isIE8())
						hoverBox.fadeOut(300);
					else
						hoverBox.hide();

				},500)
			});
		})

		return this;
	}
})(jQuery);


(function ($) {
	$.fn.expandingList = function (opts) {

		// default configuration
		var config = $.extend({}, {
			slide: true
		}, opts);
		var zeroOpacity = "0";
		if(ansarada.framework.isIE8()){
			zeroOpacity = "1";
			$(".modules-trigger").next("div").css("opacity","1");
		}

		function collapse(elem, func){
			 elem.toggleClass('active').next().animate(
				{
					opacity: zeroOpacity
				},
				200,
				function(){
					elem.removeClass('active');
					if(func){
						elem.next().slideUp(300, func);
					}else{
						elem.next().slideUp(300);
					}
				}
			);
		}

		function expand(elem) {
			$(elem).toggleClass('active').next().slideDown(300, function(){
				$(elem).next().animate(
					{
						opacity: "1"
					},
					500
				);
			});
		}

		// main function
		function initialise(e) {
			$(e).find('.block-content').hide();
			$('.modules-trigger').click(function () {
				if(config.slide){
						var clicked = $(this);
						if (clicked.next().is(':hidden')) {
							var active = $('.modules-trigger.active');
							if(active.length > 0){
								//allow for pre collapsed
								collapse(active, function() { expand(clicked);});
							} else {
								expand(clicked);
							}
						}
						else {
							collapse($(this));
						}
				} else{
					if ($(this).next().is(':hidden')) {
						expand($(this));
					}
					else {
						 collapse($(this));
					}
				}
				return false;
			});
		}

		// initialize every element
		//this.each(function() {
		initialise($(this));
		//});

		return this;
	};


})(jQuery);

(function ($) {

	$.fn.supported = function (opts) {

		// default configuration
		var config = $.extend({}, {
			opt1: null
		}, opts);

		var transition = "fade";
		if (ansarada.framework.isIE8()) {
			transition = "slide";
		}
		// main function
		function initialise(e) {
			$('.flexslider').flexslider({
				animation: transition,
				directionNav: false

			});
		}

		// initialize every element
		//this.each(function() {

		initialise($(this));
		//});

		return this;
	};



})(jQuery);



ansarada.aboutUs = (function ($) {
	//need to move the donut init here

	function init() {

		if($(".flexslider").length)	$(".flexslider").supported();
		if($(".facts").length) 	$(".facts").donuts();

		if(ansarada.framework.isIE8())
			setupVideo();

	}

	
	return {

		init: init
	};
	
})(jQuery);


ansarada.analysts = (function ($) {
	//need to move the donut init here

	function init() {

		if($(".flexslider").length)	$(".flexslider").supported();
		if($(".facts").length) 	$(".facts").donuts();


		if(ansarada.framework.isIE8())
			setupVideo();

	
	}
	return {

		init: init
	};

})(jQuery);



ansarada.sellers = (function ($) {
	//need to move the donut init here

	function init() {

		if($(".flexslider").length)	$(".flexslider").supported();
		if($(".facts").length) 	$(".facts").donuts();

		if(ansarada.framework.isIE8())
			setupVideo();

	}
	
	return {

		init: init
	};

})(jQuery);



ansarada.advisors = (function ($) {
	//need to move the donut init here

	function init() {

		if($(".flexslider").length)	$(".flexslider").supported();
		if($(".facts").length) 	$(".facts").donuts();

		// removed so video wont resize when 
		//if(ansarada.framework.isIE8())
		//	setupVideo();

	}
	return {

		init: init
	};

})(jQuery);








// static (no animation) versions of pages have different inits
// kept separated as these are in fact different templates


ansarada.aboutUs_static = (function ($) {
	//need to move the donut init here

	function init() {

		if($(".flexslider").length)	$(".flexslider").supported();
		if($(".facts").length) 	$(".facts").donuts();

		setupVideo();
		
		if(ansarada.framework.isIE8()) return;
		
		$(window).on("resize.aboutUs",function(e) {
		
			var h=($(window).width()/1.5)-960;
			
			$("#staticPanels .panel:not(':first-child')").height(720+(h>0 ? h/2 : 0));
		
		});	
		
		$(document).one("pageChanged",function() {

			$(window).off("resize.aboutUs");

		});
	}

	
	return {

		init: init
	};
	
})(jQuery);


ansarada.analysts_static = (function ($) {
	//need to move the donut init here

	function init() {

		if($(".flexslider").length)	$(".flexslider").supported();
		if($(".facts").length) 	$(".facts").donuts();


		setupVideo();
		if(ansarada.framework.isIE8()) return;
		
		
		$(window).on("resize.analysts",function(e) {
		
			var h=($(window).width()/1.5)-960;
			
			$("#staticPanels .panel:not(':first-child')").height(720+(h>0 ? h/2 : 0));
		
		});	
		
		$(document).one("pageChanged",function() {

			$(window).off("resize.analysts");

		});
	
	}
	return {

		init: init
	};

})(jQuery);



ansarada.sellers_static = (function ($) {
	//need to move the donut init here

	function init() {

		if($(".flexslider").length)	$(".flexslider").supported();
		if($(".facts").length) 	$(".facts").donuts();

		setupVideo();
		
		if(ansarada.framework.isIE8()) return;
		

		$(window).on("resize.sellers",function(e) {
		
			var h=($(window).width()/1.5)-960;
			
			$("#staticPanels .panel:not(':first-child')").height(720+(h>0 ? h/2 : 0));
		
		});	
		
		$(document).one("pageChanged",function() {

			$(window).off("resize.sellers");

		});
	}
	
	return {

		init: init
	};

})(jQuery);



ansarada.advisors_static = (function ($) {
	//need to move the donut init here

	function init() {

		if($(".flexslider").length)	$(".flexslider").supported();
		if($(".facts").length) 	$(".facts").donuts();

		setupVideo();
if(ansarada.framework.isIE8()) return;
		
		$(window).on("resize.advisors",function(e) {
		
			var h=($(window).width()/1.5)-960;
			
			$("#staticPanels .panel:not(':first-child')").height(720+(h>0 ? h/2 : 0));
			
		});
				
		$(document).one("pageChanged",function() {

			$(window).off("resize.advisors");

		});
	}
	return {

		init: init
	};

})(jQuery);

function setupVideo() {
	$('.wistia_embed').ready(function() {
		if(typeof wistiaEmbed==="undefined") { return;}

		// video
		$(window).on('resize.video', function() {
			resizeVideoToBrowserWidth();
		});

		$(document).one("pageChanged",function() {
			$(window).off("resize.video");
		});

		// first panel
		$(".playButton").eq(0).on('click', function(e) {
			wistiaEmbed.play();
			playVideo();
		});

		wistiaEmbed.bind("play", function() {
			playVideo();
		});

		wistiaEmbed.bind("pause", function() {
			pauseVideo();
		});

		wistiaEmbed.bind("end", function() {
			pauseVideo();
		});
	});

	$(".slide").eq(0).height((360 / 640) * $(window).width());
}

function playVideo() {
	resizeVideoToBrowserWidth();
	$(".video").css({
		"position": "static",
		"left": "0px"
	})

	if (!ansarada.framework.isIE8()) {
		$(".video").stop().fadeTo(600, 1);
	}
}

function pauseVideo() {
	if (ansarada.framework.isIE8()) {
		$(".video").css({
			"position": "absolute",
			"left": "-10000px"
		});
	} else {
		$(".video").stop().fadeTo(600, 0, function() {
			$(".video").css({
					"position": "absolute",
					"left": "-10000px"
			});
		});
	}
}

function resizeVideoToBrowserWidth() {
	var originalVideoHeight = 360;
	var originalVideoWidth = 640;
	var ratio = originalVideoHeight / originalVideoWidth;
	var browserWidth = $(window).width();

	$(".slide").eq(0).height(ratio * browserWidth);
	// $(".introVideo").height(ratio * browserWidth);
	wistiaEmbed.width(browserWidth);
	wistiaEmbed.height(ratio * browserWidth);
}

// function resizeVideoToBrowserWidth() {
// 	var originalVideoHeight = 360;
// 	var originalVideoWidth = 640;
// 	var ratio = originalVideoHeight / originalVideoWidth;
// 	var browserWidth = $(window).width();

// 	$(".introVideo .content").width("100%").height(ratio * browserWidth);
// 	$(".introVideo").height(ratio * browserWidth);
// 	wistiaEmbed.width(browserWidth);
// 	wistiaEmbed.height(ratio * browserWidth);
// }


(function ($) {

	$.fn.donuts = function (opts) {

		// default configuration
		var config = $.extend({}, {
			opt1: null
		}, opts);

		var panel_action = false;
		var donutdata = null;
		if ($('#donutdata').length) {
			donutdata = JSON.parse($('#donutdata').text());
		}

		//support functions
		function isScrolledIntoView(elem) {
			var docViewTop = $(window).scrollTop();
			var docViewBottom = docViewTop + $(window).height();

			var elemTop = $(elem).offset().top;
			var elemBottom = elemTop + $(elem).height();

			return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
		}

		function addNonPercentNumber(obj1) {
			obj1.append('<div class="gauge-counter-sep">0</div>');
			var $counter = obj1.find(".gauge-counter-sep");
			var data_range = obj1.attr("data-range");
			var percentlabel = obj1.attr("data-append");
			$counter.animateNumber(data_range, percentlabel);
		}

		$(window).on("scroll.donut",function () {

			if (donutdata.length) {
				if (isScrolledIntoView('.' + donutdata[0].name + '-cont') == true && panel_action == false) {
					$(donutdata).each(function(i, obj){
						$("#" + obj.name).donutchart("animate");
						addNonPercentNumber($("#" + obj.name));
						panel_action = true;
					});
				}
			}
		});

		$(document).one("pageChanged",function() {

			$(window).off("scroll.donut");

		});


		// main function
		function initialise(e) {

			if (donutdata.length) {
				$(donutdata).each(function(i, obj){
					$("#" + obj.name).donutchart({
						'size': obj.size,
						'textsize': obj.textsize,
						'donutwidth': obj.donutwidth,
						'fgColor': obj.fgColor,
						'bgColor': obj.bgColor,
						'bottomtext': $("#" + obj.name).attr('data-title'),
						'innerBorderWidth': obj.innerBorderWidth,
						'percent_size': obj.percent_size,
						'hasStyle': obj.hasStyle,
						'icon': obj.icon,
						'nocount': obj.nocount
					});
				});
			}
		}

		// initialize every element
		//this.each(function() {
		initialise($(this));
		//});

		return this;
	};


})(jQuery);

(function($) {
	$.fn.animateNumber = function(to, append) {

		function numberWithCommas (x) {
			return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		}

		var $ele = $(this),
		    num = parseInt($ele.html()),
		    up = to > num,
		    num_interval = Math.abs(num - to) / 90;

		var loop = function() {
			num = up ? Math.ceil(num + num_interval) : Math.floor(num - num_interval);
			if ((up && num > to) || (!up && num < to)) {
				num = to;
				clearInterval(animation);
			}
			$ele.html(numberWithCommas(num));

			if (append){
				$ele.html($ele.html() +  append);
			}
		};

		var animation = setInterval(loop, 5);
	};
})(jQuery);


// plugin for custom drop down boxes

	(function($)
	{

		$.fn.multiDropDown=function(options) {

			// default settings

			var settings = $.extend( {
				'editable': true,
				'multiSelect': true,
				'duplicatesAllowed': true,
				'onSelect': function() {},
				'scrollingContainer': null,

			}, options);

			return this.each(function()
			{
				// check if option passed to a plugin is a call for public function, if so call the function rather then attaching plugin

				if(typeof options == 'string')
				{
					switch(options)
					{
						case "refresh":
						{
							refresh.call(this);
							return;
						}
					}
				}

				// public function that updates preselected values. Call it when preselected values change and need to update lozenges or otherwise selected value
				// also call it after the dropdown becomes visible and the values are preselected

				function refresh()
				{
					var t=$(this);
					var c=t.find("> .options");
					var allLI=c.find("> div > ul > li");
					var editableInput=t.find("> .selectedItems > .inputField > input");

					// remove all selected items first

					t.find("> .selectedItems > ul >li").remove();

					$.data(t[0],"displayedLozengesWidth",0);

					var displayedLozengesWidth=0;

					c.find(">div > ul > li").filter(".selected").each(function() {

						var selectedLI=this;

						// lozenge is being added

						// here get the content that needs to be put into lozenge. This might be some inside span, title attribute or something and might be different from the content of the LI as this might contain html, icons images etc

						var lozengeContent=$(this).find(">div").text();

						if($.data(t[0],"multiDropDownSettings").multiSelect)
						{
							// add new lozenge to list of lozenges selected

							var newLozenge=t.find("> .selectedItems > ul").prepend('<li data-selected-option="'+$(selectedLI).data("selected-option")+'"><div>'+lozengeContent+'</div></li>');

							newLozenge=t.find("> .selectedItems > ul").find('li[data-selected-option='+$(selectedLI).data("selected-option")+']');

							// we dont want to display this lozenge yet as we don't know if it will fit in with all the other lozenges in space provided by max-width in css
							// so we make new lozenge position absolute and make it invisible so its width can be measured without actually outputting it to the screen

							newLozenge.css({
								position: "absolute",
								opacity: 0
								});

							// add width of new lozenge to total width of lozenges and check how much horizontal space all the lozenges take and  if more than available display message how many is selected

							displayedLozengesWidth=displayedLozengesWidth+newLozenge.width();

							$.data(t[0],"displayedLozengesWidth",displayedLozengesWidth);

							// check if this lozenge once added to sum of all lozenges width will be more than space available for our list of lozenges

							if(displayedLozengesWidth>parseInt(t.find("> .selectedItems > ul").css("max-width")))
							{
								// all lozenges would take too much space so hide lizt of lozenges and add one in front of the list with message total


								// lozenges are hidden now so add new one with number and message


								// adjust the size of input field where user can type in stuff
								// this will haoppen simultaneously as animation for loznges plays so its mooth effect

								t.find("> .selectedItems > .inputField").width(t.find("> .selectedItems").width()-t.find("> .selectedItems > ul").width());

								// check if total message is already displayed, if so change message only but not animate it anymore

								if(t.find("> .selectedItems > ul > .totalLozenges").length)
								{
									// here we simply change message
									t.find("> .selectedItems > ul > .totalLozenges").html('<div>Total selected '+(t.find("> .selectedItems > ul > li").length-1)+'</div>'); // -1 as there is still total lozenge in a list


									// adjust the size of input field where user can type in stuff
									// this will haoppen simultaneously as animation for loznges plays so its mooth effect

									t.find("> .selectedItems > .inputField").width(t.find("> .selectedItems").width()-t.find("> .selectedItems > ul").width());

									modyfyingSelected=false;
								}
								else
								{
									// hide all current lozenges

									t.find("> .selectedItems > ul > li").hide();

									// add new item to front of the list with total message

									t.find("> .selectedItems > ul").prepend('<li class="totalLozenges"><div>Total selected '+(t.find("> .selectedItems > ul > li").length)+"</div></li>");

									// adjust the size of input field where user can type in stuff
									// this will haoppen simultaneously as animation for loznges plays so its mooth effect

									t.find("> .selectedItems > .inputField").width(t.find("> .selectedItems").width()-t.find("> .selectedItems > ul> .totalLozenges").width());

									t.find("> .selectedItems > ul > .totalLozenges").hide().show();
								}

							//	t.find("> .selectedItems > ul > .totalLozenges").text(t.find("> .selectedItems > ul > li").length-1).show(300);
							}
								else
								{
									// we need it to display now so make it static again and later animate in
									newLozenge.css({
										position: "static",
										opacity: 1
										});

									// adjust the size of input field where user can type in stuff
									// this will haoppen simultaneously as animation for loznges plays so its mooth effect

									t.find("> .selectedItems > .inputField").width(t.find("> .selectedItems").width()-t.find("> .selectedItems > ul").width());

									// animate new lozenge in
									t.find("> .selectedItems > ul > li:first-child").hide().show();
								}
							}
							else
							{
								$(allLI).removeClass("selected");
								$(selectedLI).addClass("selected");

								settings.onSelect.call(selectedLI);

								editableInput.val(lozengeContent);
							}
						}

					);
				}

				// otherwise continue to initialise plugin
				// later we can do checks in here to see if plugin is attached etc

				var t=$(this);
				var c=t.find("> .options");
				var displayedLozengesWidth=0;

				$.data(t[0],"multiDropDownSettings",settings);

				// check if field is NOT editable and multiselect. If so then we need to make it invisible so user will not be able to tyope in it, cursor won't be blinking. Still watermark text can be put outside of the field

				if(!settings.editable && settings.multiSelect)
				{
					t.find("> .selectedItems > .inputField").css({
						opacity: 0,
						position: "absolute",
						left: "-99999em",
						height: 0
					});
				}


				// flag used to control if the lozenges are being added or removed as this all will be animated  and if we dont check for this all hell breaks loose

				var modyfyingSelected=false;

				// resize input field to the width of whole container

				t.find("> .selectedItems > .inputField").css({ width: "100%"});

				// c will contain options list when its moved to the end of body. we need reference to it so we can navigate thru its item with keys and animate and what not

				var c=t.find("> .options");


				// end public "functions"

				// store in variables for later use

				var editableInput=t.find("> .selectedItems > .inputField > input");
				var allLI=c.find("> div > ul > li");

				function moveToEndOfBody()
				{
					// check if dropdown is not already direct child of the body

					if(c.parent("body").length) return;

					// this is needed so the drop down will show on top of everything else. it needs to be removed from current place in DOM, then moved to the end of body, then displayed on top of everything else and mocved back in dom once drop down close down

					c.appendTo("body");

					// we need to position it under the input field

					c.css({ left: getPositionOnScreen().x, top: getPositionOnScreen().y });
				}

				function moveBack()
				{
					// check if dropdown direct child of the body

					if(!c.parent("body").length) return;

					// when field losing focus animation is finished move back drop down from the end of body and place it in where it was originally

					c.appendTo(t);
				}

				// function opening dropdown

				function openDropDown(e)
				{
					moveToEndOfBody();


					// first of all hide all dropdowns if any open

					$("body > .options").not(c).slideUp(300);
					$(".selectEditable").not(t).removeClass("open");

					// unfold the one clicked

					c.slideDown(300);

					//if(settings.editable)
						editableInput.focus();

					// dont you bubble anywhere
					e.stopPropagation();

					// attach listener so we know if click outside of drop down occures and we can close it

					$("html").on("click.dropDowns",function(e) {

						// if clicked anywhere it should bubble to html then we need to hide dropdowns

						closeDropDown();
					});

					t.addClass("open");
				}

				function closeDropDown()
				{
					$("html").off("click.dropDowns");

					c.slideUp(300,function() {

						t.removeClass("open");

						// alsoo remove items marked as selected as it might happen that in editable and not multiselect mode user selects item, then modifies it. This will cause item in options menu to stay as selected although its not anymore

						//if(settings.editable && !settings.multiSelect)
						//	c.find("> div > ul > li.selected").removeClass("selected");

						moveBack();

						// and remove hovered li as this might cause trouble later when adding items if leftout in options

						c.find("> div > ul > li.hover").removeClass("hover");
					});
				}

				// now check if any scrolling container is specified as the dropdown might be in a dialog or something else that can be scrolled. if so then move options dropdown according to scrolling container rether than window and on window scroll simply close container as it gets too messy to track scrolls for both

				if(settings.scrollingContainer)
				{
					$(settings.scrollingContainer).scroll(function(e)
					{
						c.css({ left: getPositionOnScreen().x, top: getPositionOnScreen().y });
					});

					$(window).scroll(function(e)
					{
						closeDropDown();
					});
				}
				else
					$(window).scroll(function(e)
					{
						c.css({ left: getPositionOnScreen().x, top: getPositionOnScreen().y });
					});



				t.on("click", function(e)
				{
					// check if user clicked lozenge and if so delete lozenge

					if($(e.target).parent()[0].nodeName=="LI" && !$(e.target).parent().hasClass("totalLozenges"))
					{
						updateSelectedValue(c.find("> div > ul > li[data-selected-option="+$(e.target).parent().data("selected-option")+"]"));

						if(settings.editable)
							editableInput.focus();
					}
					else if($(e.target).parent().hasClass("totalLozenges"))
					{
						// if total lozenges clicked then show dropdown only with selected items
						// dropdown might be open or closed by now, no matter we have to display selected items only

						// hide all the items that do not match what user typed in

						c.find("> div > ul > li:not(.selected)").slideUp(300);

						// unfold current set of items

						var a=c;

						moveToEndOfBody();
						a.slideDown(300);

						a.promise().done(function() {

							c.find("> div > ul > li.hover").removeClass("hover");
							c.find("> div > ul > li.selected").slideDown(300);

						});

							editableInput.focus();

						// dont you bubble anywhere

						e.stopPropagation();

						// attach listener so we know if click outside of drop down occures and we can close it

						$("html").on("click.dropDowns",function(e) {

							// if clicked anywhere it should bubble to html then we need to hide dropdowns

							closeDropDown();
						});

						t.addClass("open");

					} else if(!t.hasClass("open"))
					{
						// by now we know that dropdown is clicked and none of the lozenges or total number lozenge is clicked so simply open dropdown with all in it

						editableInput.focus();

						// on click make always all the items visible

						//if(editableInput.val()=="")
							c.find("> div > ul > li").show();

						openDropDown(e);
					}
					else
					{
						// now we know its open drop down and none of the lozenges were clicked so simply close the dropdown

						closeDropDown();
					}
				});

				function updateSelectedValue(selectedLI)
				{

					if($.data(t[0],"displayedLozengesWidth"))
						displayedLozengesWidth=$.data(t[0],"displayedLozengesWidth");

					if($(selectedLI).hasClass("selected"))
					{
						// lozege is being removed

						if(settings.multiSelect)
						{
							// ignore if the lozenge is being added/removed

							if(!modyfyingSelected)
							{
								modyfyingSelected=true;

								$(selectedLI).removeClass("selected");

								// check how much horizontal space all the lozenges take and if more than 	available display message how many is selected

								// first find lozenge that needs to be removed

								var lozengeToBeRemoved=t.find("> .selectedItems > ul").find(">[data-selected-option="+$(selectedLI).data("selected-option")+"]");

								// update total width of lozenges we have after removing this one
								displayedLozengesWidth=displayedLozengesWidth-lozengeToBeRemoved.width();

								$.data(t[0],"displayedLozengesWidth",displayedLozengesWidth);

								// check if width of lozenges we have now will fit into space we provided

								if(displayedLozengesWidth<parseInt(t.find("> .selectedItems > ul").css("max-width")))
								{
									if(t.find("> .selectedItems > ul > .totalLozenges").length)
									{
										lozengeToBeRemoved.remove();

										// so now lozenges will fit in space provided
										// so we remove total lozenges message and display lozenges list

										t.find("> .selectedItems > ul > .totalLozenges").hide(300,function()
										{
											$(this).remove();
										});

										// lozenges were off the screen till now so we chnage position and display in place again

										t.find("> .selectedItems > ul > li").css({
											position: "relative",
											left: "auto",
											opacity: 1
											});

										// adjust the size of input field where user can type in stuff
										// this will haoppen simultaneously as animation for loznges plays so its mooth effect

										t.find("> .selectedItems > .inputField").animate({width: t.find("> .selectedItems").width()-displayedLozengesWidth},300);

										t.find("> .selectedItems > ul > li").not(".totalLozenges").hide().show(300,function() {

											modyfyingSelected=false;
										});
									}
									else
									{
										// adjust the size of input field where user can type in stuff
										// this will haoppen simultaneously as animation for loznges plays so its mooth effect

										t.find("> .selectedItems > .inputField").animate({width: t.find("> .selectedItems").width()-displayedLozengesWidth},300);

										lozengeToBeRemoved.hide(300,function() { $(this).remove(); modyfyingSelected=false;});

									}
								}
								else
								{
									// check if total message is already displayed, if so change message only but not animate it anymore

									if(t.find("> .selectedItems > ul > .totalLozenges").length)
									{
										lozengeToBeRemoved.remove();

										// here we simply change message
										t.find("> .selectedItems > ul > .totalLozenges").html('<div>Total selected '+(t.find("> .selectedItems > ul > li").length-1)+'</div>'); // -1 as there is still total lozenge in a list

										// adjust the size of input field where user can type in stuff
										// this will haoppen simultaneously as animation for loznges plays so its smooth effect

										t.find("> .selectedItems > .inputField").animate({width: t.find("> .selectedItems").width()-t.find("> .selectedItems > ul").width()},300,function() {

										});
										modyfyingSelected=false;
									}
									else
									{
										// hide all current lozenges

										t.find("> .selectedItems > ul > li").hide(300);

										t.find("> .selectedItems > ul > .totalLozenges").remove();

										// add new item to front of the list with total message

										t.find("> .selectedItems > ul").prepend('<li class="totalLozenges"><div>Total selected '+(t.find("> .selectedItems > ul > li").length)+"</div></li>");

										// adjust the size of input field where user can type in stuff
										// this will haoppen simultaneously as animation for loznges plays so its smooth effect

										t.find("> .selectedItems > .inputField").animate({width: t.find("> .selectedItems").width()-t.find("> .selectedItems > ul > .totalLozenges").width()},300);

										t.find("> .selectedItems > ul > .totalLozenges").hide().show(300,function() {

											modyfyingSelected=false;
										});
									}
								}
							}
						}
						else
						{
							// no multiple select so reset content of dropdown input box and deselect option in dropdown

							$(allLI).removeClass("selected");
							editableInput.val("");
						}
					}
					else
					{
						// lozenge is being added

						// here get the content that needs to be put into lozenge. This might be some inside span, title attribute or something and might be different from the content of the LI as this might contain html, icons images etc

						var lozengeContent=$(selectedLI).find(">div").text();

						if(settings.multiSelect)
						{
							if(!modyfyingSelected)
							{
								modyfyingSelected=true;

								$(selectedLI).addClass("selected");

								// add new lozenge to list of lozenges selected

								var newLozenge=t.find("> .selectedItems > ul").prepend('<li data-selected-option="'+$(selectedLI).data("selected-option")+'"><div>'+lozengeContent+'</div></li>');

								newLozenge=t.find("> .selectedItems > ul").find('li[data-selected-option='+$(selectedLI).data("selected-option")+']');

								// we dont want to display this lozenge yet as we don't know if it will fit in with all the other lozenges in space provided by max-width in css
								// so we make new lozenge position absolute and make it invisible so its width can be measured without actually outputting it to the screen

								newLozenge.css({
									position: "absolute",
									opacity: 0
									});

								// add width of new lozenge to total width of lozenges and check how much horizontal space all the lozenges take and  if more than available display message how many is selected

								displayedLozengesWidth=displayedLozengesWidth+newLozenge.width();

								$.data(t[0],"displayedLozengesWidth",displayedLozengesWidth);
								// check if this lozenge once added to sum of all lozenges width will be more than space available for our list of lozenges

								if(displayedLozengesWidth>parseInt(t.find("> .selectedItems > ul").css("max-width")))
								{
									// all lozenges would take too much space so hide lizt of lozenges and add one in front of the list with message total


									// lozenges are hidden now so add new one with number and message


									// adjust the size of input field where user can type in stuff
									// this will haoppen simultaneously as animation for loznges plays so its mooth effect

									t.find("> .selectedItems > .inputField").animate({width: t.find("> .selectedItems").width()-t.find("> .selectedItems > ul").width()},300);

									// check if total message is already displayed, if so change message only but not animate it anymore

									if(t.find("> .selectedItems > ul > .totalLozenges").length)
									{
										// here we simply change message
										t.find("> .selectedItems > ul > .totalLozenges").html('<div>Total selected '+(t.find("> .selectedItems > ul > li").length-1)+'</div>'); // -1 as there is still total lozenge in a list


										// adjust the size of input field where user can type in stuff
										// this will haoppen simultaneously as animation for loznges plays so its mooth effect

										t.find("> .selectedItems > .inputField").animate({width: t.find("> .selectedItems").width()-t.find("> .selectedItems > ul").width()},300);

										modyfyingSelected=false;
									}
									else
									{
										// hide all current lozenges

										t.find("> .selectedItems > ul > li").hide(300);

										// add new item to front of the list with total message

										t.find("> .selectedItems > ul").prepend('<li class="totalLozenges"><div>Total selected '+(t.find("> .selectedItems > ul > li").length)+"</div></li>");

										// adjust the size of input field where user can type in stuff
										// this will haoppen simultaneously as animation for loznges plays so its mooth effect

										t.find("> .selectedItems > .inputField").animate({width: t.find("> .selectedItems").width()-t.find("> .selectedItems > ul> .totalLozenges").width()},300);

										t.find("> .selectedItems > ul > .totalLozenges").hide().show(300, function() {

											modyfyingSelected=false;
										});
									}

								//	t.find("> .selectedItems > ul > .totalLozenges").text(t.find("> .selectedItems > ul > li").length-1).show(300);
								}
								else
								{
									// we need it to display now so make it static again and later animate in
									newLozenge.css({
										position: "static",
										opacity: 1
										});

									// adjust the size of input field where user can type in stuff
									// this will haoppen simultaneously as animation for loznges plays so its mooth effect

									t.find("> .selectedItems > .inputField").animate({width: t.find("> .selectedItems").width()-t.find("> .selectedItems > ul").width()},300);

									// animate new lozenge in
									t.find("> .selectedItems > ul > li:first-child").hide().show(300,function() {

										modyfyingSelected=false;
									});
								}
							}
						}
						else
						{
							$(allLI).removeClass("selected");
							$(selectedLI).addClass("selected");

							settings.onSelect.call(selectedLI);

							editableInput.val(lozengeContent);
						}
					}
				}

				// if input is in focus put class on selectEditable main container so it can be styled accordingly if needed

				t.find("> .selectedItems > .inputField > input").focus(function(e) {

					t.addClass("focus");

				});

				t.find("> .selectedItems > .inputField > input").blur(function(e) {

					t.removeClass("focus");

				});

				// making selection from the list

				allLI.click(function(e) {

					updateSelectedValue(this);
					closeDropDown();
					c.find("> div > ul > li.hover").removeClass("hover");
					e.stopPropagation();
				});

				// function copied from http://flightschool.acylt.com/devnotes/caret-position-woes/

				function doGetCaretPosition(oField) {

					 // Initialize
					 var iCaretPos = 0;

					 // IE Support
					 if (document.selection) {

					   // Set focus on the element
					   oField.focus ();

					   // To get cursor position, get empty selection range
					   var oSel = document.selection.createRange ();

					   // Move selection start to 0 position
					   oSel.moveStart ('character', -oField.value.length);

					   // The caret position is selection length
					   iCaretPos = oSel.text.length;
					 }

					 // Firefox support
					 else if (oField.selectionStart || oField.selectionStart == '0')
					   iCaretPos = oField.selectionStart;

					 // Return results
					 return (iCaretPos);
			    }

				// function displays results matching the string

				function displayResultsFor(inputVal,e)
				{
					// check if argument matches any items in the list, if not then close dropdown
					if(c.find("> div > ul > li:not(:contains('"+inputVal+"'))").length==c.find("> div > ul > li").length)
					{
						closeDropDown();
					}
					else
					{
						// there is a match so hide all the items that do not match what user typed in

						c.find("> div > ul > li:not(:contains('"+inputVal+"'))").slideUp(300);

						// unfold current set of items

						var a=c;

						moveToEndOfBody();

						a.slideDown(300);

						a.promise().done(function() {

							// remove hover from highighted item as when use press space we dont want it to trigger selection but we rather want user to type in space into a field
							//c.find("> div > ul > li.hover").removeClass("hover");

							c.find("> div > ul > li:contains('"+inputVal+"')").slideDown(300);

						});

							editableInput.focus();

						// attach listener so we know if click outside of drop down occures and we can close it

						// dont you bubble anywhere
						e.stopPropagation();

						$("html").on("click.dropDowns",function(e) {

							// if clicked anywhere it should bubble to html then we need to hide dropdowns

							closeDropDown();
						});

						t.addClass("open");

					}
				}

				// function displays options for lozenge currently in focus

				function displayResultsForLozenge(e)
				{
					// user might have pressed something that dosent affect what appears in input field e.g. arrow right/left, tab etc but this might affect which lozenge is selected and so should affect options listed that user see

					// first we check if any of the selected lozenges is in focus if so then we display only matcched elements options

					if(t.find(".selectedItems > ul > li.inFocus").length)
					{
						// is only total displayed rather than individual lozenges for items?

						if(t.find(".selectedItems > ul > li.totalLozenges").length)
						{
							// display only options selected

							// hide all the items that are not selected

							c.find("> div > ul > li:not(.selected)").slideUp(300);

							// unfold current set of items

							var a=c;

							moveToEndOfBody();

							a.slideDown(300);

							a.promise().done(function() {

								// remove hover from highighted item as when user press space we dont want it to trigger selection but we rather want user to type in space into a field
								c.find("> div > ul > li.hover").removeClass("hover");

								c.find("> div > ul > li.selected").slideDown(300);

							});

							// attach listener so we know if click outside of drop down occures and we can close it

							// dont you bubble anywhere
							e.stopPropagation();

							$("html").on("click.dropDowns",function(e) {

								// if clicked anywhere it should bubble to html then we need to hide dropdowns

								closeDropDown();
							});

							t.addClass("open");
						}
						else
						{
							// hide all the items that do not match what lozenge content is

							var inputVal = t.find(".selectedItems > ul > li.inFocus").text();

							c.find("> div > ul > li:not(:contains('"+inputVal+"'))").slideUp(300);

							// unfold current set of items

							var a=c;

							moveToEndOfBody();

							a.slideDown(300);

							a.promise().done(function() {

								// remove hover from highighted item as when use press space we dont want it to trigger selection but we rather want user to type in space into a field
								c.find("> div > ul > li.hover").removeClass("hover");

								c.find("> div > ul > li:contains('"+inputVal+"')").slideDown(300);

							});

							if(settings.editable)
								editableInput.focus();

							// attach listener so we know if click outside of drop down occures and we can close it

							// dont you bubble anywhere
							e.stopPropagation();

							$("html").on("click.dropDowns",function(e) {

								// if clicked anywhere it should bubble to html then we need to hide dropdowns

								closeDropDown();
							});

							t.addClass("open");
						}
					}

				}

				editableInput.keyup(function(e) {
					// if any animation plays ignore the keys otherwise in extreme cases it might become messy when user folds and unfolds options list, navigates via lozenges and so on

					if(c.is(":animated")) return;

					// by now if user typed in anything and its allowed by keyDown callback where we check all key presses this should appear in input field. So the idea is to check again if anything like enter, tab, arrows etc was pressed and act only on important keys that change what appears in input field

					var inputVal=t.find(".selectedItems > .inputField > input").val();

					// now we took care of lozenges and its resulting options by now so we need to check if user simply tries to type something in and if so we need to display results

					if(
						settings.editable
						&& e.keyCode!=40 // down arrow
						&& e.keyCode!=38 // up arrow
						&& e.keyCode!=39 // right arrow
						&& e.keyCode!=37 // left arrow
						&& e.keyCode!=13 // enter
						&& e.keyCode!=17 // ctrl
						&& e.keyCode!=16 // shift
						&& e.keyCode!=9  // tab
						&& e.keyCode!=32 // space
					){
						// it might be the case that user typed something in and we need to dispay results or that user hits backspace or delete and delete field contnt. If this happens we need to display all the options, otherwise just the ones matching input field value

						if(!inputVal)
						{
							// input field is empty and backspace or delete key was pressed so we need to display make all LI's visible and then check if the dropdown should be unfolded

							c.find("> div > ul > li").slideDown(300);

							// check if already open and not enter/tab/arrow up etc then unfold dropdown
							if(	!t.hasClass("open"))
							{
								openDropDown(e);
							}
						}
						else // here we just need to display results that match what user typed in input field
							displayResultsFor(inputVal,e);

					}/*
					else if(e.keyCode==40)
					{
						moveToEndOfBody();

						// simply open the dropdown and hide items that do not match selectpr and show items that do match

						if(inputVal!="" && settings.editable)
						{
							c.find("> div > ul > li:not(:contains('"+inputVal+"'))").hide();
							c.find("> div > ul > li:contains('"+inputVal+"')").show();
						}
						else if(inputVal=="")
						c.find("> div > ul > li").show();

						c.slideDown(300, function() {

						// if dropdown is open and there is no selection hoveredLI then highlight first visible item
							var hoveredLI=c.find("> div > ul > li.hover");
							if(!hoveredLI.length) hoveredLI=$(c.find(">  div > ul > li").filter(":visible")[0]).addClass("hover");
						});

						// attach listener so we know if click outside of drop down occures and we can close it

						// dont you bubble anywhere
						e.stopPropagation();

						$("html").on("click.dropDowns",function(e) {

							// if clicked anywhere it should bubble to html then we need to hide dropdowns

							closeDropDown();
						});

						t.addClass("open");

					}*/

					// now above condition checks if user types something in and eliminates common keys but now if user en up pressing backspace or delete and the field becomes empty we need to display all results


					e.stopPropagation();
				})

				function getPositionOnScreen()
				{
					return {
						x: t.offset().left-t.scrollLeft(),
						y: t.offset().top-t.scrollTop()+t.height()
					}
				}



				editableInput.keydown(function(e) {

					if(c.is(":animated")) return;

					// get currently highlighted with keyboard item

					var hoveredLI=c.find("> div > ul > li.hover");

					if(e.keyCode==40) // down arrow
					{
						// if lozenge selected is in focus just deselect it so drop down with options can get focus

						if(t.find(".selectedItems > ul > li.inFocus").length)
						{
							// when user hits arrow down we want all the options to show for all the lozenges

							c.find("> div > ul > li").slideDown(300);

							openDropDown(e);

							// and remove focus from lozenge as arrow down will focus on dropdown with options now

							t.find(".selectedItems > ul > li.inFocus").removeClass("inFocus");
						}

						// if we not pressing down when lozenge is focused so pressing down simply from ediatable field then check if anything on the list matches what user typed in and if not then return and ignore the rest

						else if(c.find("> div > ul > li:not(:contains('"+editableInput.val()+"'))").length==c.find("> div > ul > li").length && editableInput.val()!="" && !t.hasClass("open"))
							return false;

						// so no lozenge selected and we know that there are some options to display so now check if input contains somethng and if not display all options
						// we also need always to display all the options if the field is not editable and not multiselect. otherwise user will end up with limited options set once anything chosen from the dropdown

						else if(editableInput.val()=="" || (!settings.editable && !settings.multiSelect))
						{
							if(!t.hasClass("open"))
							{
								c.find("> div > ul > li").show();
								openDropDown(e);
							}
						}

						// if input contains something and no option is highlighted (selected via keyboard) then display matching options only

						else if(editableInput.val()!="" && !hoveredLI.length)
							displayResultsFor(editableInput.val(),e);


						// on arrow down navigate over currently visible items.

						if(!hoveredLI.length) hoveredLI=$(c.find(">  div > ul > li").filter(":visible")[0]).addClass("hover");
						else if(hoveredLI.nextAll(":visible").length)
						{
							c.find("> div > ul > li.hover")
								.removeClass("hover")
								.nextAll(":visible").first()
								.addClass("hover");

						}

						e.preventDefault();
					}
					else if(e.keyCode==8 && !modyfyingSelected) // backspace
					{
						// check if lozenge is not in focus

						if(!t.find(".selectedItems > ul > li.inFocus").length)
						{
							// if its not editable field and none of the lozenges has focus then ignore the key

							if(!settings.editable)
							{
								e.preventDefault();
								return;
							}

							// otherwise

							if(!doGetCaretPosition(t.find(".selectedItems > .inputField > input")[0])){

								// nothing is typed in front of the cursor and its in position 0 so put first lozenge in focus

								t.find(".selectedItems > ul > li:visible").last().addClass("inFocus");

							}
						}
						else
						{
							// check if totallozenges s displayed and if so remove all selected lozenges

							if(t.find(".selectedItems > ul > li.totalLozenges").length)
							{
								// remove all selected items
								modyfyingSelected=true;
								t.find(".selectedItems > ul > li").hide(300,function() {
									t.find(".selectedItems > ul > li").remove();
									}
								);

								c.find("> div > ul > li.selected").removeClass("selected");

								displayedLozengesWidth=0;

								$.data(t[0],"displayedLozengesWidth",0);

								t.find("> .selectedItems > .inputField").animate({width: t.find("> .selectedItems").width()},300,function() {

									modyfyingSelected=false;
								});

							}
							else
							{
								// remove only one selected lozenge
								updateSelectedValue(c.find("> div > ul > li[data-selected-option="+t.find(".selectedItems > ul > li.inFocus").data("selected-option")+"]"));
							}

							// also remove focus from the one deleted
							// NEED TO CHECK IF THIS IS NECESSARY
							t.find(".selectedItems > ul > li.inFocus").removeClass("inFocus");
						}
					}
					else if(e.keyCode==39) // right arrow
					{
						// check if any of the selected lozenges has focus, if so  then left/right arrow will navigate between these

						if(t.find(".selectedItems > ul > li.inFocus").length && t.find(".selectedItems > ul > li.inFocus").next("li:visible").length)
						{
							t.find(".selectedItems > ul > li.inFocus").removeClass("inFocus").next("li:visible").addClass("inFocus");

							// in here as we navigated to another lozenge display new set of matching options
							displayResultsForLozenge(e);

							e.preventDefault();
						}
						else if(t.find(".selectedItems > ul > li.inFocus").length && !t.find(".selectedItems > ul > li.inFocus").next("li:visible").length)
						{
							t.find(".selectedItems > ul > li.inFocus").removeClass("inFocus");

							// no lozenge is selected and so we need to take care of displaying results for whatever is typed in the field

							displayResultsFor(editableInput.val(),e);

							e.preventDefault();
						}
					}
					else if(e.keyCode==37) // left arrow
					{
						// check if any of the selected lozenges has focus, if so  then left/right arrow will navigate between these

						if(t.find(".selectedItems > ul > li.inFocus").length && t.find(".selectedItems > ul > li.inFocus").prev("li:visible").length)
						{
							// nothing is typed in so put fiirst lozenge in focus

							t.find(".selectedItems > ul > li.inFocus").removeClass("inFocus").prev("li:visible").addClass("inFocus");

						} else if(!t.find(".selectedItems > ul > li.inFocus").length && !doGetCaretPosition(t.find(".selectedItems > .inputField > input")[0]))
						{
							t.find(".selectedItems > ul > li:visible").last().addClass("inFocus");

						}

						displayResultsForLozenge(e);
					}
					else if(e.keyCode==38) // up arrow
					{
						// check if any visible options are above currrently selected one
						if(hoveredLI.prevAll(":visible").length)
							c.find("> div > ul > li.hover")
								.removeClass("hover")
								.prevAll(":visible").first()
								.addClass("hover");
						else
						{
							// if thats the top item then close the drop down box

							closeDropDown();
							c.find("> div > ul > li.hover").removeClass("hover");
						}

						e.preventDefault();
					} else if(e.keyCode==13 && !e.ctrlKey && hoveredLI.length) // enter
					{
						// if the dropdown is not open then igonore key as otherwise the currently "hover"ed item will be selected

						if(!t.hasClass("open")) return false;

						updateSelectedValue(hoveredLI);

						closeDropDown();

						hoveredLI.removeClass("hover");

						e.preventDefault();
						e.stopPropagation();
					}
					// check if new item is being added via typing so user hits enter and this should add lozenge
					else if(settings.editable && settings.multiSelect
					&& e.keyCode==13 // enter
					&& !hoveredLI.length // nothing hovered with keyboard
					)
					{
						// if user hits enter on empty field ignore it

						if(editableInput.val()=="") return false;

						// check for duplicated items

						if(!settings.duplicatesAllowed)
						{
							if(c.find("> div > ul > li:contains('"+editableInput.val()+"')").length) return;
						}

						// end TODO: check for duplicated items

						// add new value to the list of options

						var randomId=parseInt(Math.random(1)*100000000);

						c.find("> div > ul").append('<li data-selected-option="'+randomId+'"><div>'+t.find(".selectedItems > .inputField > input").val()+"</div></li>");

						// hide and nicely slide down

						// THIS LOGIC BELOW NEEDS TO BE DOUBLE CHECK HERE

						c.find("> div > ul > li:last-child").hide().slideDown(300, function() {

							// if options list is open then its all good
							// if its not open however slide down options menu ith new item added

							if(!t.hasClass("open"))
							{
								c.find("> div > ul > li:not(:contains('"+t.find(".selectedItems > .inputField > input").val()+"'))").hide();

								openDropDown(e);
							}
						});

						// end THIS LOGIC BELOW NEEDS TO BE DOUBLE CHECK HERE

						// add this value as selected and add it to the list of lozenges

						updateSelectedValue(c.find("> div > ul > li[data-selected-option="+randomId+"]"));
						e.stopPropagation();
					}
					else if(e.keyCode==27) // escape
					{
						// if the dropdown is not open then igonore key as otherwise the currently "hover"ed item will be selected
						if(!t.hasClass("open")) return false;

						closeDropDown();

						c.find("> div > ul > li.hover").removeClass("hover");
						t.find(".selectedItems > ul > li.inFocus").removeClass("inFocus");

						e.stopPropagation();

						// do we need preventDefault here?? need to check
					}

					// user press space and some option is hovered with keyboard
					else if(e.keyCode==32 && hoveredLI.length) // space
					{
						// if the dropdown is not open then igonore key as otherwise the currently "hover"ed item will be selected

						if(!t.hasClass("open")) return false;

						// if no multipleselect then close dropdown

						if(!settings.multiSelect)
						{
							closeDropDown();
							hoveredLI.removeClass("hover");
						}

						// this is needed so the actual space character won't be inserted into field
						e.preventDefault();

						updateSelectedValue(hoveredLI);
					}

					// no matter tab or shift+tab they do the same
					else if(e.keyCode==9) // tab
					{
						if(t.hasClass("open")) closeDropDown();

						c.find("> div > ul > li.hover").removeClass("hover");

						t.find(".selectedItems > ul > li.inFocus").removeClass("inFocus");
					}
					else
					{
						// everything else is processed here. By now we took care of important keys so here is probabbly only what user can type in

						// user typed something so remove focus from lozenge selected if any

						t.find(".selectedItems > ul > li.inFocus").removeClass("inFocus");

						// if field is not editable then ignore all the other keys

						//return;
						// do we even need this below??

						if(!settings.editable)
						{
							// field is not editable we still want user to be able to copy content of the field, highlight with shift+arrows etc so do all the checks here and anything else ignore

							if(!(e.shiftKey && (e.keyCode==37 || e.keyCode==39)) // not shift+left/right arrow
								&& e.keyCode!=37
								&& e.keyCode!=39
								&& !(e.ctrlKey && e.keyCode==67) // ctrl+c
							)
								e.preventDefault();
						}
					}
				});

				// when mouse over any of the elements in a list then remove highlight set by arrow up/down if any

				allLI.mouseover(function(e) {

					allLI.removeClass("hover");
				});

			});
		};

	})(jQuery);

	ansarada.printDiv = function (divID) {
		//Get the HTML of div
		var divElements = document.getElementById(divID).innerHTML;

		var newWin=window.open('','Print-Window','width=400,height=400,top=100,left=100');
		newWin.document.open();
		//newWin.document.write('<html><head><link rel="stylesheet" href="http://127.0.0.1/wordpress/wp-content/themes/ansarada/style.css" type="text/css"></head><body id="'+divID+'"><img src="http://origin-beta.ansarada.com/wp-content/themes/screenshot-5/images/ansarada_logo.png" />'+divElements+'</body></html>');
		newWin.document.write('<html><head><style>body {font-family: Arial; margin: 20px;} .modules-trigger {color: #75B81B; text-transform: uppercase;} img {padding-bottom: 15px;}</style></head><body >'+divElements+'</body></html>');
		newWin.document.close();
		newWin.focus();
		newWin.print();
		newWin.close();

		ansarada.collapseAll();

	};

	ansarada.expandAll = function(func){
		var all = $('.modules-trigger'),
			active = all.filter('.active');

		if (all.length && all.length !== active.length) {

			// At least some are closed, open all
			all.not('.active').addClass('active').next().slideDown().css("opacity", "1");
			window.setTimeout(function() {
				if(func){
					func();
				}
			}, 500 );
		}
	};

	ansarada.collapseAll = function(func){
		var all = $('.modules-trigger'),
			active = all.filter('.active');

		if (active && active.length) {

			// At least some are closed, open all
			active.removeClass('active').next().slideUp();
			window.setTimeout(function() {
				if(func){
					func();
				}
			}, 10 );
		}
	};

	
	function helloWorld()
	{
		return "dupa";
	}
