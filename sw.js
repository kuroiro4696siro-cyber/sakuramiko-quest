/**
 * みこクエスト - Service Worker
 * PWAオフラインキャッシュ
 */

const CACHE_NAME = 'mikoquest-v1.8';

// sw.jsと同じディレクトリを起点とした相対パスでキャッシュ
// これにより /sakuramiko-quest/ などサブディレクトリ配置でも動作する
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  // アイコン
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  // 背景（PC用・スマホ用）
  './assets/background/background.png',
  './assets/background/background01.png',
  // エフェクト（桜の花びら3種）
  './assets/effects/quest-clear-stamp.png',
  './assets/effects/sakura-petal.png',
  './assets/effects/sakura-petal01.png',
  './assets/effects/sakura-petal02.png',
  // キャラクター（9種）
  './assets/characters/character-default.png',
  './assets/characters/character-alt1.png',
  './assets/characters/character-alt2.png',
  './assets/characters/character-alt3.png',
  './assets/characters/character-alt4.png',
  './assets/characters/character-alt5.png',
  './assets/characters/character-alt6.png',
  './assets/characters/character-alt7.png',
  './assets/characters/character-alt8.png',
  // BGM・SE
  './assets/audio/main-bgm.mp3',
  './assets/audio/quest-clear.mp3',
  './assets/audio/subquest-clear.mp3',
  './assets/audio/level-up.mp3',
  // キャラボイス（16種）
  './assets/audio/character/voice01.mp3',
  './assets/audio/character/voice02.mp3',
  './assets/audio/character/voice03.mp3',
  './assets/audio/character/voice04.mp3',
  './assets/audio/character/voice05.mp3',
  './assets/audio/character/voice06.mp3',
  './assets/audio/character/voice07.mp3',
  './assets/audio/character/voice08.mp3',
  './assets/audio/character/voice09.mp3',
  './assets/audio/character/voice10.mp3',
  './assets/audio/character/voice11.mp3',
  './assets/audio/character/voice12.mp3',
  './assets/audio/character/voice13.mp3',
  './assets/audio/character/voice14.mp3',
  './assets/audio/character/voice15.mp3',
  './assets/audio/character/voice16.mp3'
];

// インストール
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // 各アセットを個別にキャッシュ（失敗しても続行）
      return Promise.allSettled(
        ASSETS.map(asset =>
          cache.add(asset).catch((err) => {
            console.warn(`[SW] キャッシュ失敗: ${asset}`, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// アクティベート（古いキャッシュ削除）
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// フェッチ（キャッシュ優先）
self.addEventListener('fetch', (e) => {
  // POST等は無視
  if (e.request.method !== 'GET') return;

  // chrome-extension等は無視
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;

      return fetch(e.request).then((response) => {
        // 有効なレスポンスをキャッシュに追加
        if (response && response.status === 200 && response.type !== 'opaque') {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, cloned);
          });
        }
        return response;
      }).catch(() => {
        // オフラインフォールバック（HTMLリクエストの場合）
        if (e.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
