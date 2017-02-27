var flvScript = document.createElement('script');
flvScript.src = chrome.runtime.getURL('src/flv.min.js');
document.getElementsByTagName('head')[0].appendChild(flvScript);

var danmakuScript = document.createElement('script');
danmakuScript.src = chrome.runtime.getURL('src/danmaku.min.js');
document.getElementsByTagName('head')[0].appendChild(danmakuScript);

var liveScript = document.createElement('script');
liveScript.src = chrome.runtime.getURL('src/live.js');
document.getElementsByTagName('head')[0].appendChild(liveScript);

var node = document.createElement('link');
node.rel = 'stylesheet';
node.href = chrome.runtime.getURL('src/danmaku-player.css');
document.getElementsByTagName('head')[0].appendChild(node);