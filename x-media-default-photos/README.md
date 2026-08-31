# X Media Tab Default to Photos

X (Twitter) の Media タブ（`x.com/{user}/media`）は、2026年の仕様変更でデフォルトが「動画のみ」表示になりました。画像を見たいことの方が多いのに、毎回 Photos をクリックし直すのが面倒 — それを解消する Tampermonkey 用ユーザースクリプトです。

## これが解決すること

- ❌ 変更前: `/media` を開くたびに動画のみが表示され、毎回手動で Photos に切り替える必要がある
- ✅ 変更後: `/media` を開いた瞬間に自動で `?filter=photo` へ切り替わる

## 動作仕様

1. **`https://x.com/{user}/media`（フィルタなし）に着地した瞬間だけ** 自動で `?filter=photo` に書き換える
2. **一度そのユーザーの Media タブに入ったら、その滞在中は URL に一切干渉しない**
   - 例えば Photos → Videos に自分で明示的に切り替えたら、そのまま Videos 表示が維持される（勝手に Photos へ戻されない）
3. 別のユーザーの Media タブへ移動する、または Media タブ自体から離れて改めて入り直すと「新規の着地」とみなされ、再び 1. の自動切り替えが働く
4. 最初から `?filter=video` など明示的なフィルタ付きで開いた場合はそれを尊重し、何もしない

つまり「開いた瞬間だけ Photos に寄せる」「自分で選んだフィルタは絶対に上書きしない」という2点だけを守るスクリプトです。

`{user}` は任意のユーザー名（例: [`sczxsao`](https://x.com/sczxsao/media)）に対して動作します。

## インストール

1. [Tampermonkey](https://www.tampermonkey.net/) などのユーザースクリプトマネージャーをブラウザに導入
2. [`x-media-default-photos.user.js`](./x-media-default-photos.user.js) を開いてインストール
3. `x.com` / `twitter.com` のタブをリロード

`@match` はサイト全体（`x.com/*`）にしています。X は SPA のため、ホームやプロフィールから `/media` へクリック遷移する際にページ全体の再読み込みが発生せず、その遷移を JS 側で捕まえるにはスクリプトが常駐している必要があるためです（`/media` 系 URL だけに `@match` を絞ると、直接そのURLを開いた時にしか発火しません）。

## 既知の制限

- X 側のフロントエンド実装（React Router 的な仕組み）が `popstate` 以外の独自イベントで画面を更新している場合、URL は `?filter=photo` に戻っているのに表示だけ動画のままになるケースがあり得ます。そのような挙動を見つけた場合は Issue で操作手順を共有してください。

## ライセンス

[Apache License 2.0](../LICENSE)
