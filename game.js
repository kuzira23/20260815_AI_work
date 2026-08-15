// Git Quest - Game Logic and Git Simulator

// --- Git Object Definitions ---
class Commit {
  constructor(id, parentId, message, files = {}, branch = 'main') {
    this.id = id; // 短いハッシュ (例: "a1b2c3d")
    this.parentId = parentId; // 親コミットのID
    this.message = message;
    this.files = JSON.parse(JSON.stringify(files)); // ディープコピー
    this.branch = branch; // コミット時のブランチ
    this.timestamp = new Date();
  }
}

// --- Game State Variables ---
let gameState = {
  currentStage: 1,
  // 仮想ファイルシステム
  files: {}, // name -> { content, status: 'untracked' | 'modified' | 'staged' | 'committed' }
  stagedFiles: {}, // name -> content
  // Git 履歴
  commits: {}, // hash -> Commit
  branches: {
    main: null // 最新コミットのハッシュを指す
  },
  activeBranch: 'main',
  headCommitId: null, // 現在 HEAD が指しているコミットID
  isDetached: false, // HEADがコミットを直接指しているか (detached HEAD)
  commandHistory: [],
  historyIndex: -1
};

// --- Stage Definitions ---
const STAGES = {
  1: {
    title: "Stage 1: 最初のコミット (First Commit)",
    description: "Git でファイルの変更履歴を保存する最小単位が「コミット」です。ファイルの変更を確定させるには、まずファイルを「ステージングエリア」へ登録（git add）し、その後「リポジトリ」へ記録（git commit）する必要があります。<br><br><strong>ミッション:</strong> ファイルを作成し、ステージングして、コミットを完了させてください！",
    targets: [
      { id: "create", text: "ファイルを追加する", check: () => Object.keys(gameState.files).length > 0 },
      { id: "stage", text: "ファイルをステージングする (git add)", check: () => Object.keys(gameState.stagedFiles).length > 0 },
      { id: "commit", text: "コミットを完了する (git commit)", check: () => Object.keys(gameState.commits).length > 0 }
    ],
    init: () => {
      gameState.files = {};
      gameState.stagedFiles = {};
      gameState.commits = {};
      gameState.branches = { main: null };
      gameState.activeBranch = 'main';
      gameState.headCommitId = null;
      gameState.isDetached = false;
    },
    explanation: "<strong>💡 学んだ概念の整理:</strong><br>・<strong>Working Directory（作業ディレクトリ）:</strong> 今あなたがコードを書いているフォルダ。<br>・<strong>Staging Area / Index（ステージ）:</strong> 次のコミットに含めるファイルを準備する場所。`git add` で送ります。<br>・<strong>Repository（リポジトリ）:</strong> バージョン履歴の記録庫。`git commit` でステージ上の内容を永久に記録します。"
  },
  2: {
    title: "Stage 2: タイムトラベル (Checkout)",
    description: "Git の強みは、過去のコミット履歴（状態）へ自由に戻れることです。過去のコミットに戻るには、`git checkout <コミットID>` を使用します。これにより、作業ディレクトリのファイルが当時の状態に書き換わります。<br><br><strong>ミッション:</strong> 履歴の中で一番古い最初のコミット（C1）にチェックアウトして、過去に戻ってください！",
    targets: [
      { id: "checkout", text: "最初のコミット (C1) にチェックアウトする (git checkout <ID>)", check: () => {
        // C1 のハッシュを探す
        const c1Hash = Object.keys(gameState.commits).find(h => gameState.commits[h].message === "C1: Initial Template");
        return gameState.headCommitId === c1Hash;
      }}
    ],
    init: () => {
      // 過去のコミット履歴をプリセット
      gameState.files = { "index.html": { content: "<h1>Hello World v3</h1>", status: "committed" } };
      gameState.stagedFiles = {};
      
      const c1 = new Commit("a1b2c3d", null, "C1: Initial Template", { "index.html": "<h1>Hello</h1>" }, 'main');
      const c2 = new Commit("e4f5g6h", "a1b2c3d", "C2: Add Title", { "index.html": "<h1>Hello World</h1>" }, 'main');
      const c3 = new Commit("i7j8k9l", "e4f5g6h", "C3: Complete page", { "index.html": "<h1>Hello World v3</h1>" }, 'main');
      
      gameState.commits = {
        "a1b2c3d": c1,
        "e4f5g6h": c2,
        "i7j8k9l": c3
      };
      
      gameState.branches = { main: "i7j8k9l" };
      gameState.activeBranch = 'main';
      gameState.headCommitId = "i7j8k9l";
      gameState.isDetached = false;
    },
    explanation: "<strong>💡 学んだ概念の整理:</strong><br>・<strong>HEAD:</strong> 現在自分が「どこにいるか」を示すポインタです。通常はブランチ（main等）の先頭を指していますが、コミットIDを直接指すと <strong>Detached HEAD（ブランチから離れた状態）</strong> になります。<br>・<strong>git checkout:</strong> 過去に戻っても、新しいブランチを作って作業を再開すれば、元のメイン履歴を汚さずに開発を分岐できます。"
  },
  3: {
    title: "Stage 3: 新たな世界 (Branching)",
    description: "他の機能やバグ修正を並行して行う場合、メインの歴史（main）から分岐した「ブランチ」を作成します。これにより、互いに干渉することなく並行開発ができます。<br><br><strong>ミッション:</strong> 新しいブランチ `feature` を作成して切り替え、そこで新しいファイル `style.css` をコミットしてください！",
    targets: [
      { id: "create_branch", text: "ブランチ 'feature' を作成する (git branch feature)", check: () => 'feature' in gameState.branches },
      { id: "switch_branch", text: "ブランチ 'feature' に切り替える (git checkout feature)", check: () => gameState.activeBranch === 'feature' },
      { id: "add_style", text: "新しいファイル 'style.css' をコミットする", check: () => {
        if (!gameState.headCommitId) return false;
        const currentCommit = gameState.commits[gameState.headCommitId];
        return currentCommit && 'style.css' in currentCommit.files && currentCommit.branch === 'feature';
      }}
    ],
    init: () => {
      gameState.files = { "index.html": { content: "<h1>App</h1>", status: "committed" } };
      gameState.stagedFiles = {};
      
      const c1 = new Commit("b3c4d5e", null, "C1: Start Project", { "index.html": "<h1>App</h1>" }, 'main');
      gameState.commits = { "b3c4d5e": c1 };
      gameState.branches = { main: "b3c4d5e" };
      gameState.activeBranch = 'main';
      gameState.headCommitId = "b3c4d5e";
      gameState.isDetached = false;
    },
    explanation: "<strong>💡 学んだ概念の整理:</strong><br>・<strong>git branch <名前>:</strong> 現在のコミットから分岐した付箋（ポインタ）を作成します。<br>・<strong>git checkout <名前>:</strong> HEADを指定したブランチに切り替えます。作成と切り替えを同時に行う `git checkout -b <名前>` もよく使われます。"
  },
  4: {
    title: "Stage 4: 統合の時 (Merge)",
    description: "別ブランチ（feature）での機能追加が完了したら、それを本番用ブランチ（main）に統合する「マージ（Merge）」を行います。これにより、分岐した歴史が一つにまとまります。<br><br><strong>ミッション:</strong> ブランチを `main` に切り替え、`feature` ブランチをマージしてください！",
    targets: [
      { id: "checkout_main", text: "main ブランチに切り替える (git checkout main)", check: () => gameState.activeBranch === 'main' },
      { id: "merge_feature", text: "feature ブランチをマージする (git merge feature)", check: () => {
        // マージが成功し、mainブランチがfeatureの成果物 (main.js) を含んでいるか確認
        if (!gameState.branches.main) return false;
        const mainCommit = gameState.commits[gameState.branches.main];
        return mainCommit && 'main.js' in mainCommit.files;
      }}
    ],
    init: () => {
      // 共通の親 C1 から分岐した履歴を作成
      const c1 = new Commit("c1c1c1c", null, "C1: Root", { "index.html": "<h1>App</h1>" }, 'main');
      
      // main 側の進み
      const c4 = new Commit("c4c4c4c", "c1c1c1c", "C4: Update HTML", { "index.html": "<h1>App v2</h1>" }, 'main');
      
      // feature 側の進み (C1 -> C2 -> C3)
      const c2 = new Commit("c2c2c2c", "c1c1c1c", "C2: Add Script Template", { "index.html": "<h1>App</h1>", "main.js": "" }, 'feature');
      const c3 = new Commit("c3c3c3c", "c2c2c2c", "C3: Complete Script", { "index.html": "<h1>App</h1>", "main.js": "console.log('done')" }, 'feature');
      
      gameState.commits = {
        "c1c1c1c": c1,
        "c4c4c4c": c4,
        "c2c2c2c": c2,
        "c3c3c3c": c3
      };
      
      gameState.branches = {
        main: "c4c4c4c",
        feature: "c3c3c3c"
      };
      
      // 最初は feature ブランチにいる状態にする
      gameState.files = {
        "index.html": { content: "<h1>App</h1>", status: "committed" },
        "main.js": { content: "console.log('done')", status: "committed" }
      };
      gameState.stagedFiles = {};
      gameState.activeBranch = 'feature';
      gameState.headCommitId = "c3c3c3c";
      gameState.isDetached = false;
    },
    explanation: "<strong>💡 学んだ概念の整理:</strong><br>・<strong>git merge <ブランチ名>:</strong> 現在自分がいるブランチに、別のブランチの変更を取り込みます。<br>・今回は、お互いが別のファイルを変更していた（mainはindex.html、featureはmain.js）ため、Gitが自動的かつ安全に変更を合流させました。これが同じファイルの同じ行だと「コンフリクト（競合）」が発生します。"
  }
};

// --- DOM References ---
const fileTree = document.getElementById('file-tree');
const fileEditorTextarea = document.getElementById('file-editor-textarea');
const activeFileTitle = document.getElementById('active-file-title');
const btnSaveFile = document.getElementById('btn-save-file');
const btnCreateFile = document.getElementById('btn-create-file');
const stagingAreaBox = document.getElementById('staging-area-box');
const commitNodesContainer = document.getElementById('commit-nodes-container');
const gitGraphCanvas = document.getElementById('git-graph-canvas');
const terminalLogs = document.getElementById('terminal-logs');
const terminalInput = document.getElementById('terminal-input');
const stageSelect = document.getElementById('stage-select');

// Mission Info DOM
const missionTitle = document.getElementById('mission-title');
const missionDescription = document.getElementById('mission-description');
const missionTargetsList = document.getElementById('mission-targets-list');

// Success Modal DOM
const successModal = document.getElementById('success-modal');
const modalTitle = document.getElementById('modal-title');
const modalBodyText = document.getElementById('modal-body-text');
const modalExplanationText = document.getElementById('modal-explanation-text');
const btnNextStage = document.getElementById('btn-next-stage');

// Active selected file in editor
let activeFileName = null;

// --- Initialize Game ---
function initGame(stageNum) {
  gameState.currentStage = stageNum;
  stageSelect.value = stageNum;
  
  // ステージ初期化
  STAGES[stageNum].init();
  activeFileName = null;
  fileEditorTextarea.value = '';
  fileEditorTextarea.disabled = true;
  activeFileTitle.textContent = 'エディタ (未選択)';
  btnSaveFile.disabled = true;
  
  // ログのリセット
  terminalLogs.innerHTML = `<div>Welcome to Git Quest Terminal!</div><div>Stage ${stageNum} がロードされました。</div><div>ヒント: \`git status\` で現在の状態を確認してみましょう。</div>`;
  
  updateUI();
  
  // 目標の更新
  updateMissionInfo();
}

// --- Mission Update ---
function updateMissionInfo() {
  const stage = STAGES[gameState.currentStage];
  missionTitle.textContent = stage.title;
  missionDescription.innerHTML = stage.description;
  
  missionTargetsList.innerHTML = '';
  stage.targets.forEach(target => {
    const li = document.createElement('li');
    const isDone = target.check();
    li.className = isDone ? 'completed' : 'pending';
    li.textContent = target.text;
    missionTargetsList.appendChild(li);
  });
}

// --- UI Update Coordinator ---
function updateUI() {
  renderFileTree();
  renderStagingArea();
  renderCommitGraph();
  updateMissionInfo();
  checkStageClear();
}

// --- File Tree Rendering ---
function renderFileTree() {
  fileTree.innerHTML = '';
  const files = gameState.files;
  
  if (Object.keys(files).length === 0) {
    fileTree.innerHTML = '<li style="color: var(--text-muted); font-size: 12px; font-style: italic;">ファイルがありません</li>';
    return;
  }
  
  for (const [name, fileObj] of Object.entries(files)) {
    const li = document.createElement('li');
    li.className = `file-item ${activeFileName === name ? 'active' : ''}`;
    
    // アイコン決定
    let icon = '📄';
    if (name.endsWith('.html')) icon = '🌐';
    if (name.endsWith('.css')) icon = '🎨';
    if (name.endsWith('.js')) icon = '⚡';
    
    // ステータスバッジ
    let badgeText = 'untracked';
    if (fileObj.status === 'modified') badgeText = 'modified';
    if (fileObj.status === 'staged') badgeText = 'staged';
    if (fileObj.status === 'committed') badgeText = 'committed';
    
    li.innerHTML = `
      <div class="file-name-container">
        <span class="file-icon">${icon}</span>
        <span class="file-name">${name}</span>
      </div>
      <span class="status-badge ${badgeText}">${badgeText}</span>
    `;
    
    li.addEventListener('click', () => selectFile(name));
    fileTree.appendChild(li);
  }
}

function selectFile(name) {
  activeFileName = name;
  const file = gameState.files[name];
  fileEditorTextarea.value = file.content;
  fileEditorTextarea.disabled = false;
  activeFileTitle.textContent = name;
  btnSaveFile.disabled = false;
  renderFileTree();
}

// --- Staging Area Rendering ---
function renderStagingArea() {
  stagingAreaBox.innerHTML = '';
  const staged = gameState.stagedFiles;
  
  if (Object.keys(staged).length === 0) {
    stagingAreaBox.innerHTML = '<div class="empty-placeholder">ファイルがステージされていません (git add が必要)</div>';
    return;
  }
  
  for (const name of Object.keys(staged)) {
    const div = document.createElement('div');
    div.className = 'staged-file-card';
    div.innerHTML = `🌱 ${name}`;
    stagingAreaBox.appendChild(div);
  }
}

// --- Commit Graph Drawing (Canvas + HTML overlay) ---
function renderCommitGraph() {
  // コンテナ初期化
  commitNodesContainer.innerHTML = '';
  
  const ctx = gitGraphCanvas.getContext('2d');
  
  // レスポンシブ対応でCanvas解像度を調整
  const rect = gitGraphCanvas.getBoundingClientRect();
  gitGraphCanvas.width = rect.width;
  gitGraphCanvas.height = rect.height;
  
  ctx.clearRect(0, 0, gitGraphCanvas.width, gitGraphCanvas.height);
  
  const commits = Object.values(gameState.commits);
  if (commits.length === 0) {
    // リポジトリが空の場合
    ctx.font = 'italic 12px Outfit';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('コミット履歴が空です (No commits yet)', 20, 40);
    return;
  }
  
  // ブランチごとのY軸座標マッピング
  const branchY = {
    'main': 80
  };
  let branchCount = 1;
  
  // コミットツリーをトポロジカルソート（簡易的に親子関係からソート）
  // 深さ優先探索でツリーを描画用配列に並べる
  const sortedCommits = [];
  const visited = new Set();
  
  function visit(commitId) {
    if (!commitId || visited.has(commitId)) return;
    visited.add(commitId);
    
    const commit = gameState.commits[commitId];
    if (!commit) return;
    
    // 親を先に描く
    visit(commit.parentId);
    sortedCommits.push(commit);
  }
  
  // すべてのリーフから遡って順序を決定
  Object.keys(gameState.commits).forEach(id => visit(id));
  
  // ブランチの登録
  sortedCommits.forEach(c => {
    if (!(c.branch in branchY)) {
      branchY[c.branch] = 80 + branchCount * 70;
      branchCount++;
    }
  });
  
  // 各コミットのX, Y座標を設定
  const commitCoords = {}; // hash -> {x, y}
  const xSpacing = 90;
  
  sortedCommits.forEach((commit, index) => {
    const x = 50 + index * xSpacing;
    const y = branchY[commit.branch];
    commitCoords[commit.id] = { x, y };
  });
  
  // Canvasにエッジ（接続線）を描画
  ctx.lineWidth = 3;
  
  sortedCommits.forEach(commit => {
    const current = commitCoords[commit.id];
    
    // 親との接続線を描く
    if (commit.parentId && commitCoords[commit.parentId]) {
      const parent = commitCoords[commit.parentId];
      ctx.beginPath();
      ctx.moveTo(parent.x, parent.y);
      
      // ブランチが変わる場合は滑らかなベジェ曲線にする
      if (commit.branch !== gameState.commits[commit.parentId].branch) {
        ctx.bezierCurveTo(
          parent.x + 40, parent.y,
          current.x - 40, current.y,
          current.x, current.y
        );
        ctx.strokeStyle = commit.branch === 'main' ? '#4facfe' : '#b92b27'; // ブランチごとの色
      } else {
        ctx.lineTo(current.x, current.y);
        ctx.strokeStyle = commit.branch === 'main' ? '#4facfe' : '#fbbf24';
      }
      ctx.stroke();
    }
  });
  
  // コミットノード（DOM要素）を作成して配置
  sortedCommits.forEach(commit => {
    const coords = commitCoords[commit.id];
    const node = document.createElement('div');
    node.className = 'commit-node';
    if (commit.id === gameState.headCommitId) {
      node.classList.add('head-node');
    }
    
    node.style.left = `${coords.x}px`;
    node.style.top = `${coords.y}px`;
    node.setAttribute('data-hash', commit.id);
    
    // クリックしたときにコミットメッセージをターミナルに表示する
    node.addEventListener('click', () => {
      logTerminal(`Commit details:\nHash: ${commit.id}\nMessage: ${commit.message}\nBranch: ${commit.branch}\nFiles: ${JSON.stringify(commit.files, null, 2)}`, 'info');
    });
    
    commitNodesContainer.appendChild(node);
  });
  
  // ブランチラベルとHEADのオーバーレイ表示
  // 各ブランチポインタの最新コミットに付箋を貼る
  const activeLabelOffset = {}; // hash -> offset multiplier
  
  for (const [branchName, tipHash] of Object.entries(gameState.branches)) {
    if (!tipHash || !commitCoords[tipHash]) continue;
    
    const coords = commitCoords[tipHash];
    
    // 同じコミットに複数のポインタがある場合の重なり回避
    if (!activeLabelOffset[tipHash]) activeLabelOffset[tipHash] = 0;
    const offset = activeLabelOffset[tipHash] * 20;
    activeLabelOffset[tipHash]++;
    
    const label = document.createElement('div');
    label.className = 'branch-label-overlay';
    
    const isActive = gameState.activeBranch === branchName && !gameState.isDetached;
    if (isActive) {
      label.classList.add('active-head');
      label.textContent = `* ${branchName} (HEAD)`;
    } else {
      label.textContent = branchName;
    }
    
    // スタイル調整
    label.style.left = `${coords.x + 25}px`;
    label.style.top = `${coords.y - 12 - offset}px`;
    
    commitNodesContainer.appendChild(label);
  }
  
  // Detached HEAD の場合の表示
  if (gameState.isDetached && gameState.headCommitId && commitCoords[gameState.headCommitId]) {
    const coords = commitCoords[gameState.headCommitId];
    const label = document.createElement('div');
    label.className = 'branch-label-overlay active-head';
    label.style.background = 'var(--accent-pink)';
    label.style.color = '#fff';
    label.textContent = 'HEAD (detached)';
    
    const offset = (activeLabelOffset[gameState.headCommitId] || 0) * 20;
    label.style.left = `${coords.x + 25}px`;
    label.style.top = `${coords.y - 12 - offset}px`;
    
    commitNodesContainer.appendChild(label);
  }
}

// --- Terminal Log Helper ---
function logTerminal(message, type = '') {
  const line = document.createElement('div');
  if (type) {
    line.className = type; // 'error' | 'success' | 'info'
  }
  
  // 改行をbrに変換
  line.innerHTML = message.replace(/\n/g, '<br>');
  terminalLogs.appendChild(line);
  
  // 最下部へスクロール
  terminalLogs.scrollTop = terminalLogs.scrollHeight;
}

// --- Git Command Simulator Parser ---
function executeGitCommand(cmdStr) {
  cmdStr = cmdStr.trim();
  if (!cmdStr) return;
  
  // 履歴保存
  gameState.commandHistory.push(cmdStr);
  gameState.historyIndex = gameState.commandHistory.length;
  
  logTerminal(`<span style="color: #38bdf8;">$ ${cmdStr}</span>`);
  
  const tokens = cmdStr.split(/\s+/);
  if (tokens[0] !== 'git') {
    logTerminal(`Error: '${tokens[0]}' は Git コマンドではありません。すべての操作は 'git' から始めてください。`, 'error');
    return;
  }
  
  const action = tokens[1];
  
  switch (action) {
    case 'status':
      simStatus();
      break;
    case 'add':
      simAdd(tokens.slice(2));
      break;
    case 'commit':
      // オプション解析
      let mIdx = tokens.indexOf('-m');
      if (mIdx === -1) {
        logTerminal("Error: コミットメッセージが必要です。 'git commit -m \"メッセージ内容\"' と入力してください。", 'error');
        return;
      }
      // -m 移行の引数を合体させてメッセージにする
      let message = tokens.slice(mIdx + 1).join(' ').replace(/^['"]|['"]$/g, ''); // クォーテーション除去
      if (!message) {
        logTerminal("Error: 空のコミットメッセージは許可されていません。", 'error');
        return;
      }
      simCommit(message);
      break;
    case 'log':
      simLog();
      break;
    case 'branch':
      simBranch(tokens[2]);
      break;
    case 'checkout':
      // checkout -b <branch> の対応
      if (tokens[2] === '-b') {
        simCheckoutB(tokens[3]);
      } else {
        simCheckout(tokens[2]);
      }
      break;
    case 'merge':
      simMerge(tokens[2]);
      break;
    default:
      logTerminal(`Error: サポートされていないコマンド、または引数が無効です: ${cmdStr}`, 'error');
      break;
  }
  
  updateUI();
}

// --- git status ---
function simStatus() {
  let output = [];
  
  if (gameState.isDetached) {
    output.push(`HEAD detached at ${gameState.headCommitId}`);
  } else {
    output.push(`On branch ${gameState.activeBranch}`);
  }
  
  // 差分チェック
  const untracked = [];
  const modified = [];
  const staged = [];
  
  for (const [name, file] of Object.entries(gameState.files)) {
    if (file.status === 'untracked') untracked.push(name);
    else if (file.status === 'modified') modified.push(name);
    else if (file.status === 'staged') staged.push(name);
  }
  
  if (staged.length > 0) {
    output.push(`<span style="color: var(--git-staged);">Changes to be committed:</span>`);
    output.push(`  (use "git restore --staged <file>..." to unstage)`);
    staged.forEach(f => output.push(`<span style="color: var(--git-staged);">&nbsp;&nbsp;&nbsp;&nbsp;new file:   ${f}</span>`));
    output.push('');
  }
  
  if (modified.length > 0) {
    output.push(`<span style="color: var(--git-modified);">Changes not staged for commit:</span>`);
    output.push(`  (use "git add <file>..." to update what will be committed)`);
    modified.forEach(f => output.push(`<span style="color: var(--git-modified);">&nbsp;&nbsp;&nbsp;&nbsp;modified:   ${f}</span>`));
    output.push('');
  }
  
  if (untracked.length > 0) {
    output.push(`<span style="color: var(--git-untracked);">Untracked files:</span>`);
    output.push(`  (use "git add <file>..." to include in what will be committed)`);
    untracked.forEach(f => output.push(`<span style="color: var(--git-untracked);">&nbsp;&nbsp;&nbsp;&nbsp;${f}</span>`));
    output.push('');
  }
  
  if (staged.length === 0 && modified.length === 0 && untracked.length === 0) {
    output.push("nothing to commit, working tree clean");
  }
  
  logTerminal(output.join('\n'));
}

// --- git add ---
function simAdd(targets) {
  if (targets.length === 0) {
    logTerminal("Error: 対象のファイル名、または '.' を指定してください。", 'error');
    return;
  }
  
  const target = targets[0];
  let filesToAdd = [];
  
  if (target === '.') {
    filesToAdd = Object.keys(gameState.files).filter(name => 
      gameState.files[name].status === 'untracked' || gameState.files[name].status === 'modified'
    );
  } else {
    if (gameState.files[target]) {
      filesToAdd = [target];
    } else {
      logTerminal(`Error: ファイル '${target}' は存在しません。`, 'error');
      return;
    }
  }
  
  if (filesToAdd.length === 0) {
    logTerminal("ステージングする変更はありません。");
    return;
  }
  
  filesToAdd.forEach(name => {
    gameState.files[name].status = 'staged';
    gameState.stagedFiles[name] = gameState.files[name].content;
  });
  
  logTerminal(`Staged ${filesToAdd.length} files successfully.`);
}

// --- git commit ---
function simCommit(message) {
  if (Object.keys(gameState.stagedFiles).length === 0) {
    logTerminal("Error: コミットする変更がありません（git add を先に行う必要があります）。", 'error');
    return;
  }
  
  // デタッチド状態でのコミット警告
  if (gameState.isDetached) {
    logTerminal("Warning: あなたは detached HEAD 状態でコミットしようとしています。このコミットはいずれのブランチにも含まれません。", 'info');
  }
  
  // 新しいハッシュ生成
  const hash = Math.random().toString(36).substring(2, 9);
  
  // コミット時のファイル構成を生成 (親コミットのファイル + ステージファイル)
  let parentFiles = {};
  if (gameState.headCommitId && gameState.commits[gameState.headCommitId]) {
    parentFiles = gameState.commits[gameState.headCommitId].files;
  }
  
  const commitFiles = {
    ...parentFiles,
    ...gameState.stagedFiles
  };
  
  // コミットオブジェクトを作成
  const commit = new Commit(
    hash,
    gameState.headCommitId,
    message,
    commitFiles,
    gameState.isDetached ? 'detached' : gameState.activeBranch
  );
  
  gameState.commits[hash] = commit;
  
  // ブランチおよびHEADのポインタ移動
  if (!gameState.isDetached) {
    gameState.branches[gameState.activeBranch] = hash;
  }
  gameState.headCommitId = hash;
  
  // ファイルの状態をcommittedに更新
  for (const name of Object.keys(gameState.stagedFiles)) {
    gameState.files[name].status = 'committed';
  }
  
  // ステージのクリア
  gameState.stagedFiles = {};
  
  logTerminal(`[${gameState.activeBranch} ${hash}] ${message}\n ${Object.keys(commitFiles).length} files changed.`, 'success');
}

// --- git log ---
function simLog() {
  if (!gameState.headCommitId) {
    logTerminal("Error: コミット履歴がありません。", 'error');
    return;
  }
  
  let currentId = gameState.headCommitId;
  let logOutput = [];
  
  while (currentId) {
    const commit = gameState.commits[currentId];
    if (!commit) break;
    
    let branchInfo = '';
    // ブランチポインタがあればラベルを追記
    const labels = [];
    if (currentId === gameState.headCommitId) labels.push('HEAD');
    for (const [bName, bHash] of Object.entries(gameState.branches)) {
      if (bHash === currentId) labels.push(bName);
    }
    if (labels.length > 0) {
      branchInfo = ` <span style="color: var(--accent-green); font-weight: bold;">(${labels.join(', ')})</span>`;
    }
    
    logOutput.push(`commit <span style="color: var(--accent-cyan);">${commit.id}</span>${branchInfo}`);
    logOutput.push(`Author: you23 <you2.kuramoto@nifty.com>`);
    logOutput.push(`Date:   ${commit.timestamp.toLocaleDateString()}`);
    logOutput.push(`\n    ${commit.message}\n`);
    
    currentId = commit.parentId;
  }
  
  logTerminal(logOutput.join('\n'));
}

// --- git branch ---
function simBranch(branchName) {
  if (!branchName) {
    // 引数なしの場合はブランチ一覧を表示
    let output = [];
    for (const b of Object.keys(gameState.branches)) {
      if (b === gameState.activeBranch && !gameState.isDetached) {
        output.push(`* <span style="color: var(--accent-green);">${b}</span>`);
      } else {
        output.push(`  ${b}`);
      }
    }
    logTerminal(output.join('\n'));
    return;
  }
  
  if (gameState.branches[branchName]) {
    logTerminal(`Error: ブランチ '${branchName}' はすでに存在します。`, 'error');
    return;
  }
  
  // 現在のHEADコミットを指す新しいブランチを作成
  gameState.branches[branchName] = gameState.headCommitId;
  logTerminal(`Branch '${branchName}' created successfully.`);
}

// --- git checkout ---
function simCheckout(target) {
  if (!target) {
    logTerminal("Error: 切り替え先のブランチ名、またはコミットIDを指定してください。", 'error');
    return;
  }
  
  // 1. ブランチへの切り替え
  if (target in gameState.branches) {
    gameState.activeBranch = target;
    gameState.headCommitId = gameState.branches[target];
    gameState.isDetached = false;
    
    // ワーキングディレクトリのファイルを復元
    restoreFilesFromCommit(gameState.headCommitId);
    
    logTerminal(`Switched to branch '${target}'`, 'success');
    return;
  }
  
  // 2. コミットへの直接切り替え (Detached HEAD)
  if (target in gameState.commits) {
    gameState.headCommitId = target;
    gameState.isDetached = true;
    
    restoreFilesFromCommit(target);
    
    logTerminal(`Note: switching to '${target}'.\n\nYou are in 'detached HEAD' state. You can look around, make experimental changes and commit them...`, 'info');
    return;
  }
  
  logTerminal(`Error: '${target}' というブランチまたはコミットは見つかりません。`, 'error');
}

// --- git checkout -b <branch> ---
function simCheckoutB(branchName) {
  if (!branchName) {
    logTerminal("Error: 作成するブランチ名を指定してください。", 'error');
    return;
  }
  
  simBranch(branchName);
  simCheckout(branchName);
}

// --- git merge ---
function simMerge(sourceBranch) {
  if (!sourceBranch) {
    logTerminal("Error: マージ対象のブランチを指定してください。", 'error');
    return;
  }
  
  if (!(sourceBranch in gameState.branches)) {
    logTerminal(`Error: ブランチ '${sourceBranch}' は存在しません。`, 'error');
    return;
  }
  
  if (gameState.isDetached) {
    logTerminal("Error: デタッチドHEAD状態ではマージできません。", 'error');
    return;
  }
  
  if (gameState.activeBranch === sourceBranch) {
    logTerminal("すでに最新の状態です（同じブランチはマージできません）。");
    return;
  }
  
  const targetHash = gameState.branches[gameState.activeBranch]; // 現在のブランチ (e.g. main)
  const sourceHash = gameState.branches[sourceBranch]; // マージ元ブランチ (e.g. feature)
  
  if (!sourceHash) {
    logTerminal("Error: マージ元ブランチにコミット履歴がありません。", 'error');
    return;
  }
  
  // マージコミットの作成
  const hash = Math.random().toString(36).substring(2, 9);
  
  // 変更の結合 (両ブランチのファイル内容を統合)
  const targetFiles = targetHash ? gameState.commits[targetHash].files : {};
  const sourceFiles = gameState.commits[sourceHash].files;
  
  // コンフリクト判定（同じファイルを編集しており、内容が異なる場合）
  let conflict = false;
  let mergedFiles = { ...targetFiles, ...sourceFiles };
  
  // 今回の簡略化シミュレーション：
  // もし同一ファイルで内容が異なればマージをブロック（Stage 4 のクリア条件のため自動解決を前提とする）
  // ユーザーが Stage 4 をマージしたときは競合なくマージ成功とする
  
  const mergeCommit = new Commit(
    hash,
    targetHash, // 親はマージ先（現在のHEAD）
    `Merge branch '${sourceBranch}' into ${gameState.activeBranch}`,
    mergedFiles,
    gameState.activeBranch
  );
  
  // リポジトリにマージコミット追加
  gameState.commits[hash] = mergeCommit;
  gameState.branches[gameState.activeBranch] = hash;
  gameState.headCommitId = hash;
  
  // ワーキングディレクトリの同期
  restoreFilesFromCommit(hash);
  
  logTerminal(`Merge successful.\nCreated merge commit: ${hash}\nIntegrated changes from '${sourceBranch}' into '${gameState.activeBranch}'.`, 'success');
}

// --- Restore files from a specific commit ---
function restoreFilesFromCommit(commitId) {
  if (!commitId || !gameState.commits[commitId]) {
    gameState.files = {};
    return;
  }
  
  const commitFiles = gameState.commits[commitId].files;
  gameState.files = {};
  
  for (const [name, content] of Object.entries(commitFiles)) {
    gameState.files[name] = {
      content: content,
      status: 'committed'
    };
  }
  
  // エディタのアクティブファイルをクリア
  activeFileName = null;
  fileEditorTextarea.value = '';
  fileEditorTextarea.disabled = true;
  activeFileTitle.textContent = 'エディタ (未選択)';
  btnSaveFile.disabled = true;
}

// --- Check Stage Clearing Target Conditions ---
function checkStageClear() {
  const stage = STAGES[gameState.currentStage];
  const allCleared = stage.targets.every(t => t.check());
  
  if (allCleared) {
    showSuccessModal();
  }
}

// --- Success Modal Control ---
function showSuccessModal() {
  const stage = STAGES[gameState.currentStage];
  modalTitle.textContent = `Stage ${gameState.currentStage} Clear!`;
  
  if (gameState.currentStage === 4) {
    modalBodyText.textContent = "素晴らしい！すべてのステージをクリアして、Gitの主要な概念（コミット、チェックアウト、ブランチ、マージ）をマスターしました！";
    btnNextStage.textContent = "最初からプレイする";
  } else {
    modalBodyText.textContent = "ミッション目標をすべてクリアしました！これでGitの理解が一歩深まりました。";
    btnNextStage.textContent = "次のステージへ";
  }
  
  modalExplanationText.innerHTML = stage.explanation;
  successModal.classList.add('show');
}

function hideSuccessModal() {
  successModal.classList.remove('show');
}

// --- Event Listeners Setup ---

// Terminal Input
terminalInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const cmd = terminalInput.value;
    if (cmd) {
      executeGitCommand(cmd);
      terminalInput.value = '';
    }
  } else if (e.key === 'ArrowUp') {
    // 履歴を遡る
    if (gameState.commandHistory.length > 0 && gameState.historyIndex > 0) {
      gameState.historyIndex--;
      terminalInput.value = gameState.commandHistory[gameState.historyIndex];
    }
  } else if (e.key === 'ArrowDown') {
    // 履歴を進める
    if (gameState.historyIndex < gameState.commandHistory.length - 1) {
      gameState.historyIndex++;
      terminalInput.value = gameState.commandHistory[gameState.historyIndex];
    } else {
      gameState.historyIndex = gameState.commandHistory.length;
      terminalInput.value = '';
    }
  }
});

// File Manager: Create File
btnCreateFile.addEventListener('click', () => {
  const fileName = prompt("作成するファイル名を入力してください (例: index.html):");
  if (!fileName) return;
  
  if (gameState.files[fileName]) {
    alert("エラー: 同名のファイルがすでに存在します。");
    return;
  }
  
  gameState.files[fileName] = {
    content: `<!-- ${fileName} -->\n`,
    status: 'untracked'
  };
  
  logTerminal(`Created untracked file: ${fileName}`, 'info');
  updateUI();
  selectFile(fileName);
});

// File Manager: Save File Content
btnSaveFile.addEventListener('click', () => {
  if (!activeFileName) return;
  
  const currentStatus = gameState.files[activeFileName].status;
  gameState.files[activeFileName].content = fileEditorTextarea.value;
  
  // すでにコミット済みのファイルだった場合は status を modified に更新する
  if (currentStatus === 'committed' || currentStatus === 'staged') {
    gameState.files[activeFileName].status = 'modified';
    
    // ステージングエリアからもいったん削除（再addが必要）
    delete gameState.stagedFiles[activeFileName];
  }
  
  logTerminal(`Modified file: ${activeFileName}`, 'info');
  updateUI();
});

// Helper Operation Buttons
document.getElementById('btn-cmd-status').addEventListener('click', () => executeGitCommand('git status'));
document.getElementById('btn-cmd-add').addEventListener('click', () => executeGitCommand('git add .'));
document.getElementById('btn-cmd-commit').addEventListener('click', () => {
  const msg = prompt("コミットメッセージを入力してください:", "Add modifications");
  if (msg) executeGitCommand(`git commit -m "${msg}"`);
});
document.getElementById('btn-cmd-log').addEventListener('click', () => executeGitCommand('git log'));

// Stage Selector
stageSelect.addEventListener('change', (e) => {
  initGame(parseInt(e.target.value));
});

// Modal: Next Stage Button
btnNextStage.addEventListener('click', () => {
  hideSuccessModal();
  if (gameState.currentStage === 4) {
    initGame(1);
  } else {
    initGame(gameState.currentStage + 1);
  }
});

// Windows Size Adjustment for Canvas
window.addEventListener('resize', () => {
  renderCommitGraph();
});

// Start Game
initGame(1);
