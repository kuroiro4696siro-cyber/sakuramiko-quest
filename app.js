/**
 * みこクエスト - メインアプリケーション
 * Quest Management PWA - v1.1
 */

'use strict';

// =============================================
// DB Manager (IndexedDB)
// =============================================
const DB = (() => {
  const DB_NAME = 'MikoQuestDB';
  const DB_VERSION = 1;
  let db = null;

  const STORES = {
    QUESTS: 'quests',
    PROFILE: 'profile',
    HISTORY: 'history'
  };

  async function open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains(STORES.QUESTS)) {
          d.createObjectStore(STORES.QUESTS, { keyPath: 'id' });
        }
        if (!d.objectStoreNames.contains(STORES.PROFILE)) {
          d.createObjectStore(STORES.PROFILE, { keyPath: 'key' });
        }
        if (!d.objectStoreNames.contains(STORES.HISTORY)) {
          const hs = d.createObjectStore(STORES.HISTORY, { keyPath: 'id', autoIncrement: true });
          hs.createIndex('timestamp', 'timestamp');
        }
      };
      req.onsuccess = (e) => { db = e.target.result; resolve(db); };
      req.onerror = () => reject(req.error);
    });
  }

  function tx(store, mode = 'readonly') {
    return db.transaction(store, mode).objectStore(store);
  }

  async function getAll(store) {
    return new Promise((resolve, reject) => {
      const req = tx(store).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function get(store, key) {
    return new Promise((resolve, reject) => {
      const req = tx(store).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function put(store, value) {
    return new Promise((resolve, reject) => {
      const req = tx(store, 'readwrite').put(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function del(store, key) {
    return new Promise((resolve, reject) => {
      const req = tx(store, 'readwrite').delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function clear(store) {
    return new Promise((resolve, reject) => {
      const req = tx(store, 'readwrite').clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  return { open, getAll, get, put, del, clear, STORES };
})();

// =============================================
// Sound Manager
// =============================================
const Sound = (() => {
  const elements = {
    bgm: document.getElementById('audioBgm'),
    questClear: document.getElementById('audioQuestClear'),
    subClear: document.getElementById('audioSubClear'),
    levelUp: document.getElementById('audioLevelUp'),
    voice: document.getElementById('audioVoice')
  };

  // 相対パス: index.htmlからの相対で解決されるため、サブディレクトリ配置でも動作する
  const BASE = (() => {
    const s = document.currentScript ? document.currentScript.src : '';
    return s ? s.replace(/\/[^/]*$/, '/') : './';
  })();
  const SRC = {
    bgm: BASE + 'assets/audio/main-bgm.mp3',
    questClear: BASE + 'assets/audio/quest-clear.mp3',
    subClear: BASE + 'assets/audio/subquest-clear.mp3',
    levelUp: BASE + 'assets/audio/level-up.mp3',
    voices: [
      BASE + 'assets/audio/character/voice01.mp3',
      BASE + 'assets/audio/character/voice02.mp3',
      BASE + 'assets/audio/character/voice03.mp3',
      BASE + 'assets/audio/character/voice04.mp3',
      BASE + 'assets/audio/character/voice05.mp3',
      BASE + 'assets/audio/character/voice06.mp3',
      BASE + 'assets/audio/character/voice07.mp3',
      BASE + 'assets/audio/character/voice08.mp3',
      BASE + 'assets/audio/character/voice09.mp3',
      BASE + 'assets/audio/character/voice10.mp3',
      BASE + 'assets/audio/character/voice11.mp3',
      BASE + 'assets/audio/character/voice12.mp3',
      BASE + 'assets/audio/character/voice13.mp3',
      BASE + 'assets/audio/character/voice14.mp3',
      BASE + 'assets/audio/character/voice15.mp3',
      BASE + 'assets/audio/character/voice16.mp3'
    ]
  };

  let settings = {
    bgmOn: false,
    seOn: true,
    bgmVol: 0.5,
    questClearVol: 0.8,
    subClearVol: 0.7,
    levelUpVol: 0.9,
    voiceVol: 0.8
  };

  let lastVoiceIdx = -1;
  let isPlaying = false;
  let userInteracted = false;

  function loadSettings() {
    try {
      const saved = localStorage.getItem('mikoquest_sound');
      if (saved) settings = { ...settings, ...JSON.parse(saved) };
    } catch (e) {}
  }

  function saveSettings() {
    localStorage.setItem('mikoquest_sound', JSON.stringify(settings));
  }

  function initBgm() {
    elements.bgm.src = SRC.bgm;
    elements.bgm.volume = settings.bgmVol;
    elements.bgm.loop = true;
  }

  function onUserInteract() {
    if (userInteracted) return;
    userInteracted = true;
    initBgm();
    if (settings.bgmOn) playBgm();
    document.removeEventListener('click', onUserInteract);
    document.removeEventListener('touchstart', onUserInteract);
  }

  function playBgm() {
    if (!userInteracted) return;
    elements.bgm.volume = settings.bgmVol;
    elements.bgm.play().catch(() => {});
  }

  function stopBgm() {
    elements.bgm.pause();
  }

  function playSE(el, src, vol) {
    if (!settings.seOn) return;
    el.src = src;
    el.volume = vol;
    el.currentTime = 0;
    el.play().catch(() => {});
  }

  function playQuestClear() { playSE(elements.questClear, SRC.questClear, settings.questClearVol); }
  function playSubClear() { playSE(elements.subClear, SRC.subClear, settings.subClearVol); }
  function playLevelUp() { playSE(elements.levelUp, SRC.levelUp, settings.levelUpVol); }

  function playVoice() {
    if (!settings.seOn) return;
    if (isPlaying) return;
    let idx;
    do { idx = Math.floor(Math.random() * SRC.voices.length); }
    while (idx === lastVoiceIdx && SRC.voices.length > 1);
    lastVoiceIdx = idx;
    isPlaying = true;
    elements.voice.src = SRC.voices[idx];
    elements.voice.volume = settings.voiceVol;
    elements.voice.currentTime = 0;
    elements.voice.play().catch(() => {});
    elements.voice.onended = () => { isPlaying = false; };
  }

  function applySettings(s) {
    settings = { ...settings, ...s };
    saveSettings();
    elements.bgm.volume = settings.bgmVol;
    if (settings.bgmOn) { if (userInteracted) playBgm(); }
    else stopBgm();
  }

  function getSettings() { return { ...settings }; }

  return { loadSettings, saveSettings, onUserInteract, playBgm, stopBgm,
           playQuestClear, playSubClear, playLevelUp, playVoice, applySettings, getSettings };
})();

// =============================================
// EXP / Level System
// =============================================
const ExpSystem = {
  calcNextExp(level) {
    return 100 + (level - 1) * 50;
  },

  addExp(profile, amount) {
    let { level, exp, totalExp } = profile;
    exp += amount;
    totalExp += amount;
    let leveledUp = false;
    const levelUpData = [];
    let nextExp = this.calcNextExp(level);
    while (exp >= nextExp) {
      exp -= nextExp;
      level++;
      leveledUp = true;
      levelUpData.push(level);
      nextExp = this.calcNextExp(level);
    }
    return { level, exp, totalExp, leveledUp, levelUpData };
  }
};

// =============================================
// Profile Manager
// =============================================
const Profile = (() => {
  const KEY = 'user_profile';
  let data = { key: KEY, level: 1, exp: 0, totalExp: 0, clearedQuests: 0 };

  async function load() {
    const saved = await DB.get(DB.STORES.PROFILE, KEY);
    if (saved) data = saved;
    return data;
  }

  async function save() {
    await DB.put(DB.STORES.PROFILE, data);
  }

  async function addExp(amount) {
    const result = ExpSystem.addExp(data, amount);
    data.level = result.level;
    data.exp = result.exp;
    data.totalExp = result.totalExp;
    await save();
    return result;
  }

  async function incrementCleared() {
    data.clearedQuests = (data.clearedQuests || 0) + 1;
    await save();
  }

  function get() { return { ...data }; }

  return { load, save, addExp, incrementCleared, get };
})();

// =============================================
// Quest Manager
// =============================================
const QuestManager = (() => {
  let quests = [];

  async function loadAll() {
    quests = await DB.getAll(DB.STORES.QUESTS);
    quests.sort((a, b) => b.createdAt - a.createdAt);
    return quests;
  }

  async function add(questData) {
    const quest = {
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      title: questData.title,
      deadline: questData.deadline || null,
      status: 'active',
      exp: questData.exp || 50,
      subquests: (questData.subquests || []).map((sq, i) => ({
        id: `sq_${Date.now()}_${i}`,
        title: sq.title,
        exp: sq.exp || 10,
        status: 'active'
      })),
      clearMemo: '',
      createdAt: Date.now(),
      clearedAt: null
    };
    await DB.put(DB.STORES.QUESTS, quest);
    quests.unshift(quest);
    return quest;
  }

  async function update(quest) {
    await DB.put(DB.STORES.QUESTS, quest);
    const idx = quests.findIndex(q => q.id === quest.id);
    if (idx >= 0) quests[idx] = quest;
    return quest;
  }

  async function remove(id) {
    await DB.del(DB.STORES.QUESTS, id);
    quests = quests.filter(q => q.id !== id);
  }

  async function completeSubquest(questId, subquestId) {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return null;
    const sq = quest.subquests.find(s => s.id === subquestId);
    if (!sq || sq.status === 'cleared') return null;
    sq.status = 'cleared';
    await DB.put(DB.STORES.QUESTS, quest);
    return { quest, subquest: sq };
  }

  async function completeQuest(questId) {
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.status === 'cleared') return null;
    quest.status = 'cleared';
    quest.clearedAt = Date.now();
    await DB.put(DB.STORES.QUESTS, quest);
    return quest;
  }

  function getAll() { return [...quests]; }
  function getById(id) { return quests.find(q => q.id === id) || null; }

  function isCompletable(quest) {
    if (quest.status === 'cleared') return false;
    if (quest.subquests.length === 0) return true;
    return quest.subquests.every(sq => sq.status === 'cleared');
  }

  function getSubquestProgress(quest) {
    if (!quest.subquests.length) return null;
    const done = quest.subquests.filter(sq => sq.status === 'cleared').length;
    return { done, total: quest.subquests.length };
  }

  async function clearAll() {
    await DB.clear(DB.STORES.QUESTS);
    quests = [];
  }

  return { loadAll, add, update, remove, completeSubquest, completeQuest,
           getAll, getById, isCompletable, getSubquestProgress, clearAll };
})();

// =============================================
// Sakura Effect
// =============================================
const SakuraEffect = {
  // 花びら画像3種（sakura-petal.png / sakura-petal01.png / sakura-petal02.png）
  PETAL_IMAGES: [
    'assets/effects/sakura-petal.png',
    'assets/effects/sakura-petal01.png',
    'assets/effects/sakura-petal02.png'
  ],

  createPetal(container) {
    const petal = document.createElement('div');
    petal.className = 'sakura-petal';
    const size = 10 + Math.random() * 18;
    // 3種の画像からランダムに選択
    const imgSrc = this.PETAL_IMAGES[Math.floor(Math.random() * this.PETAL_IMAGES.length)];
    const rotate = Math.random() * 360;
    petal.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 105}%;
      animation-duration:${5 + Math.random() * 7}s;
      animation-delay:${Math.random() * 2}s;
      opacity:${0.5 + Math.random() * 0.5};
      background-image: url('${imgSrc}');
      background-size: contain;
      background-repeat: no-repeat;
      background-color: transparent;
      transform: rotate(${rotate}deg);
    `;
    container.appendChild(petal);
    setTimeout(() => petal.remove(), 12000);
  },

  startAmbient() {
    const container = document.getElementById('sakuraContainer');
    setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.createPetal(container);
      }
    }, 600);
  },

  burst(container, count = 20) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => this.createPetal(container), i * 80);
    }
  }
};

// =============================================
// UI Manager
// =============================================
const UI = (() => {
  const screens = {
    home: document.getElementById('screenHome'),
    detail: document.getElementById('screenDetail'),
    settings: document.getElementById('screenSettings')
  };
  let currentScreen = 'home';
  let currentQuestId = null;
  let editMode = false;
  let pendingSubquests = [];

  // --- 画面切り替え ---
  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
    currentScreen = name;
    screens[name].scrollTop = 0;
  }

  // --- プロフィールUI更新 ---
  function updateProfileBar() {
    const p = Profile.get();
    document.getElementById('profileLevel').textContent = p.level;
    document.getElementById('profileExpCurrent').textContent = p.exp;
    const nextExp = ExpSystem.calcNextExp(p.level);
    document.getElementById('profileExpNext').textContent = nextExp;
    const pct = Math.min((p.exp / nextExp) * 100, 100);
    document.getElementById('profileExpBar').style.width = `${pct}%`;
    // 設定画面の統計
    document.getElementById('statLevel').textContent = p.level;
    document.getElementById('statTotalExp').textContent = p.totalExp;
    document.getElementById('statClearedQuests').textContent = p.clearedQuests || 0;
  }

  // --- クエスト一覧レンダリング ---
  function renderQuestList() {
    const list = document.getElementById('questList');
    const empty = document.getElementById('emptyState');
    const quests = QuestManager.getAll();
    list.innerHTML = '';

    if (quests.length === 0) {
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    // アクティブ優先で並べ替え
    const sorted = [...quests].sort((a, b) => {
      if (a.status === b.status) return b.createdAt - a.createdAt;
      return a.status === 'cleared' ? 1 : -1;
    });

    sorted.forEach((q, i) => {
      const card = createQuestCard(q);
      card.style.animationDelay = `${i * 0.05}s`;
      list.appendChild(card);
    });
  }

  function createQuestCard(q) {
    const card = document.createElement('div');
    card.className = `quest-card ${q.status === 'cleared' ? 'cleared' : ''}`;
    card.dataset.id = q.id;

    const progress = QuestManager.getSubquestProgress(q);
    let deadlineHtml = '';
    if (q.deadline) {
      const dl = new Date(q.deadline);
      const today = new Date(); today.setHours(0,0,0,0);
      const isOverdue = dl < today && q.status !== 'cleared';
      const dlStr = `${dl.getMonth()+1}/${dl.getDate()}`;
      deadlineHtml = `<span class="quest-deadline ${isOverdue ? 'overdue' : ''}">📅 ${dlStr}</span>`;
    }

    const progressStr = progress ? `📋 ${progress.done}/${progress.total}` : '';

    card.innerHTML = `
      <div class="quest-card-top">
        <div class="quest-card-title">${escapeHtml(q.title)}</div>
        <span class="quest-status-badge ${q.status === 'cleared' ? 'status-cleared' : 'status-active'}">
          ${q.status === 'cleared' ? '✨ CLEAR' : '⚔️ 進行中'}
        </span>
      </div>
      <div class="quest-card-meta">
        ${deadlineHtml}
        ${progressStr ? `<span>${progressStr}</span>` : ''}
        <span>⭐ ${q.exp} EXP</span>
      </div>
      ${progress ? `
        <div class="quest-progress-bar-wrap">
          <div class="quest-progress-bar" style="width:${(progress.done/progress.total)*100}%"></div>
        </div>
      ` : ''}
    `;

    card.addEventListener('click', () => openDetail(q.id));
    return card;
  }

  // --- クエスト詳細 ---
  function openDetail(questId) {
    currentQuestId = questId;
    const q = QuestManager.getById(questId);
    if (!q) return;
    renderDetail(q);
    showScreen('detail');
  }

  function renderDetail(q) {
    const container = document.getElementById('detailCard');
    const canComplete = QuestManager.isCompletable(q);

    let deadlineHtml = '';
    if (q.deadline) {
      const dl = new Date(q.deadline);
      deadlineHtml = `<span class="detail-badge">📅 ${dl.getFullYear()}/${dl.getMonth()+1}/${dl.getDate()}</span>`;
    }

    let subquestHtml = '';
    if (q.subquests.length > 0) {
      const items = q.subquests.map(sq => `
        <div class="subquest-item ${sq.status === 'cleared' ? 'done' : ''}"
             data-sq-id="${sq.id}" ${q.status === 'cleared' ? '' : ''}>
          <div class="subquest-check">
            <span class="subquest-check-icon">✓</span>
          </div>
          <span class="subquest-name">${escapeHtml(sq.title)}</span>
          <span class="subquest-exp">+${sq.exp} EXP</span>
        </div>
      `).join('');
      subquestHtml = `
        <div class="detail-section-title">サブクエスト</div>
        <div class="subquest-list" id="subquestListDetail">${items}</div>
      `;
    }

    container.innerHTML = `
      <div class="detail-title">${escapeHtml(q.title)}</div>
      <div class="detail-meta">
        <span class="detail-badge">${q.status === 'cleared' ? '✨ クリア済み' : '⚔️ 進行中'}</span>
        ${deadlineHtml}
        <span class="detail-badge">⭐ ${q.exp} EXP</span>
      </div>
      ${subquestHtml}
      <div class="detail-actions">
        <button class="complete-quest-btn" id="completeQuestBtn"
          ${(q.status === 'cleared' || !canComplete) ? 'disabled' : ''}>
          ${q.status === 'cleared' ? '✨ クリア済み' : (canComplete ? '🎉 クエスト達成！' : `サブクエストを完了してください (${q.subquests.filter(s=>s.status==='cleared').length}/${q.subquests.length})`)}
        </button>
        <button class="edit-quest-btn" id="editQuestBtn">✏️ 編集</button>
        <button class="delete-quest-btn" id="deleteQuestBtn">🗑️ 削除</button>
      </div>
    `;

    // サブクエストクリックイベント
    const sqList = document.getElementById('subquestListDetail');
    if (sqList) {
      sqList.querySelectorAll('.subquest-item').forEach(item => {
        item.addEventListener('click', () => {
          if (q.status === 'cleared') return;
          const sqId = item.dataset.sqId;
          handleSubquestComplete(q.id, sqId);
        });
      });
    }

    document.getElementById('completeQuestBtn')?.addEventListener('click', () => {
      handleQuestComplete(q.id);
    });
    document.getElementById('editQuestBtn')?.addEventListener('click', () => openEditModal(q.id));
    document.getElementById('deleteQuestBtn')?.addEventListener('click', () => confirmDeleteQuest(q.id));
  }

  // --- サブクエスト達成処理 ---
  async function handleSubquestComplete(questId, subquestId) {
    const result = await QuestManager.completeSubquest(questId, subquestId);
    if (!result) return;

    Sound.playSubClear();
    showToast(`+${result.subquest.exp} EXP ✨`);

    const expResult = await Profile.addExp(result.subquest.exp);
    updateProfileBar();

    // ローカルquestオブジェクトを更新
    const q = QuestManager.getById(questId);

    // UIを再レンダリング
    renderDetail(q);
    renderQuestList();

    // レベルアップチェック
    if (expResult.leveledUp) {
      for (const newLevel of expResult.levelUpData) {
        await sleep(300);
        showLevelUpOverlay(newLevel);
      }
    }
  }

  // --- クエスト達成処理 ---
  async function handleQuestComplete(questId) {
    const q = QuestManager.getById(questId);
    if (!q || !QuestManager.isCompletable(q)) return;

    await QuestManager.completeQuest(questId);
    await Profile.incrementCleared();
    updateProfileBar();
    renderQuestList();

    const updatedQ = QuestManager.getById(questId);
    renderDetail(updatedQ);

    // クリア演出
    showClearOverlay(q.exp);
    Sound.playQuestClear();

    // EXP加算
    const expResult = await Profile.addExp(q.exp);
    updateProfileBar();

    // レベルアップ演出
    await sleep(2500);
    hideClearOverlay();

    if (expResult.leveledUp) {
      for (const newLevel of expResult.levelUpData) {
        await sleep(200);
        showLevelUpOverlay(newLevel);
      }
    }
  }

  // --- クリア演出 ---
  function showClearOverlay(expAmount) {
    const overlay = document.getElementById('clearOverlay');
    document.getElementById('clearExpGain').textContent = `+${expAmount} EXP`;
    document.getElementById('clearStampFallback').style.display = 'none';
    overlay.classList.add('active');
    SakuraEffect.burst(document.getElementById('clearSakuraContainer'), 30);
  }

  function hideClearOverlay() {
    document.getElementById('clearOverlay').classList.remove('active');
  }

  // --- レベルアップ演出 ---
  function showLevelUpOverlay(newLevel) {
    Sound.playLevelUp();
    const overlay = document.getElementById('levelupOverlay');
    document.getElementById('levelupNum').textContent = newLevel;
    const p = Profile.get();
    document.getElementById('levelupExpInfo').textContent =
      `EXP: ${p.exp} / ${ExpSystem.calcNextExp(newLevel)}`;
    overlay.classList.add('active');
    SakuraEffect.burst(document.getElementById('levelupParticles'), 40);

    // キャラバウンス
    document.getElementById('characterWrap').classList.add('bounce');
    setTimeout(() => document.getElementById('characterWrap').classList.remove('bounce'), 600);

    setTimeout(() => {
      overlay.classList.remove('active');
      updateProfileBar();
    }, 3000);
  }

  // --- モーダル ---
  function openAddModal() {
    editMode = false;
    currentQuestId = null;
    pendingSubquests = [];
    document.getElementById('modalTitle').textContent = '📜 新しいクエスト';
    document.getElementById('questTitleInput').value = '';
    document.getElementById('questDeadlineInput').value = '';
    document.getElementById('questExpInput').value = '50';
    document.getElementById('subQuestPreviewList').innerHTML = '';
    openModal('questModal');
  }

  function openEditModal(questId) {
    const q = QuestManager.getById(questId);
    if (!q) return;
    editMode = true;
    currentQuestId = questId;
    pendingSubquests = q.subquests.map(sq => ({ ...sq }));
    document.getElementById('modalTitle').textContent = '✏️ クエスト編集';
    document.getElementById('questTitleInput').value = q.title;
    document.getElementById('questDeadlineInput').value = q.deadline || '';
    document.getElementById('questExpInput').value = q.exp;
    renderPendingSubquests();
    openModal('questModal');
  }

  function openModal(id) {
    document.getElementById(id).classList.add('open');
  }

  function closeModal(id) {
    document.getElementById(id).classList.remove('open');
  }

  function renderPendingSubquests() {
    const list = document.getElementById('subQuestPreviewList');
    list.innerHTML = pendingSubquests.map((sq, i) => `
      <div class="subquest-preview-item" data-idx="${i}">
        <span>${escapeHtml(sq.title)}</span>
        <span class="subquest-preview-exp">+${sq.exp} EXP</span>
        <span class="subquest-preview-del" data-idx="${i}">✕</span>
      </div>
    `).join('');
    list.querySelectorAll('.subquest-preview-del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx);
        pendingSubquests.splice(idx, 1);
        renderPendingSubquests();
      });
    });
  }

  function addPendingSubquest() {
    const titleInput = document.getElementById('subQuestTitleInput');
    const expInput = document.getElementById('subQuestExpInput');
    const title = titleInput.value.trim();
    const exp = parseInt(expInput.value) || 10;
    if (!title) { showToast('サブクエスト名を入力してください'); return; }
    pendingSubquests.push({ id: `sq_new_${Date.now()}`, title, exp, status: 'active' });
    titleInput.value = '';
    expInput.value = '10';
    renderPendingSubquests();
  }

  async function saveQuest() {
    const title = document.getElementById('questTitleInput').value.trim();
    if (!title) { showToast('クエスト名を入力してください'); return; }
    const deadline = document.getElementById('questDeadlineInput').value || null;
    const exp = parseInt(document.getElementById('questExpInput').value) || 50;

    if (editMode && currentQuestId) {
      const q = QuestManager.getById(currentQuestId);
      q.title = title;
      q.deadline = deadline;
      q.exp = exp;
      // サブクエストの更新（既存のクリア済みは維持）
      const existingMap = {};
      q.subquests.forEach(sq => { existingMap[sq.id] = sq; });
      q.subquests = pendingSubquests.map(sq => ({
        ...sq,
        status: existingMap[sq.id] ? existingMap[sq.id].status : (sq.status || 'active')
      }));
      await QuestManager.update(q);
      showToast('クエストを更新しました ✨');
      renderDetail(q);
    } else {
      await QuestManager.add({ title, deadline, exp, subquests: pendingSubquests });
      showToast('クエストを追加しました ✨');
    }

    closeModal('questModal');
    renderQuestList();
  }

  // --- 削除確認 ---
  function confirmDeleteQuest(questId) {
    const q = QuestManager.getById(questId);
    if (!q) return;
    showConfirm(
      `「${q.title}」を削除しますか？`,
      async () => {
        await QuestManager.remove(questId);
        showToast('クエストを削除しました');
        showScreen('home');
        renderQuestList();
      }
    );
  }

  // --- 確認ダイアログ ---
  function showConfirm(message, onOk) {
    document.getElementById('confirmMsg').textContent = message;
    openModal('confirmModal');
    const okBtn = document.getElementById('confirmOkBtn');
    const newOkBtn = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    newOkBtn.addEventListener('click', () => {
      closeModal('confirmModal');
      onOk();
    });
  }

  // --- トースト ---
  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // --- 設定画面 ---
  function initSettings() {
    const s = Sound.getSettings();
    document.getElementById('bgmToggle').checked = s.bgmOn;
    document.getElementById('seToggle').checked = s.seOn;
    document.getElementById('bgmVolume').value = Math.round(s.bgmVol * 100);
    document.getElementById('questClearVolume').value = Math.round(s.questClearVol * 100);
    document.getElementById('subQuestClearVolume').value = Math.round(s.subClearVol * 100);
    document.getElementById('levelUpVolume').value = Math.round(s.levelUpVol * 100);
    document.getElementById('voiceVolume').value = Math.round(s.voiceVol * 100);
    renderCharSelect();
  }

  function bindSettingsEvents() {
    const applySound = () => {
      Sound.applySettings({
        bgmOn: document.getElementById('bgmToggle').checked,
        seOn: document.getElementById('seToggle').checked,
        bgmVol: document.getElementById('bgmVolume').value / 100,
        questClearVol: document.getElementById('questClearVolume').value / 100,
        subClearVol: document.getElementById('subQuestClearVolume').value / 100,
        levelUpVol: document.getElementById('levelUpVolume').value / 100,
        voiceVol: document.getElementById('voiceVolume').value / 100
      });
    };
    ['bgmToggle','seToggle','bgmVolume','questClearVolume',
     'subQuestClearVolume','levelUpVolume','voiceVolume'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', applySound);
      document.getElementById(id)?.addEventListener('input', applySound);
    });
  }

  // --- キャラクター選択 ---
  const CHARS = [
    { id: 'default', src: 'assets/characters/character-default.png', label: '🌸' },
    { id: 'alt1',    src: 'assets/characters/character-alt1.png',    label: '⛩️' },
    { id: 'alt2',    src: 'assets/characters/character-alt2.png',    label: '✨' },
    { id: 'alt3',    src: 'assets/characters/character-alt3.png',    label: '🎀' },
    { id: 'alt4',    src: 'assets/characters/character-alt4.png',    label: '🌙' },
    { id: 'alt5',    src: 'assets/characters/character-alt5.png',    label: '🎵' },
    { id: 'alt6',    src: 'assets/characters/character-alt6.png',    label: '🌺' },
    { id: 'alt7',    src: 'assets/characters/character-alt7.png',    label: '💫' },
    { id: 'alt8',    src: 'assets/characters/character-alt8.png',    label: '🎐' }
  ];

  function getCurrentChar() {
    return localStorage.getItem('mikoquest_char') || 'default';
  }

  function setCurrentChar(id) {
    localStorage.setItem('mikoquest_char', id);
    const char = CHARS.find(c => c.id === id) || CHARS[0];
    const img = document.getElementById('characterImg');
    const fallback = document.getElementById('charFallback');
    img.src = char.src;
    img.style.display = '';
    fallback.style.display = 'none';
    renderCharSelect();
  }

  function renderCharSelect() {
    const grid = document.getElementById('charSelectGrid');
    const current = getCurrentChar();
    grid.innerHTML = CHARS.map(c => `
      <div class="char-select-item ${c.id === current ? 'active' : ''}" data-char-id="${c.id}">
        ${c.label}
      </div>
    `).join('');
    grid.querySelectorAll('.char-select-item').forEach(item => {
      item.addEventListener('click', () => {
        setCurrentChar(item.dataset.charId);
        showToast('キャラクターを変更しました');
      });
    });
  }

  return {
    showScreen, updateProfileBar, renderQuestList, openDetail,
    openAddModal, openEditModal, closeModal, saveQuest, addPendingSubquest,
    initSettings, bindSettingsEvents, setCurrentChar, getCurrentChar,
    showToast, showConfirm, handleSubquestComplete, handleQuestComplete
  };
})();

// =============================================
// Utility
// =============================================
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================
// Event Binding
// =============================================
function bindEvents() {
  // ヘッダー
  document.getElementById('settingsBtn').addEventListener('click', () => {
    UI.initSettings();
    UI.showScreen('settings');
  });

  // ナビゲーション
  document.getElementById('backBtn').addEventListener('click', () => UI.showScreen('home'));
  document.getElementById('settingsBackBtn').addEventListener('click', () => UI.showScreen('home'));

  // クエスト追加
  document.getElementById('addQuestBtn').addEventListener('click', UI.openAddModal);

  // モーダル
  document.getElementById('modalCancelBtn').addEventListener('click', () => UI.closeModal('questModal'));
  document.getElementById('modalSaveBtn').addEventListener('click', UI.saveQuest);
  document.getElementById('addSubQuestBtn').addEventListener('click', UI.addPendingSubquest);
  document.getElementById('subQuestTitleInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') UI.addPendingSubquest();
  });

  // 確認ダイアログ
  document.getElementById('confirmCancelBtn').addEventListener('click', () => UI.closeModal('confirmModal'));

  // モーダル外クリックで閉じる
  document.getElementById('questModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('questModal')) UI.closeModal('questModal');
  });
  document.getElementById('confirmModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('confirmModal')) UI.closeModal('confirmModal');
  });

  // クリア演出クリックで閉じる
  document.getElementById('clearOverlay').addEventListener('click', () => {
    document.getElementById('clearOverlay').classList.remove('active');
  });

  // レベルアップ演出クリックで閉じる
  document.getElementById('levelupOverlay').addEventListener('click', () => {
    document.getElementById('levelupOverlay').classList.remove('active');
  });

  // キャラクタータップ
  document.getElementById('characterContainer').addEventListener('click', () => {
    Sound.playVoice();
    document.getElementById('characterWrap').classList.add('bounce');
    setTimeout(() => document.getElementById('characterWrap').classList.remove('bounce'), 600);
  });

  // 設定
  UI.bindSettingsEvents();

  // データリセット
  document.getElementById('resetDataBtn').addEventListener('click', () => {
    UI.showConfirm('全データをリセットしますか？\nこの操作は取り消せません。', async () => {
      await QuestManager.clearAll();
      await DB.clear(DB.STORES.PROFILE);
      localStorage.removeItem('mikoquest_sound');
      localStorage.removeItem('mikoquest_char');
      location.reload();
    });
  });

  // サウンドのためのユーザーインタラクション検出
  document.addEventListener('click', Sound.onUserInteract);
  document.addEventListener('touchstart', Sound.onUserInteract);

  // ページ非表示時にBGM停止
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) Sound.stopBgm();
    else if (Sound.getSettings().bgmOn) Sound.playBgm();
  });
}

// =============================================
// Background Image Switcher
// PC: assets/background/background.png
// スマホ（幅768px以下）: assets/background/background01.png
// =============================================
function applyBackgroundImage() {
  const isMobile = window.matchMedia('(max-width: 768px)').matches
                || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const src = isMobile
    ? 'assets/background/background01.png'
    : 'assets/background/background.png';

  const bgEl = document.querySelector('.bg-image');
  if (!bgEl) return;

  // 現在の設定と同じなら何もしない
  if (bgEl.dataset.bgSrc === src) return;
  bgEl.dataset.bgSrc = src;

  // 画像を先読みしてから適用（ちらつき防止）
  const img = new Image();
  img.onload = () => {
    bgEl.style.backgroundImage = `url('${src}')`;
    bgEl.style.backgroundSize = 'cover';
    bgEl.style.backgroundPosition = 'center';
    bgEl.style.backgroundRepeat = 'no-repeat';
  };
  img.onerror = () => {
    // 画像がなければCSS グラデーションにフォールバック（既存のスタイルが維持される）
    bgEl.dataset.bgSrc = '';
  };
  img.src = src;
}

// =============================================
// App Initialization
// =============================================
async function initApp() {
  try {
    // DB初期化
    await DB.open();

    // データ読み込み
    await Profile.load();
    await QuestManager.loadAll();

    // サウンド設定読み込み
    Sound.loadSettings();

    // UI初期化
    UI.updateProfileBar();
    UI.renderQuestList();

    // キャラクター初期設定（相対パス）
    const charId = UI.getCurrentChar();
    // CHARS配列から動的に解決（9種対応）
    const CHAR_MAP = {
      'default': 'assets/characters/character-default.png',
      'alt1':    'assets/characters/character-alt1.png',
      'alt2':    'assets/characters/character-alt2.png',
      'alt3':    'assets/characters/character-alt3.png',
      'alt4':    'assets/characters/character-alt4.png',
      'alt5':    'assets/characters/character-alt5.png',
      'alt6':    'assets/characters/character-alt6.png',
      'alt7':    'assets/characters/character-alt7.png',
      'alt8':    'assets/characters/character-alt8.png'
    };
    const charSrc = CHAR_MAP[charId] || CHAR_MAP['default'];
    document.getElementById('characterImg').src = charSrc;

    // 桜エフェクト開始
    SakuraEffect.startAmbient();

    // 背景画像をPC/スマホで切り替え
    // スマホ: background01.png / PC: background.png
    applyBackgroundImage();
    window.addEventListener('resize', applyBackgroundImage);

    // イベントバインド
    bindEvents();

    // Service Worker登録
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }

  } catch (err) {
    console.error('初期化エラー:', err);
    // エラー時はローカルストレージにフォールバック
    UI.showToast('データの読み込みに失敗しました');
  }
}

// アプリ起動
document.addEventListener('DOMContentLoaded', initApp);
