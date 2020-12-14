/**
 * 
 * TextAlive App API を srcipt タグで使用した作品
 * 
 */

// import * as THREE from "three";
// import { Player, Ease } from "textalive-app-api";
const { Player, Ease } = TextAliveApp;

// Lyric クラス
class Lyric
{
    constructor (data) {
        this.text      = data.text;      // 歌詞文字
        this.startTime = data.startTime; // 開始タイム [ms]
        this.endTime   = data.endTime;   // 終了タイム [ms]
        this.duration  = data.duration;  // 開始から終了迄の時間 [ms]

        if (data.next && data.next.startTime - this.endTime < 500) this.endTime = data.next.startTime;
        else this.endTime += 500;
    }
}

// ThreeManager クラス
class ThreeManager
{
    constructor () {
        var w = document.documentElement.clientWidth;
        var h = document.documentElement.clientHeight;

        // Create a WebGL renderer
        var renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true // 背景透過
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(w, h);
        document.getElementById("view").appendChild(renderer.domElement);

        // Create Scene
        //var col   = 0x2A3132;
        var col   = 0x1E1E1E;
        var scene = new THREE.Scene();
        scene.background = new THREE.Color(col);

        // Create Camera
        var camera = new THREE.PerspectiveCamera(
            45, // 視野角
            w / h, // アスペクト比
            0.1, // near old:0.0001
            100 // far old:1000
        );

        this._renderer  = renderer;
        this._scene     = scene;
        this._camera    = camera;

        // パーティクルの表示
        this._drawParticle();
        
        // 歌詞表示用ボックスの生成
        this._color     = "#F0A038"; //#FFEE77; //#EE82EE;
        this._fillcolor = "#1E1E1E";;
        this._boxheight = 3;
        this._can = document.createElement("canvas");
        this._ctx = this._can.getContext("2d");
        var tex = this._tex = new THREE.Texture(this._can);
        var mat = this._mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide });
        var box = this._box = new THREE.Mesh(new THREE.BoxBufferGeometry(this._boxheight, this._boxheight, this._boxheight), mat);
        box.position.set(0, 0, 0);
        scene.add(box);     
        this._boxp = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]];
        var boxgroup = this._boxgroup = new THREE.Group();
        for (var i = 0; i < this._boxp.length; i++) {
            var boxt = new THREE.Mesh(new THREE.BoxBufferGeometry(this._boxheight / 10, this._boxheight / 10, this._boxheight / 10), mat);
            boxt.position.set(box.position.x + this._boxp[i][0], box.position.y + this._boxp[i][1], box.position.z + this._boxp[i][2]);
            boxgroup.add(boxt);
        }
        scene.add(boxgroup);
        this._drawFrame();

        // トンネルの生成
        var pathPoints = [
            [935,   0], [1287, 251], [1007, 341], [785, 801],
            [506, 369], [   0, 510], [  42, 138], [618, 203]
          ];
        var points = [];
        for (var i = 0; i < pathPoints.length; i++) {
          var x = pathPoints[i][0];
          var y = (Math.random() - 0.5) * 500;
          var z = pathPoints[i][1];
          points.push(new THREE.Vector3(x, y, z).multiplyScalar(0.1));
        }
        var curve = new THREE.CatmullRomCurve3(
            points, // 座標
            true, // true:閉じる
            "catmullrom", // タイプ
            0.6 // カーブ数
        );
        this._curve = curve;
        this._colors = [0x8664D4, 0x4DC2CC, 0x4D86CC];
        this._progress = 0;
        this._drawTube();
    }

    // 歌詞の更新
    setLyrics (lyrics) {
        this._lyrics = lyrics;
    }

    // 再生位置アップデート
    update (position) {
        this._position = position;
        if (! this._lyrics) return;

        // ボックスサイズをbeatに合わせて変更
        if (beat) {
            var beatprog = beat.progress(position);
            var beatheight = this._boxheight + Ease.sineIn(beatprog) * 0.5;
            this._boxgroup.scale.set(beatheight, beatheight, beatheight);
        } else {
            this._boxgroup.scale.set(this._boxheight, this._boxheight, this._boxheight);
        }

        // 外枠を残してキャンバスをクリア
        this._ctx.clearRect(8, 8, this._can.width - 16, this._can.height - 16);
        this._ctx.fillStyle = this._fillcolor;
        this._ctx.fillRect(8, 8, this._can.width - 16, this._can.height - 16);

        // 歌詞の描画
        var tk = "";
        var flg = false;
        for (var i = 0, l = this._lyrics.length; i < l; i++) {
            var lyric = this._lyrics[i];
            // 開始タイム < 再生位置 && 再生位置 < 終了タイム
            if (lyric.startTime <= position && position < lyric.endTime) {
                // 開始タイム or 終了タイムがサビか
                chorus = player.findChorus(lyric.startTime + 500);
                if (!chorus) chorus = player.findChorus(lyric.endTime - 500);
                this._setChorus(chorus);
                // 歌詞の描画
                var progress = this._easeOutBack(Math.min((position - lyric.startTime) / Math.min(lyric.endTime - lyric.startTime, 200), 1));
                tk = lyric.text + progress;
                if (this._tk != tk) this._drawText(lyric.text, progress);
                flg = true;
                break;
            }
        }
        if (!flg) {
            chorus = player.findChorus(position);
            if (!chorus) chorus = player.findChorus(position + 300);
            this._setChorus(chorus);
        }

        // テクスチャの更新
        if (this._tk != tk) this._tex.needsUpdate = true;
        this._tk = tk;

        // トンネル（チューブ）カメラの更新
        var p1 = this._curve.getPointAt((position / 20000) % 1);
        this._camera.position.set(p1.x, p1.y, p1.z);

        // ボックスの更新・回転
        var p2 = this._curve.getPointAt(((position + 1000) / 20000) % 1);
        this._camera.lookAt(p2.x, p2.y, p2.z);

        this._box.position.set(p2.x, p2.y, p2.z);
        this._box.rotation.set(position / 1234, position / 2345, position / 3456);
        this._boxgroup.position.set(p2.x, p2.y, p2.z);
        this._boxgroup.rotation.set(position / 1234, position / 2345, position / 3456);
      
        this._renderer.render(this._scene, this._camera);
    }
    // リサイズ
    resize () {
        var stw = this._stw = document.documentElement.clientWidth;
        var sth = this._sth = document.documentElement.clientHeight;
        
        this._camera.aspect = stw / sth;
        this._camera.updateProjectionMatrix();

        this._renderer.setSize(stw, sth);
    }
    
    // パーティクルの描画
    _drawParticle () {
        var geometry = new THREE.Geometry();
        var parsize  = 1000; // 範囲
        var parlen   = 50000; // 個数
        for (var i = 0; i < parlen; i++) {
            geometry.vertices.push(
                new THREE.Vector3(
                    parsize * (Math.random() - 0.5),
                    parsize * (Math.random() - 0.5),
                    parsize * (Math.random() - 0.5)
                )
            );
        }
        var material = new THREE.PointsMaterial({
            color:  0xFFFFCC, // 0xA9CEEC,
            size: 0.5
        });
        var mesh = new THREE.Points(geometry, material);
        this._scene.add(mesh);
        this._mesh = mesh;
    }

    // トンネル（チューブ）の描画
    _drawTube() {
        for (var i = 0; i < this._colors.length; i++) {
            var geometry = new THREE.TubeBufferGeometry(
                this._curve, // パスのカーブ
                100, // パス方向の分割数
                (i*2) + 4, // 管の幅
                10, // 管の断面円の分割数
                true // true:終点-始点を閉じる
            );
            var material = new THREE.MeshBasicMaterial({
                color: this._colors[i], // 色
                transparent: true, // 透明の表示許可
                wireframe: true, // ワイヤーフレーム
                //wireframeLinewidth: 10, // ワイヤーフレームの幅
                opacity: ((1- i/5)*0.5 + 0.1) // 不透明度
            });
    
            var tube = new THREE.Mesh(geometry, material);
            this._scene.add(tube);

            // 最後に描画した情報を取得
            this._tube = tube;
            this._tubecol = this._colors[i];
        }
    }
    
    // 外枠（ワイヤーフレーム）の描画
    _drawFrame () {
        var can = this._can;
        var ctx = this._ctx;

        can.width = can.height = 512;

        ctx.strokeStyle = this._color;
        ctx.lineWidth = 20;
        ctx.rect(0, 0, can.width, can.height);
        ctx.stroke();
        this._tex.needsUpdate = true;
    }

    // 文字の描画
    _drawText (text, progress) {
        var can = this._can;
        var ctx = this._ctx;

        var size = can.width;
        var fontSize = size * 0.5 * progress;
        ctx.textAlign = "center";
        ctx.fillStyle = this._color;
        ctx.font = "bold " + fontSize + "px sans-serif";

        ctx.fillText(text, size/2, size/2 + fontSize * 0.37);
    }

    // サビ情報に応じた色のセット
    _setChorus (chorus) {
        // サビ情報の取得・色の設定
        var chocol = 0x4D86CC;
        var frmcol = 0xF8DA64; // 0xF0A038;
        var boxcol = "#F8DA64";
        if (chorus) {
            chocol = 0xEE82EE;
            frmcol = 0x5DFFEE;// 0x00FFCE;
            boxcol = "#5DFFEE"; // "#00FFCE";
        }

        // トンネル（チューブ）色をchorusに合わせて変更
        if (this._tubecol != chocol) {
            this._tube.material.color.setHex(chocol);
            this._box.material.color.setHex(frmcol);
            this._tubecol = chocol;
            this._color = boxcol;
        }     
    }            
   
    _easeOutBack (x) { return 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2); }
}

// ThreeManager を初期化
var threeMng = new ThreeManager();

// TextAlive Player を初期化
const player = new Player({
    app: true,
    mediaElement: document.querySelector("#media")
  
    // オプション一覧
    // https://developer.textalive.jp/packages/textalive-app-api/interfaces/playeroptions.html
});

const overlay = document.querySelector("#overlay");
let position, updateTime, beat, chorus;

player.addListener({
    /* APIの準備ができたら呼ばれる */
    onAppReady(app) {
        if (app.managed) {
            document.querySelector("#control").className = "disabled";
        } else {
            // グリーンライツ・セレナーデ / Omoi feat. 初音ミク
            // - 初音ミク「マジカルミライ 2018」テーマソング
            // - 楽曲: http://www.youtube.com/watch?v=XSLhsjepelI
            // - 歌詞: https://piapro.jp/t/61Y2
            player.createFromSongUrl("http://www.youtube.com/watch?v=XSLhsjepelI", {
                video: {
                // 音楽地図訂正履歴: https://songle.jp/songs/1249410/history
                beatId: 3818919,
                chordId: 1207328,
                repetitiveSegmentId: 1942131,
                // 歌詞タイミング訂正履歴: https://textalive.jp/lyrics/www.youtube.com%2Fwatch%3Fv%3DXSLhsjepelI
                lyricId: 50145,
                lyricDiffId: 3168
                }
            });
            
            // ブレス・ユア・ブレス / 和田たけあき feat. 初音ミク
            // - 初音ミク「マジカルミライ 2019」テーマソング
            // - 楽曲: http://www.youtube.com/watch?v=a-Nf3QUFkOU
            // - 歌詞: https://piapro.jp/t/Ytwu
            // player.createFromSongUrl("http://www.youtube.com/watch?v=a-Nf3QUFkOU", {
            //   video: {
            //     // 音楽地図訂正履歴: https://songle.jp/songs/1688650/history
            //     beatId: 3818481,
            //     chordId: 1546157,
            //     repetitiveSegmentId: 1942135,
            //     // 歌詞タイミング訂正履歴: https://textalive.jp/lyrics/www.youtube.com%2Fwatch%3Fv=a-Nf3QUFkOU
            //     lyricId: 50146,
            //     lyricDiffId: 3143
            //   }
            // });
            
            // 愛されなくても君がいる / ピノキオピー feat. 初音ミク
            // - 初音ミク「マジカルミライ 2020」テーマソング
            // - 楽曲: http://www.youtube.com/watch?v=ygY2qObZv24
            // - 歌詞: https://piapro.jp/t/PLR7
            // player.createFromSongUrl("http://www.youtube.com/watch?v=ygY2qObZv24", {
            //   video: {
            //     // 音楽地図訂正履歴: https://songle.jp/songs/1977449/history
            //     beatId: 3818852,
            //     chordId: 1955797,
            //     repetitiveSegmentId: 1942043,
            //     // 歌詞タイミング訂正履歴: https://textalive.jp/lyrics/www.youtube.com%2Fwatch%3Fv=ygY2qObZv24
            //     lyricId: 50150,
            //     lyricDiffId: 3158
            //   }
            // });
        }
        // 画面クリックで再生／一時停止
        document.getElementById("view").addEventListener("click", () => function(p){ 
            if (p.isPlaying) {
                p.requestPause()
            } else {
                p.requestPlay()
            }
        }(player));
    },
  
    /* 楽曲が変わったら呼ばれる */
    onAppMediaChange() {
        // 画面表示をリセット
        overlay.className = "";
    },

    /* 楽曲情報が取れたら呼ばれる */
    onVideoReady(video) {
        // 楽曲情報を表示
        document.querySelector("#artist span").textContent = player.data.song.artist.name;
        document.querySelector("#song span").textContent = player.data.song.name;

        //　歌詞付き楽曲の場合
        var lyrics = [];
        if (video.firstChar) {
            var c = video.firstChar; // 文字単位
            while (c) {
                lyrics.push(new Lyric(c));
                c = c.next;
            }
        }
        threeMng.setLyrics(lyrics);
    },

    /* 再生コントロールができるようになったら呼ばれる */
    onTimerReady() {
        overlay.className = "disabled";
        document.querySelector("#control > a#play").className = "";
        document.querySelector("#control > a#stop").className = "";
    },

    /* 再生位置の情報が更新されたら呼ばれる */
    onTimeUpdate(pos) {
        position = pos
        updateTime = Date.now();
        beat = player.findBeat(position);

        threeMng.update(pos);
    },

    /* 楽曲の再生が始まったら呼ばれる */
    onPlay() {
        const a = document.querySelector("#control > a#play");
        while (a.firstChild) a.removeChild(a.firstChild);
        a.appendChild(document.createTextNode("\uf28b"));
    },

    /* 楽曲の再生が止まったら呼ばれる */
    onPause() {
        const a = document.querySelector("#control > a#play");
        while (a.firstChild) a.removeChild(a.firstChild);
        a.appendChild(document.createTextNode("\uf144"));
    }
});

/* 再生・一時停止ボタン */
document.querySelector("#control > a#play").addEventListener("click", (e) => {
    e.preventDefault();
    if (player) {
        if (player.isPlaying) {
            player.requestPause();
        } else {
            player.requestPlay();
        }
    }
    return false;
});

/* 画面リサイズ */
window.addEventListener("resize", () => threeMng.resize());

/* 描画アップデート */
drawAnimation();

/* 停止ボタン */
document.querySelector("#control > a#stop").addEventListener("click", (e) => {
    e.preventDefault();
    if (player) {
        player.requestStop();
    }
    return false;
});        

/**
 * 画面描画
 * Request AnimationFrame
 */
function drawAnimation() {
    if (player.isPlaying && 0 <= updateTime && 0 <= position)
    {
        var t = (Date.now() - updateTime) + position;
        threeMng.update(t);
    }
    // フレーム更新処理後に呼ばれる
    window.requestAnimationFrame(() => drawAnimation());
}
