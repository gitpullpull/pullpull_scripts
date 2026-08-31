// ==UserScript==
// @name         X Media Tab Default to Photos
// @namespace    https://github.com/gitpullpull/pullpull_scripts
// @version      2.0.0
// @description  x.com/{user}/media を開いた時だけ自動で ?filter=photo にする。一度入ったら、その中で明示的にVideosへ切り替えてもフィルタは元に戻さない。
// @author       you
// @match        https://x.com/*
// @match        https://twitter.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // /{username}/media だけにマッチ（/media/tab や /status/... は無視）
  const MEDIA_PATH_RE = /^\/([^/]+)\/media\/?$/i;

  // 実在ユーザー名ではなくXのシステムパスなので除外
  const RESERVED = new Set([
    'i', 'home', 'search', 'explore', 'notifications', 'messages',
    'settings', 'compose', 'login', 'logout', 'signup'
  ]);

  function parseMediaState(href) {
    try {
      const url = new URL(href);
      const m = url.pathname.match(MEDIA_PATH_RE);
      if (!m) return null;
      const username = m[1];
      if (RESERVED.has(username.toLowerCase())) return null;
      return {
        username,
        filter: url.searchParams.get('filter'), // 'photo' / 'video' / null(=デフォルト)
      };
    } catch (e) {
      return null;
    }
  }

  function buildPhotoUrl(username) {
    const url = new URL(location.origin + '/' + encodeURIComponent(username) + '/media');
    url.searchParams.set('filter', 'photo');
    return url.toString();
  }

  // 「今どのユーザーのMediaタブに滞在中か」を覚えておく。
  // このセッション中は、URLがbare(/media)に変化しても一切干渉しない。
  let session = null; // { username } | null
  let redirecting = false;

  function applyPhotoRedirect(username) {
    redirecting = true;
    try {
      const target = buildPhotoUrl(username);
      history.replaceState(history.state, '', target);
      window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
    } finally {
      redirecting = false;
    }
  }

  function handleNavigation() {
    if (redirecting) return;

    const cur = parseMediaState(location.href);

    if (!cur) {
      // Mediaタブ以外に離脱 → セッション終了。次に入った時はまた自動判定する。
      session = null;
      return;
    }

    const enteringFresh = !session || session.username !== cur.username;

    if (enteringFresh) {
      session = { username: cur.username };
      if (!cur.filter) {
        // デフォルト(動画のみ)で着地した瞬間だけ、自動でPhotosに切り替える
        applyPhotoRedirect(cur.username);
      }
      // すでにfilter付きで入ってきた場合(例: 直接?filter=videoで開いた)は尊重してそのまま
      return;
    }

    // 同じユーザーのMediaタブ内での変化(ユーザー自身がPhotos/Videosを切り替えた等)。
    // ここでは何もしない = 明示的な切り替えを絶対に上書きしない。
  }

  // --- SPA遷移の検知 ---

  const origPushState = history.pushState;
  const origReplaceState = history.replaceState;

  history.pushState = function (...args) {
    const ret = origPushState.apply(this, args);
    if (!redirecting) queueMicrotask(handleNavigation);
    return ret;
  };

  history.replaceState = function (...args) {
    const ret = origReplaceState.apply(this, args);
    if (!redirecting) queueMicrotask(handleNavigation);
    return ret;
  };

  window.addEventListener('popstate', () => {
    if (!redirecting) queueMicrotask(handleNavigation);
  });

  // history APIを使わない書き換え対策の保険としてポーリングも併用
  let lastHref = location.href;
  setInterval(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      handleNavigation();
    }
  }, 400);

  // --- 初回ページロード時の処理 ---
  // Reactアプリの起動タイミングと競合してreplaceStateが上書きされることがあるため、
  // 初回ロード直後だけ何回かリトライする。
  function initialLoadCheck() {
    const cur = parseMediaState(location.href);
    if (cur && !session) {
      session = { username: cur.username };
      if (!cur.filter) {
        applyPhotoRedirect(cur.username);
      }
    }
  }

  initialLoadCheck();
  document.addEventListener('DOMContentLoaded', initialLoadCheck);
  [300, 800, 1500].forEach((delay) => {
    setTimeout(() => {
      // 起動直後のアプリ側の初期化で bare /media に戻されていないか再確認
      const cur = parseMediaState(location.href);
      if (cur && session && cur.username === session.username && !cur.filter) {
        applyPhotoRedirect(cur.username);
      }
    }, delay);
  });
})();
