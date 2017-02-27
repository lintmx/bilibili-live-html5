var room_id = ROOMID;
window.danmaku = new Danmaku();
window.danmaku_server = null;

function get_live_status(room_id) {
    $.ajax({
        url: '//live.bilibili.com/live/getInfo?roomid=' + room_id,
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            var result = ({
                code: data.code,
                msg: data.data.LIVE_STATUS
            });

            if (result.code == 0 && result.msg == 'LIVE') {
                get_live_url(room_id);
                get_danmaku_server(room_id);
            } else {
                console.log('bilibili-live-player: This channel is offline now.');
            }
        }
    })
}

function get_live_url(room_id) {
    $.ajax({
        url: '//live.bilibili.com/api/playurl?player=1&cid=' + room_id,
        type: 'GET',
        success: function (data) {
            var urlArray = new Array();

            if (data != null) {
                var dataXml = $.parseXML(data);

                $(dataXml).find('durl').each(function () {
                    urlArray.push($(this).children('url').text());
                    urlArray.push($(this).children('b1url').text());
                    urlArray.push($(this).children('b2url').text());
                    urlArray.push($(this).children('b3url').text());
                });

                load_html5_player(urlArray[1]);
            } else {
                console.log('bilibili-live-player: Get live video url failed.')
            }
        }
    })
}

function get_danmaku_server(room_id) {
    $.ajax({
        url: '//api.live.bilibili.com/api/player?id=cid:' + room_id,
        type: 'GET',
        success: function (data) {
            if (data != null) {
                data = '<root>' + data + '</root>';
                var dataXml = $.parseXML(data);

                $(dataXml).find('root').each(function () {
                    var result = ({
                        url: $(dataXml).find('dm_server').text(),
                        port: {
                            'ws': $(dataXml).find('dm_ws_port').text(),
                            'wss': $(dataXml).find('dm_wss_port').text()
                        }
                    });

                    window.danmaku_server = new DanmakuServer(room_id, result['url'], result['port']);
                    window.danmaku_server.setListener(danmaku_listener);
                });
            }
        }
    })
}

function load_html5_player(liveUrl) {
    console.log("bilibili-live-player: Replace Player...");

    $('#js-player-decorator').empty();
    $('#js-player-decorator').prepend("<div id='video-container'><video id='html5-live-element' /></div>");
    $('#html5-live-element').css({ "width": "100%", "height": "100%", "position": "absolute" });
    $('#video-container').css({ "width": "100%", "height": "100%" });
    $('#js-player-decorator').css("background-color", "black");
    $('#html5-live-element').dblclick(function () {
        $('body').toggleClass('player-full-win');
        window.danmaku.resize();
    });
    $('#js-player-decorator').append("<div id='video-controller'></div>");
    $('#video-controller').append("<div class='player-icons player-icon-left'></div>");
    $('#video-controller').append("<div class='player-icons player-icon-right'></div>");

    $('div.player-icon-left').append("<button class='player-icon player-icon-play'>" + get_svg('play') + "</button>");
    $('div.player-icon-left').append("<button class='player-icon player-icon-refresh'>" + get_svg('refresh') + "</button>");
    $('div.player-icon-left').append("<div class='player-volume-warp'><button class='player-icon player-icon-volume'>" + get_svg('volume-up') + "</button><div class='player-volume-bar-warp'><div class='player-volume-bar'><div class='player-volume-bar-inner' style='width: 70%; background: #4FC1E9;'></div></div></div></div>");

    $('div.player-icon-right').append("<button class='player-icon player-icon-danmaku'>" + get_svg('danmaku-on') + "</button>");
    // $('div.player-icon-right').append("<div class='player-setting'><button class='player-icon player-icon-setting'>" + get_svg('settings') + "</button><div class='player-setting-box'></div></div>");
    $('div.player-icon-right').append("<button class='player-icon player-icon-full'>" + get_svg('player-full') + "</button>");
    // $('div.player-icon-right').append("<button class='player-icon player-icon-screen'>" + get_svg('screen-full') + "</button>");

    $('button.player-icon-play').click(function () {
        var video = document.getElementById('html5-live-element');

        if (video.paused) {
            $('button.player-icon-play').html(get_svg('play'));
            video.play();
        } else {
            $('button.player-icon-play').html(get_svg('pause'));
            video.pause();
        }
    });

    $('button.player-icon-refresh').click(function () {
        window.danmaku.destroy();
        flvPlayer.destroy();
        flvPlayer = null;
        get_live_url(room_id);
    });

    $('button.player-icon-volume').click(function () {
        var video = document.getElementById('html5-live-element');

        if (video.muted) {
            video.muted = false;
            update_volume_svg();
            updateVolumeBar();
        } else {
            video.muted = true;
            $('button.player-icon-volume').html(get_svg('volume-mute'));
            $('div.player-volume-bar-inner').css({ "width": "0%" });
        }
    });

    function updateVolumeBar() {
        var video = document.getElementById('html5-live-element');

        $('div.player-volume-bar-inner').css({ "width": (video.volume * 100) + "%" });
    }

    $('div.player-volume-bar-warp').click(function () {
        var volumeBar = document.getElementsByClassName('player-volume-bar')[0];
        var video = document.getElementById('html5-live-element');
        var e = event || window.event;

        var num = e.offsetX / 43;
        if (num > 1) {
            num = 1;
        } else if (num < 0) {
            num = 0;
        }

        if (video.muted) {
            video.muted = false;
        }

        video.volume = num;
        updateVolumeBar();
        update_volume_svg();
    });

    $('button.player-icon-danmaku').click(function () {
        if (window.danmaku_show) {
            $('button.player-icon-danmaku').html(get_svg('danmaku-off'));
            window.danmaku.clear();
            window.danmaku.hide();
            window.danmaku_show = false;
        } else {
            $('button.player-icon-danmaku').html(get_svg('danmaku-on'));
            window.danmaku.clear();
            window.danmaku.show();
            window.danmaku_show = true;
        }
    });

    $('button.player-icon-full').click(function () {
        if ($('body').hasClass('player-full-win')) {
            $('button.player-icon-full').html(get_svg('player-full'));
        } else {
            $('button.player-icon-full').html(get_svg('player-full-exit'));
        }
        $('body').toggleClass('player-full-win');
        window.danmaku.resize();
    });

    $('.chat-ctnr-hider-ctnr').click(function () {
        window.danmaku.resize();
    });
    
    var time = 0;

    $('#html5-live-element').mousemove(function hide_controller() {
        
        $('#video-controller').removeClass('video-hide-controller');
        clearTimeout(time)
        time = setTimeout(function () {
            $('#video-controller').addClass('video-hide-controller');
        }, 3500);
    });

    if (window.danmaku != null) {
        window.danmaku.destroy();
    }

    window.danmaku.init({
        container: document.getElementById('video-container'),
        video: document.getElementById('html5-live-element'),
        engine: 'canvas',
        speed: 100
    });
    window.danmaku_show = true;

    var videoElement = document.getElementById('html5-live-element');
    var flvPlayer = flvjs.createPlayer({
        type: 'flv',
        isLive: true,
        url: liveUrl
    });
    flvPlayer.attachMediaElement(videoElement);
    flvPlayer.load();
    flvPlayer.play();

    update_volume_svg();
}

function danmaku_listener(type, body) {
    if (type == 'online') {
        $('span.v-bottom').text(body + ' 人');
    } else if (type == 'msg') {
        if (body != null) {
            receive_msg(body);
        } else {
            console.log();
        }
    }
}

function receive_msg(body) {
    var jsonObj = JSON.parse(body);
    window.protocol[jsonObj.cmd](jsonObj);

    if (jsonObj.cmd == 'DANMU_MSG') {
        show_danmaku(jsonObj.info[1]);
    }
}

function show_danmaku(msg) {
    window.danmaku.emit({
        text: msg,
        canvasStyle: {
            // Chrome 中最小字号为 12px
            font: '25px sans-serif',
            textAlign: 'start',
            // 注意 bottom 是默认的
            textBaseline: 'bottom',
            direction: 'inherit',
            fillStyle: '#fff',
            // 如果 strokeStyle 未设置，不会有描边效果
            strokeStyle: '#000',
            // 效果相当于描边的宽度
            lineWidth: 1.0,
            shadowBlur: 0,
            shadowColor: '#000',
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            filter: 'none',
            globalAlpha: 0.4
        }
    });
}

var E = a(),
    f = 16,
    g = 0,
    b = 4,
    I = 6,
    M = 8,
    y = 12,
    w = (window.pako, o(!0));

function s(t, e) {
    var n = new Uint8Array(t),
        i = new Uint8Array(e),
        o = new Uint8Array(t.byteLength + e.byteLength);
    return o.set(n, 0), o.set(i, t.byteLength), o.buffer;
}

function a() {
    return window.TextEncoder ? new window.TextEncoder : {
        encode: function (t) {
            for (var e = new ArrayBuffer(t.length), n = new Uint8Array(e), i = 0, o = t.length; i < o; i++) {
                n[i] = t.charCodeAt(i);
            };
            return n;
        }
    }
}

function r(t) {
    var e = t.data,
        n = new DataView(e, 0),
        i = n.getInt32(g),
        a = n.getInt16(b),
        s = (n.getInt16(I), n.getInt32(M));
    n.getInt32(y);
    switch (s) {
        case 8:
            this.heartBeat();
            u = setInterval(this.heartBeat.bind(this), 3e4);
            break;
        case 3:
            this._listener && this._listener("online", n.getInt32(16));
            break;
        case 5:
            for (var r, c = n, l = e, d = 0; d < l.byteLength; d += i) {
                i = c.getInt32(d);
                a = c.getInt16(d + b);
                r = w.decode(l.slice(d + a, d + i));
                r || (w = o(!1), r = w.decode(l.slice(d + a, d + i)));
                this._listener && this._listener("msg", r);
            }
    }
}

function c() {
    console.log("onClose");
    u && clearInterval(u);
    var t = Math.floor(3 * Math.random() + 3);
    setTimeout(this.firstConnection.bind(this), 1e3 * t);
}

function l() {
    console.log("Client Error.");
}

function o(t) {
    return window.TextDecoder && t ? new window.TextDecoder : {
        decode: function (t) {
            return decodeURIComponent(window.escape(String.fromCharCode.apply(null, new Uint8Array(t))))
        }
    }
}

class DanmakuServer {
    constructor(room_id, danmaku_url, danmaku_port) {
        var scheme = window.location.protocol.indexOf("https") > -1 ? "wss" : "ws";
        var port = danmaku_port[scheme];

        this.connection = new WebSocket(scheme + "://" + danmaku_url + ":" + port + "/sub");
        this.connection.binaryType = "arraybuffer";
        this.connection.onopen = this.firstConnection.bind(this);
        this.connection.onmessage = r.bind(this);
        this.connection.onclose = c.bind(this);
        this.connection.onerror = l.bind(this);
    }

    firstConnection() {
        console.log("bilibili-live-player: Connect to Danmaku Server...");

        var t = JSON.stringify({
            'uid': 0,
            'roomid': room_id
        });

        var e = new ArrayBuffer(f),
            n = new DataView(e, 0),
            i = E.encode(t);
        n.setInt32(g, f + i.byteLength);
        n.setInt16(b, f);
        n.setInt16(I, 1);
        n.setInt32(M, 7);
        n.setInt32(y, 1);
        this.connection.send(s(e, i));
    }

    heartBeat() {
        console.log("bilibili-live-player: Danmaku Connect heart beat.");
        var t = new ArrayBuffer(f),
            e = new DataView(t, 0);
        e.setInt32(g, f);
        e.setInt16(b, f);
        e.setInt16(I, 1);
        e.setInt32(M, 2);
        e.setInt32(y, 1);
        this.connection.send(t);
    }

    closeHeartBeat() {
        console.log("bilibili-live-player: Close Danmaku connect heart beat.");
        clearInterval(this.heartBeating);
    }

    send(t) {
        this.connection.send(t);
    }

    close() {
        console.log("bilibili-live-player: Close connect.");
        this.connection.close();
    }

    setListener(t) {
        this._listener = t;
    }
}

function update_volume_svg() {
    var video = document.getElementById('html5-live-element');

    if (video.volume >= 0.8) {
        $('button.player-icon-volume').html(get_svg('volume-up'));
    } else if (video.volume < 0.2) {
        $('button.player-icon-volume').html(get_svg('volume-off'));
    } else {
        $('button.player-icon-volume').html(get_svg('volume-down'));
    }
}

function get_svg(type) {
    var svg = {
        'play': ["0 0 24 24", "M8 5v14l11-7z", "M0 0h24v24H0z"],
        'pause': ["0 0 24 24", "M6 19h4V5H6v14zm8-14v14h4V5h-4z", "M0 0h24v24H0z"],
        'refresh': ["0 0 24 24", "M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z", "M0 0h24v24H0z"],
        'volume-up': ["0 0 24 24", "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z", "M0 0h24v24H0z"],
        'volume-down': ["0 0 24 24", "M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z", "M0 0h24v24H0z"],
        'volume-mute': ["0 0 24 24", "M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z", "M0 0h24v24H0z"],
        'volume-off': ["0 0 24 24", "M7 9v6h4l5 5V4l-5 5H7z", "M0 0h24v24H0z"],
        'danmaku-on': ["0 0 24 24", "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z", "M0 0h24v24H0z"],
        'danmaku-off': ["0 0 24 24", "M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z", "M0 0h24v24H0zm0 0h24v24H0zm0 0h24v24H0zm0 0h24v24H0z"],
        'settings': ["0 0 24 24", "M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z", "M0 0h24v24H0z"],
        'player-full': ["0 0 24 24", "M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z", "M0 0h24v24H0z"],
        'player-full-exit': ["0 0 24 24", "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2z", "M0 0h24v24H0z"],
        'screen-full': ["0 0 24 24", "M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z", "M0 0h24v24H0z"],
        'screen-full-exit': ["0 0 24 24", "M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z", "M0 0h24v24H0z"]
    }

    return "<svg fill='#FFFFFF' height='24' viewBox='" + svg[type][0] + "' width='24' xmlns='http://www.w3.org/2000/svg'> \
            <path d='" + svg[type][1] + "' /> \
            <path d='" + svg[type][2] + "' fill='none'/> \
        </svg>";

}

if (room_id != null) {
    get_live_status(room_id);
} else {
    console.log('bilibili-live-player: Get Room Id failed.');
}
