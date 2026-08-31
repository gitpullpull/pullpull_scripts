# X Media Tab Default to Photos

`x.com/{user}/media` を開いたとき、デフォルトの `?filter=video` ではなく自動で `?filter=photo` に切り替えるユーザースクリプトです。

一度 Media タブに入った後、その場で明示的に Videos タブへ切り替えた場合はそのままにし、勝手に Photos へ戻したりはしません（別のユーザーの Media タブに移動すると、再びそのユーザーに対して自動判定が働きます）。

## インストール

1. [Tampermonkey](https://www.tampermonkey.net/) などのユーザースクリプトマネージャーをブラウザに導入
2. [`x-media-default-photos.user.js`](./x-media-default-photos.user.js) を開いてインストール

## ライセンス

[Apache License 2.0](../LICENSE)
