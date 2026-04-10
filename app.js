const homeIntents = ['进店看新品', '帮我找优惠', '通勤穿搭推荐', '帮我找风衣'];
const detailIntents = ['尺码推荐', 'AI试衣建议', '搭配这件商品', '怎么买更划算'];

const products = [
  {
    id: 'p1',
    name: '亚麻解构西装外套',
    price: 1580,
    tag: 'NEW',
    color: '#e7dfd1',
    desc: '亚麻混纺材质，轻量透气，适合春夏通勤与轻户外。'
  },
  {
    id: 'p2',
    name: 'LESS 立领短夹克',
    price: 1680,
    tag: '热卖',
    color: '#d4c9ba',
    desc: '立领廓形，适合叠穿，兼顾通勤和休闲场景。'
  },
  {
    id: 'p3',
    name: '不规则下摆连衣裙',
    price: 1980,
    tag: 'NEW',
    color: '#cfc6b6',
    desc: '不规则剪裁提升层次感，日常出街更有辨识度。'
  },
  {
    id: 'p4',
    name: 'LESS 春季薄风衣',
    price: 1380,
    tag: '同风格',
    color: '#dad2c5',
    desc: '轻薄防风，版型利落，适合早春温差天气。'
  },
  {
    id: 'p5',
    name: '宽松针织开衫',
    price: 1280,
    tag: '通勤',
    color: '#cec4b6',
    desc: '柔软针织面料，版型宽松，搭配衬衫或连衣裙都合适。'
  },
  {
    id: 'p6',
    name: '天丝衬衫连衣裙',
    price: 1480,
    tag: '预售',
    color: '#c7bcaf',
    desc: '天丝面料垂感好，通勤与周末场景切换自然。'
  },
  {
    id: 'p7',
    name: '高腰亚麻阔腿裤',
    price: 1080,
    tag: '搭配',
    color: '#ddd5c8',
    desc: '高腰阔腿版型，显腿长，适配多种上装。'
  },
  {
    id: 'p8',
    name: '拼接设计印花T恤',
    price: 580,
    tag: '优惠',
    color: '#e4ddd0',
    desc: '印花拼接设计，单穿或内搭都能提升视觉重点。'
  }
];

const state = {
  detailOpen: false,
  historyOpen: false,
  selectedProductId: null,
  viewed: [],
  canvasItems: [],
  activeChip: '',
  pending: false
};

const dom = {
  storeSub: document.getElementById('storeSub'),
  welcomeText: document.getElementById('welcomeText'),
  feedMeta: document.getElementById('feedMeta'),
  feedGrid: document.getElementById('feedGrid'),
  canvasStack: document.getElementById('canvasStack'),
  intentStrip: document.getElementById('intentStrip'),
  intentInput: document.getElementById('intentInput'),
  sendBtn: document.getElementById('sendBtn'),
  detailOverlay: document.getElementById('detailOverlay'),
  detailCloseBtn: document.getElementById('detailCloseBtn'),
  detailAiBtn: document.getElementById('detailAiBtn'),
  historySheet: document.getElementById('historySheet'),
  historyList: document.getElementById('historyList'),
  historyCloseBtn: document.getElementById('historyCloseBtn'),
  detailImage: document.getElementById('detailImage'),
  detailImageLabel: document.getElementById('detailImageLabel'),
  detailPrice: document.getElementById('detailPrice'),
  detailTag: document.getElementById('detailTag'),
  detailName: document.getElementById('detailName'),
  detailDesc: document.getElementById('detailDesc'),
  detailInsight: document.getElementById('detailInsight'),
  bundleList: document.getElementById('bundleList'),
  buyPrice: document.getElementById('buyPrice')
};

function money(price) {
  return `¥${price.toLocaleString('zh-CN')}`;
}

function timeLabel() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function findProductById(id) {
  return products.find((item) => item.id === id);
}

function renderFeed() {
  dom.feedGrid.innerHTML = products
    .map(
      (item) => `
      <article class="product-card">
        <div class="product-thumb" style="background:${item.color}">
          <span class="tag-badge">${item.tag}</span>
          <span>${item.name}</span>
        </div>
        <div class="product-info">
          <p class="product-name">${item.name}</p>
          <div class="product-meta">
            <span class="price">${money(item.price)}</span>
            <button type="button" data-open="${item.id}">看详情</button>
          </div>
        </div>
      </article>
    `
    )
    .join('');
}

function renderIntentStrip(list) {
  dom.intentStrip.innerHTML = list
    .map(
      (item) =>
        `<button class="intent-chip ${state.activeChip === item ? 'active' : ''}" type="button" data-intent="${item}">${item}</button>`
    )
    .join('');
}

function renderCanvas() {
  if (!state.canvasItems.length) {
    dom.canvasStack.innerHTML = '';
    return;
  }

  dom.canvasStack.innerHTML = state.canvasItems
    .map((item) => {
      const picksHtml = item.picks.length
        ? `<div class="canvas-picks">
            ${item.picks
              .map(
                (pick) => `
              <div class="canvas-pick">
                <div class="canvas-pick-thumb" style="background:${pick.color}"></div>
                <div class="canvas-pick-info">
                  <div class="canvas-pick-name">${pick.name}</div>
                  <div class="canvas-pick-price">${money(pick.price)}</div>
                </div>
                <button type="button" data-open="${pick.id}">详情</button>
              </div>
            `
              )
              .join('')}
          </div>`
        : '';

      return `
        <article class="canvas-card">
          <div class="user-bubble">${item.question}</div>
          <div class="assistant-bubble">${item.answer}</div>
          ${picksHtml}
        </article>
      `;
    })
    .join('');
}

function currentIntentList() {
  const base = state.detailOpen ? detailIntents : homeIntents;
  if (!state.detailOpen && state.viewed.length > 0) {
    return ['店内足迹', ...base];
  }
  return base;
}

function buildAnswer(query) {
  const q = query.trim();
  const lc = q.toLowerCase();
  const selected = findProductById(state.selectedProductId);

  if (state.detailOpen && selected) {
    if (q.includes('尺码')) {
      return {
        answer: `基于你的历史购买和这件 ${selected.name} 的版型，我建议优先试 S 码；如果喜欢更宽松可试 M 码。`,
        picks: []
      };
    }

    if (q.includes('试衣') || lc.includes('ai')) {
      return {
        answer: `已为你生成这件 ${selected.name} 的 AI 试衣建议：推荐搭配浅色内搭与直筒裤，整体更利落。`,
        picks: [selected]
      };
    }

    if (q.includes('优惠') || q.includes('便宜') || q.includes('折')) {
      return {
        answer: `这件商品当前可叠加会员券，预计到手 ${money(Math.round(selected.price * 0.88))}，再加购同系列下装还有套装减免。`,
        picks: [selected]
      };
    }

    return {
      answer: `关于 ${selected.name}，你可以继续问我尺码、试衣效果、搭配方案或优惠规则，我会直接在当前页承接。`,
      picks: [selected]
    };
  }

  if (q.includes('新品') || q.includes('上新')) {
    return {
      answer: '根据你的进店意图，我先把新品中匹配度最高的 3 款放在这里，你可以直接打开详情继续追问。',
      picks: products.slice(0, 3)
    };
  }

  if (q.includes('优惠') || q.includes('便宜') || q.includes('券')) {
    const picks = products.filter((item) => item.price <= 1380).slice(0, 3);
    return {
      answer: '你当前可用 2 张店铺券，我先给你筛了更划算的款式，并按到手价优先排序。',
      picks
    };
  }

  if (q.includes('风衣') || q.includes('外套')) {
    const picks = products.filter((item) => item.name.includes('风衣') || item.name.includes('外套')).slice(0, 3);
    return {
      answer: '已根据你的描述筛到同风格外套，版型都偏利落，适合通勤场景。',
      picks
    };
  }

  return {
    answer: '收到你的意图。我先给你一个高匹配结果集合，你也可以进一步限定预算、颜色或场景。',
    picks: products.slice(1, 4)
  };
}

function setPending(pending) {
  state.pending = pending;
  dom.sendBtn.disabled = pending;
  dom.sendBtn.textContent = pending ? '思考中...' : '发送';
  dom.intentInput.disabled = pending;
}

function normalizeServerPicks(rawPicks) {
  if (!Array.isArray(rawPicks)) {
    return [];
  }

  return rawPicks
    .map((pick) => {
      if (typeof pick === 'string') {
        return findProductById(pick);
      }

      if (pick && typeof pick === 'object' && typeof pick.id === 'string') {
        return findProductById(pick.id);
      }

      return null;
    })
    .filter(Boolean)
    .slice(0, 3);
}

async function fetchServerAnswer(query) {
  const payload = {
    query,
    context: {
      detailOpen: state.detailOpen,
      currentProductId: state.selectedProductId,
      viewedProductIds: state.viewed.map((item) => item.id),
      allowedProductIds: products.map((item) => item.id)
    }
  };

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`chat api status ${response.status}`);
  }

  const data = await response.json();
  if (!data || typeof data.answer !== 'string' || !data.answer.trim()) {
    throw new Error('invalid chat payload');
  }

  return {
    answer: data.answer.trim(),
    picks: normalizeServerPicks(data.picks)
  };
}

async function sendIntent(manualText) {
  const text = (manualText || dom.intentInput.value).trim();
  if (!text || state.pending) {
    return;
  }

  setPending(true);
  let result = null;

  try {
    result = await fetchServerAnswer(text);
  } catch (_error) {
    result = buildAnswer(text);
  } finally {
    setPending(false);
  }

  state.canvasItems.unshift({
    question: text,
    answer: result.answer,
    picks: result.picks,
    createdAt: timeLabel()
  });

  dom.intentInput.value = '';
  state.activeChip = text;
  dom.storeSub.textContent = `已承接意图：${text}`;
  dom.feedMeta.textContent = `最后更新 ${timeLabel()}`;

  renderCanvas();
  renderIntentStrip(currentIntentList());
  closeHistorySheet();
}

function upsertViewed(productId) {
  const existsIndex = state.viewed.findIndex((item) => item.id === productId);
  const viewedItem = {
    id: productId,
    time: timeLabel()
  };

  if (existsIndex >= 0) {
    state.viewed.splice(existsIndex, 1);
  }

  state.viewed.unshift(viewedItem);
}

function openDetail(productId) {
  const product = findProductById(productId);
  if (!product) {
    return;
  }

  state.selectedProductId = product.id;
  state.detailOpen = true;
  state.activeChip = '';

  closeHistorySheet();
  upsertViewed(product.id);
  renderDetail(product);
  renderIntentStrip(currentIntentList());

  dom.detailOverlay.classList.add('open');
  dom.detailOverlay.setAttribute('aria-hidden', 'false');
  dom.storeSub.textContent = `正在承接：${product.name}`;
  dom.feedMeta.textContent = '详情浮层已打开';
  dom.intentInput.placeholder = '继续问这件商品：尺码、试衣、优惠、搭配';
}

function closeDetail() {
  state.detailOpen = false;
  state.activeChip = '';

  dom.detailOverlay.classList.remove('open');
  dom.detailOverlay.setAttribute('aria-hidden', 'true');
  dom.storeSub.textContent = '已返回 Feeds，可继续提问或查看店内足迹';
  dom.feedMeta.textContent = `最后更新 ${timeLabel()}`;
  dom.intentInput.placeholder = '在店内随时提问：找商品、问优惠、要搭配...';

  renderIntentStrip(currentIntentList());
}

function renderDetail(product) {
  dom.detailImage.style.background = product.color;
  dom.detailImageLabel.textContent = product.name;
  dom.detailPrice.textContent = money(product.price);
  dom.detailTag.textContent = product.tag;
  dom.detailName.textContent = product.name;
  dom.detailDesc.textContent = product.desc;
  dom.detailInsight.textContent = `你最近浏览了同风格单品，${product.name} 在版型与颜色上和你的偏好匹配度较高，建议优先试 S 码。`;
  dom.buyPrice.textContent = money(product.price);

  const bundles = products
    .filter((item) => item.id !== product.id)
    .slice(0, 2)
    .map(
      (item) => `
      <div class="bundle-item">
        <span>${item.name}</span>
        <strong>${money(item.price)}</strong>
      </div>
    `
    )
    .join('');

  dom.bundleList.innerHTML = bundles;
}

function renderHistorySheet() {
  if (!state.viewed.length) {
    dom.historyList.innerHTML = '<div class="empty-sheet">还没有浏览足迹，先去点开一件商品看看吧。</div>';
    return;
  }

  dom.historyList.innerHTML = state.viewed
    .map((viewed) => {
      const product = findProductById(viewed.id);
      if (!product) {
        return '';
      }

      return `
        <article class="sheet-item">
          <div class="sheet-thumb" style="background:${product.color}"></div>
          <div>
            <div class="sheet-name">${product.name}</div>
            <div class="sheet-meta">${money(product.price)} · ${viewed.time} 浏览</div>
          </div>
          <button type="button" data-open="${product.id}">重看</button>
        </article>
      `;
    })
    .join('');
}

function openHistorySheet() {
  renderHistorySheet();
  state.historyOpen = true;
  state.activeChip = '店内足迹';
  renderIntentStrip(currentIntentList());
  dom.historySheet.classList.add('open');
  dom.historySheet.setAttribute('aria-hidden', 'false');
}

function closeHistorySheet() {
  state.historyOpen = false;
  if (state.activeChip === '店内足迹') {
    state.activeChip = '';
    renderIntentStrip(currentIntentList());
  }
  dom.historySheet.classList.remove('open');
  dom.historySheet.setAttribute('aria-hidden', 'true');
}

function bindEvents() {
  dom.feedGrid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-open]');
    if (!button) {
      return;
    }

    openDetail(button.dataset.open);
  });

  dom.canvasStack.addEventListener('click', (event) => {
    const button = event.target.closest('[data-open]');
    if (!button) {
      return;
    }

    openDetail(button.dataset.open);
  });

  dom.intentStrip.addEventListener('click', (event) => {
    const target = event.target.closest('[data-intent]');
    if (!target) {
      return;
    }

    const intent = target.dataset.intent;
    if (intent === '店内足迹') {
      if (state.historyOpen) {
        closeHistorySheet();
      } else {
        openHistorySheet();
      }
      return;
    }

    void sendIntent(intent);
  });

  dom.sendBtn.addEventListener('click', () => {
    void sendIntent();
  });

  dom.intentInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void sendIntent();
    }
  });

  dom.detailCloseBtn.addEventListener('click', () => {
    closeDetail();
  });

  dom.detailAiBtn.addEventListener('click', () => {
    void sendIntent('AI试衣建议');
  });

  dom.historyCloseBtn.addEventListener('click', () => {
    closeHistorySheet();
  });

  dom.historyList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-open]');
    if (!button) {
      return;
    }

    closeHistorySheet();
    openDetail(button.dataset.open);
  });
}

function init() {
  renderFeed();
  renderIntentStrip(currentIntentList());
  bindEvents();
}

init();
