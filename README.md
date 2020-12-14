# TextAlive App API  | Infinite Cyber Tunnel

## 動画の実行

こちらから実行することが出来ます。

https://calcrobot.github.io/infinite-cyber-tunnel/

## 概要

サイバー空間のトンネルをボックスが疾走します。

ビートに合わせてボックスが弾みながら、歌詞を表現します。
サビ部分は配色を変更し、盛り上がりを表現しています。

![sample](screenshots/textalive-app-tunnel.gif)

再生・一時停止ボタンまたは画面上のクリックで再生・一時停止されます。

停止する場合は、停止ボタンをクリックします。

## 開発

ビルドツールを何も使わず `script` タグで API を読み込んでいます。
```sh
<script src="https://unpkg.com/axios/dist/axios.min.js"></script>
<script src="https://unpkg.com/textalive-app-api/dist/index.js"></script>
<script>
  const { Player } = TextAliveApp;
</script>
```

[Node.js](https://nodejs.org/) をインストールしている環境で以下のコマンドを実行すると、開発用サーバが起動します。

```sh
npx http-server .
```

## ビルド

ビルドツールは不要です。

このリポジトリ直下のファイルで実行されます。

## TextAlive App API

![TextAlive](https://i.gyazo.com/thumb/1000/5301e6f642d255c5cfff98e049b6d1f3-png.png)

TextAlive App API は、音楽に合わせてタイミングよく歌詞が動くWebアプリケーション（リリックアプリ）を開発できるJavaScript用のライブラリです。

TextAlive App API について詳しくはWebサイト [TextAlive for Developers](https://developer.textalive.jp/) をご覧ください。


---
