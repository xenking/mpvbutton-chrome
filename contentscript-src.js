var newElement = require('new-element')
var fs = require('fs')
var domready = require('domready')
var reqArrive = require('arrive')
var playerTemplate = fs.readFileSync('./button.html').toString()
var playerTemplateNew = fs.readFileSync('./button-new.html').toString()
var playlistTemplate = fs.readFileSync('./button-playlist.html').toString()
var playlistTemplateMin = fs.readFileSync('./button-playlist-min.html').toString()
var playlistTemplateWide = fs.readFileSync('./button-playlist-wide.html').toString()
var elementTemplate = fs.readFileSync('./button-video.html').toString()

var tries = 0
function injectAll(){
	if(window.location.href.indexOf("subscriptions") > 0){
		document.arrive("#details",{fireOnAttributesModification: true, existing: true}, function() {
			let btn_subs = addElememtBtn(this, this.querySelector("a#video-title").href)
			if(btn_subs) this.insertBefore(btn_subs, this.lastChild.nextSibling)
		});
	}

	if(window.location.href.indexOf("playlist") > 0){
		if(window.location.href.indexOf("playlists") > 0){
			document.arrive("#view-more",{fireOnAttributesModification: true, existing: true}, function() {
				let btn_pls = addTemplateBtn(this.parentNode, this.firstElementChild.href, playlistTemplateMin)
				if (btn_pls) this.insertBefore(btn_pls, this.parentNode.lastChild.nextSibling)
			});
		} else {
			document.arrive("#menu .style-scope.ytd-playlist-sidebar-primary-info-renderer>#top-level-buttons",{fireOnAttributesModification: true, existing: true}, function() {
				let btn_pl = addTemplateBtn(this, window.location.href, playlistTemplate)
				if (btn_pl) this.insertBefore(btn_pl, this.lastChild.nextSibling)
			});
		}
	}
	
	if(window.location.href.indexOf("channel") > 0 || window.location.href.indexOf("user") > 0){
		document.arrive("#play-button>ytd-button-renderer",{fireOnAttributesModification: true, existing: true}, function() {
			href = extractPlaylist(this.querySelector("a").href)
			if(href){
				let btn_chnl = addTemplateBtn(this.parentNode.parentNode, href, playlistTemplateWide)
				if(btn_chnl) this.parentNode.parentNode.insertBefore(btn_chnl, this.parentNode.nextSibling);
			}
		});
	}
	
	if(window.location.href.indexOf("&list=") > 0){
		document.arrive("#playlist-action-menu #top-level-buttons",{fireOnAttributesModification: true, existing: true}, function() {
			href = extractPlaylist(window.location.href)
			if(href){
				let btn_list = addTemplateBtn(this, href, playlistTemplate)
				if(btn_list) this.insertBefore(btn_list, this.lastChild.nextSibling)
			}
		});
	}
	document.arrive(".ytp-chrome-controls",{fireOnAttributesModification: true, existing: true}, function() {
		let btn_new = addTemplateBtn(this, window.location.href, playerTemplateNew);
		if(btn_new) injectPlayerBtn(this, btn_new)
	});
	if(!document.querySelector(".ytp-chrome-controls")){
		document.arrive(".html5-player-chrome",{fireOnAttributesModification: true, existing: true}, function() {
			let btn_old = addTemplateBtn(this, window.location.href, playerTemplate)
			if(btn_old) injectPlayerBtn(this, btn_old)
		});
	}
	document.arrive(".ytp-youtube-button.ytp-button.yt-uix-sessionlink",{fireOnAttributesModification: true, existing: true}, function() {
		let btn_ext = addTemplateBtn(this, this.href, playerTemplateNew)
		if(btn_ext) injectExternalButton(this, btn_ext)
	});

}

function unbindAll(){
	console.log("unbinding")
	document.querySelectorAll('#mpv_button').forEach((el, i) => {
		el.parentNode.removeChild(el);
	});
	document.querySelectorAll('#mpv_playlist_button_wide').forEach((el, i) => {
		el.parentNode.removeChild(el);
	});
	document.querySelectorAll('#mpv_playlist_button').forEach((el, i) => {
		el.parentNode.removeChild(el);
	});
	document.querySelectorAll('#mpv_subs_button').forEach((el, i) => {
		el.parentNode.removeChild(el);
	});
}

function extractPlaylist(href){
	var m = href.match(/((?:PL|EC|UU)[0-9A-Za-z-_]{10,})/)
	return m ? "https://www.youtube.com/playlist?list=" + m[0] : false;
}

function addTemplateBtn(context, href, template){
	var btn = newElement(template);
	let old = context.querySelector("#" + btn.id);
	if (old){
		old.href = "mpv://" + href;
		delete btn;
		return;
	}
	btn.href = "mpv://" + href;
	return btn;
}

function addElememtBtn(context, href){
	var btn = newElement(elementTemplate);
	let old = context.querySelector("#" + btn.id)
	if (old){
		old.firstElementChild.href = "mpv://" + href
		old.lastElementChild.href = "mpv://" + href + "+--no-video";
		delete btn;
		return;
	}
	btn.firstElementChild.href = "mpv://" + href
	btn.lastElementChild.href = "mpv://" + href + "+--no-video";
	btn.addEventListener('mouseover', function () {
		new_href = btn.parentNode.querySelector("a#video-title").href
		btn.firstElementChild.href = "mpv://" + new_href
		btn.lastElementChild.href = "mpv://" + new_href + "+--no-video";
	}) 
	return btn;
}

function injectExternalButton(buttons, btn){
	console.log("external")
	if(!btn) return;
	buttons.insertBefore(btn, buttons.firstChild.nextSibling);
	btn.addEventListener('click', function (e) {
		let popup = window.open(btn.href, "Popup", "height=1, width=1, status=no, toolbar=no, menubar=no, location=no, top = 100000, left=100000 ");
		setTimeout(function(popup){
			popup.close();
			console.log("external worked");
		}(popup), 5000)
		e.preventDefault();
	})
	
	btn.addEventListener('mouseover', function () {
		console.log("trigger")
		btn.href = "mpv://" + buttons.href;
	}) 
}

function injectPlayerBtn(buttons, btn) {
    if(!btn) return;
	buttons.insertBefore(btn, buttons.firstChild.nextSibling);
	btn.addEventListener('click', function () {
		var pause = buttons.querySelector('.ytp-btn-pause')
		if (!pause) pause = buttons.querySelector('.ytp-play-btn')
			if (pause) pause.click()
	})
  
  // hack if wrong href got set at inject time
	btn.addEventListener('mouseover', function () {
		btn.href = "mpv://" + window.location.href;
	}) 
	
	document.addEventListener("fullscreenchange", function() {
		if (document.fullscreenElement){
			btn.style.width="40px";
			btn.style.height="49px";
			btn.style.backgroundSize="27px";
			btn.style.backgroundPosition="center center";
			btn.style.margin="3px";
		}
		if (!document.fullscreenElement){
			btn.style.width="18px";
			btn.style.height="20px";
			btn.style.backgroundSize="17px";
			btn.style.margin="9px 6px 5px 5px";
		}
	}, false);
}
document.addEventListener("yt-navigate-start", injectAll);
domready (injectAll); // one-time late processing

