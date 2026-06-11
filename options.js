/**
 * BanG Dream! 贴纸扩展 - 设置页面脚本
 *
 * 功能：
 * - 管理用户设置（显示模式、乐队选择、角色多选、概率、大小）
 * - 动态生成乐队选择器（带交错入场动画）
 * - 动态生成角色多选网格（与乐队联动）
 * - 与 chrome.storage.sync 同步数据
 * - 丰富的微交互反馈（涟漪、弹性动画等）
 *
 * @version 1.0.0
 */

// ===== 默认设置 =====

const DEFAULT_SETTINGS = {
  enabled: true,
  displayMode: "random_mix",
  selectedBand: "poppinparty",
  /** 角色多选列表（角色子目录名数组），空数组 = 显示该乐队所有角色 */
  selectedCharacters: [],
  appearanceProbability: 100,
  sizeScale: 75,
  /** 贴纸透明度（20-100），100 = 完全不透明 */
  stickerOpacity: 100,
  /** 阴影强度倍率（0-200），100 = 默认阴影 */
  shadowIntensity: 100
};

// ===== DOM元素引用 =====

const form = document.getElementById("settings-form");
const appearanceProbabilityInput = document.getElementById("appearance-probability");
const sizeScaleInput = document.getElementById("size-scale");
const appearanceProbabilityValue = document.getElementById("appearance-probability-value");
const sizeScaleValue = document.getElementById("size-scale-value");
/** 透明度滑块及显示 */
const stickerOpacityInput = document.getElementById("sticker-opacity");
const stickerOpacityValue = document.getElementById("sticker-opacity-value");
/** 阴影强度滑块及显示 */
const shadowIntensityInput = document.getElementById("shadow-intensity");
const shadowIntensityValue = document.getElementById("shadow-intensity-value");
const resetButton = document.getElementById("reset-button");
const status = document.getElementById("status");

/** 显示模式单选按钮 */
const displayModeInputs = document.querySelectorAll('input[name="displayMode"]');

/** 乐队选择器容器 */
const bandSelector = document.getElementById("band-selector");
const bandGrid = document.getElementById("band-grid");

/** 角色多选器容器 */
const characterSelector = document.getElementById("character-selector");
const characterGrid = document.getElementById("character-grid");
const selectAllCharsBtn = document.getElementById("select-all-chars");
const deselectAllCharsBtn = document.getElementById("deselect-all-chars");

/** 当前选中的乐队ID（内存状态，用于联动角色面板） */
let currentBandId = DEFAULT_SETTINGS.selectedBand;

// ===== 工具函数 =====

/**
 * 将值限制在指定范围内
 * @param {number} value - 输入值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 限制后的值
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * 规范化用户设置，确保所有值在有效范围内
 * @param {Object} settings - 原始设置对象
 * @returns {Object} 规范化后的设置对象
 */
function normalizeSettings(settings) {
  return {
    enabled: settings.enabled !== false,
    displayMode: ["random_mix", "band_specific"].includes(settings.displayMode)
      ? settings.displayMode
      : DEFAULT_SETTINGS.displayMode,
    selectedBand: Object.keys(BANDS_CONFIG).includes(settings.selectedBand)
      ? settings.selectedBand
      : DEFAULT_SETTINGS.selectedBand,
    /** 确保 selectedCharacters 为有效数组，且成员均为字符串 */
    selectedCharacters: Array.isArray(settings.selectedCharacters)
      ? settings.selectedCharacters.filter((c) => typeof c === "string")
      : DEFAULT_SETTINGS.selectedCharacters,
    appearanceProbability: Math.round(
      clamp(Number(settings.appearanceProbability) || DEFAULT_SETTINGS.appearanceProbability, 0, 100)
    ),
    sizeScale: Math.round(
      clamp(Number(settings.sizeScale) || DEFAULT_SETTINGS.sizeScale, 50, 150)
    ),
    /** 透明度：20（最淡）~ 100（不透明） */
    stickerOpacity: Math.round(
      clamp(Number(settings.stickerOpacity) ?? DEFAULT_SETTINGS.stickerOpacity, 20, 100)
    ),
    /** 阴影强度：0（无阴影）~ 200（双倍光晕） */
    shadowIntensity: Math.round(
      clamp(Number(settings.shadowIntensity) ?? DEFAULT_SETTINGS.shadowIntensity, 0, 200)
    )
  };
}

/**
 * 更新滑块输出显示值（带数字跳动动画效果）
 * 同时更新滑块轨道的 CSS 渐变填充进度
 * 并驱动透明度/阴影预览元素的实时视觉反馈
 */
function updateOutputs() {
  animateValue(appearanceProbabilityValue, `${appearanceProbabilityInput.value}%`);
  animateValue(sizeScaleValue, `${sizeScaleInput.value}%`);
  animateValue(stickerOpacityValue, `${stickerOpacityInput.value}%`);
  animateValue(shadowIntensityValue, `${shadowIntensityInput.value}%`);

  /* 同步更新所有滑块轨道渐变填充宽度 */
  updateRangeFill(appearanceProbabilityInput);
  updateRangeFill(sizeScaleInput);
  updateRangeFill(stickerOpacityInput);
  updateRangeFill(shadowIntensityInput);

  /* 驱动透明度预览：星星随值淡入淡出 */
  const star = document.querySelector(".preview-star");
  if (star) {
    star.style.opacity = stickerOpacityInput.value / 100;
  }

  /* 驱动阴影预览：光球光晕随强度缩放 */
  const orb = document.querySelector(".preview-orb");
  if (orb) {
    const intensity = Number(shadowIntensityInput.value);
    const scale = intensity / 100;
    orb.style.boxShadow = `
      0 ${2 * scale}px ${8 * scale}px rgba(255, 107, 157, ${0.25 * scale}),
      0 ${4 * scale}px ${16 * scale}px rgba(139, 92, 246, ${0.15 * scale})
    `;
    if (intensity > 120) {
      /* 超过 120% 时添加粉色外发光 */
      orb.style.boxShadow += `, 0 0 ${20 * scale}px rgba(255, 107, 157, ${0.2 * (intensity - 100) / 100})`;
    }
    orb.style.transform = `scale(${0.85 + 0.3 * scale})`;
  }
}

/**
 * 根据当前值计算并设置滑块的 --value-percent CSS 变量
 * 使 WebKit 滑块轨道的 ::before 伪元素正确显示进度填充
 * @param {HTMLInputElement} rangeInput - 滑块 input 元素
 */
function updateRangeFill(rangeInput) {
  const min = Number(rangeInput.min) || 0;
  const max = Number(rangeInput.max) || 100;
  const val = Number(rangeInput.value);
  const percent = ((val - min) / (max - min)) * 100;
  rangeInput.style.setProperty("--value-percent", `${percent}%`);
}

/**
 * 数字变化时的微动画
 * @param {HTMLElement} element - 目标元素
 * @param {string} newValue - 新文本值
 */
function animateValue(element, newValue) {
  if (element.textContent === newValue) return;

  element.style.transform = "scale(1.15)";
  element.style.transition = "transform 0.15s ease";
  element.textContent = newValue;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      element.style.transform = "scale(1)";
    });
  });
}

/**
 * 将设置应用到表单控件
 * @param {Object} settings - 设置对象
 */
function applyToForm(settings) {
  // 应用显示模式
  const modeInput = document.querySelector(`input[name="displayMode"][value="${settings.displayMode}"]`);
  if (modeInput) {
    modeInput.checked = true;
  }

  // 应用选中的乐队
  currentBandId = settings.selectedBand;
  updateSelectedBand(settings.selectedBand);

  // 应用角色多选
  generateCharacterGrid(settings.selectedBand);
  applyCharacterSelections(settings.selectedCharacters);

  // 应用滑块值
  appearanceProbabilityInput.value = settings.appearanceProbability;
  sizeScaleInput.value = settings.sizeScale;
  stickerOpacityInput.value = settings.stickerOpacity;
  shadowIntensityInput.value = settings.shadowIntensity;

  // 更新显示
  updateOutputs();

  // 更新乐队/角色选择器的可见性（带过渡动画）
  toggleBandSelectorVisibility(settings.displayMode);
  if (settings.displayMode === "band_specific") {
    showCharacterSelector();
  }
}

/**
 * 设置状态提示信息（带淡入动画）
 * @param {string} message - 提示文本
 */
function setStatus(message) {
  status.style.opacity = "0";
  status.style.transform = "translateY(-4px)";

  status.textContent = message;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      status.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      status.style.opacity = "1";
      status.style.transform = "translateY(0)";
    });
  });

  // 5秒后自动清除
  setTimeout(() => {
    if (status.textContent === message) {
      status.style.opacity = "0";
      setTimeout(() => { status.textContent = ""; }, 300);
    }
  }, 5000);
}

// ===== 乐队选择器生成与交互 =====

/**
 * 动态生成乐队选择网格
 * 根据 bands.config.js 中的配置创建可点击的乐队卡片
 * 每张卡片带有交错入场动画（staggered reveal）
 */
function generateBandGrid() {
  bandGrid.innerHTML = "";

  const bandIds = Object.keys(BANDS_CONFIG);

  bandIds.forEach((bandId, index) => {
    const band = BANDS_CONFIG[bandId];

    // 创建乐队卡片
    const card = document.createElement("button");
    card.type = "button";
    card.className = "band-card";
    card.dataset.bandId = bandId;
    card.setAttribute("aria-pressed", "false");
    card.setAttribute("role", "radio");
    card.setAttribute("aria-label", `${band.name.zh} (${band.name.en})`);

    // 设置交错延迟动画
    card.style.opacity = "0";
    card.style.transform = "translateY(16px)";

    // 卡片内容
    card.innerHTML = `
      <div class="band-card__color-bar" style="background: linear-gradient(90deg, ${band.color}, ${adjustColor(band.color, 30)})"></div>
      <div class="band-card__content">
        <span class="band-card__name">${band.name.zh}</span>
        <span class="band-card__name-en">${band.name.en}</span>
      </div>
      <div class="band-card__check">&#10003;</div>
    `;

    // 点击事件（带涟漪效果 + 联动角色面板）
    card.addEventListener("click", () => {
      createRipple(card, event);
      selectBand(bandId);
      // 切换乐队时重新生成角色网格
      currentBandId = bandId;
      generateCharacterGrid(bandId);
      showCharacterSelector();
    });

    bandGrid.appendChild(card);

    // 交错入场动画
    setTimeout(() => {
      card.style.transition = "opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1), transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, 60 + index * 50);
  });
}

/**
 * 调整颜色亮度
 * @param {string} hex - 十六进制颜色
 * @param {number} percent - 调整百分比
 * @returns {string} 调整后的颜色
 */
function adjustColor(hex, percent) {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

/**
 * 创建点击涟漪效果
 * @param {HTMLElement} element - 目标元素
 * @param {Event} event - 点击事件
 */
function createRipple(element, event) {
  // 移除旧的涟漪
  const oldRipple = element.querySelector(".ripple");
  if (oldRipple) oldRipple.remove();

  const ripple = document.createElement("span");
  ripple.className = "ripple";

  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    transform: scale(0);
    animation: ripple-expand 0.5s ease-out forwards;
    pointer-events: none;
    z-index: 1;
  `;

  // 注入动画关键帧（仅一次）
  if (!document.querySelector("#ripple-style")) {
    const style = document.createElement("style");
    style.id = "ripple-style";
    style.textContent = `
      @keyframes ripple-expand {
        to { transform: scale(2.5); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  element.style.position = "relative";
  element.style.overflow = "hidden";
  element.appendChild(ripple);

  setTimeout(() => ripple.remove(), 500);
}

/**
 * 选择指定乐队（带视觉反馈）
 * @param {string} bandId - 乐队ID
 */
function selectBand(bandId) {
  const cards = bandGrid.querySelectorAll(".band-card");

  cards.forEach((card) => {
    const isSelected = card.dataset.bandId === bandId;
    const wasSelected = card.classList.contains("band-card--selected");

    if (isSelected && !wasSelected) {
      // 新选中：添加弹跳动画
      card.classList.add("band-card--selected");
      card.setAttribute("aria-pressed", "true");
      card.setAttribute("aria-checked", "true");
      card.style.transform = "translateY(-4px) scale(1.02)";
      setTimeout(() => {
        card.style.transform = "";
      }, 180);
    } else if (!isSelected && wasSelected) {
      // 取消选中：平滑过渡
      card.classList.remove("band-card--selected");
      card.setAttribute("aria-pressed", "false");
      card.setAttribute("aria-checked", "false");
    } else if (isSelected) {
      card.classList.add("band-card--selected");
      card.setAttribute("aria-pressed", "true");
      card.setAttribute("aria-checked", "true");
    }
  });

  console.log(`[bandori-options] 已选择乐队: ${BANDS_CONFIG[bandId]?.name.zh}`);
}

/**
 * 更新选中的乐队（不触发额外动画，用于加载设置时）
 * @param {string} bandId - 乐队ID
 */
function updateSelectedBand(bandId) {
  const cards = bandGrid.querySelectorAll(".band-card");
  cards.forEach((card) => {
    const isSelected = card.dataset.bandId === bandId;
    card.classList.toggle("band-card--selected", isSelected);
    card.setAttribute("aria-pressed", String(isSelected));
    card.setAttribute("aria-checked", String(isSelected));
  });
}

/**
 * 获取当前选中的乐队ID
 * @returns {string} 选中的乐队ID，或默认值
 */
function getSelectedBand() {
  const selectedCard = bandGrid.querySelector(".band-card--selected");
  return selectedCard?.dataset.bandId || DEFAULT_SETTINGS.selectedBand;
}

/**
 * 切换乐队选择器的可见性（带高度过渡动画）
 * 仅在"指定乐队"模式下显示
 * 同时控制角色选择器的显隐
 * @param {string} displayMode - 当前显示模式
 */
function toggleBandSelectorVisibility(displayMode) {
  if (displayMode === "band_specific") {
    bandSelector.style.display = "";

    // 触发展开动画
    bandSelector.style.opacity = "0";
    bandSelector.style.transform = "translateY(-8px)";
    bandSelector.style.maxHeight = "0";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bandSelector.style.transition = "opacity 0.35s ease, transform 0.35s ease, max-height 0.35s ease";
        bandSelector.style.opacity = "1";
        bandSelector.style.transform = "translateY(0)";
        bandSelector.style.maxHeight = bandSelector.scrollHeight + 200 + "px";
      });
    });
  } else {
    // 收起动画
    bandSelector.style.transition = "opacity 0.25s ease, transform 0.25s ease";
    bandSelector.style.opacity = "0";
    bandSelector.style.transform = "translateY(-6px)";

    hideCharacterSelector();

    setTimeout(() => {
      bandSelector.style.display = "none";
      bandSelector.style.transform = "";
      bandSelector.style.maxHeight = "";
    }, 250);
  }
}

// ===== 角色多选网格生成与交互 =====

/**
 * SVG 勾号图标模板（用于复选框选中状态）
 * @type {string}
 */
const CHECK_SVG = `<svg viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3"/></svg>`;

/**
 * 动态生成角色多选网格
 * 根据 bands.config.js 中选中乐队的 characters 配置创建可勾选的角色卡片
 * 仅展示实际存在图片资源的角色（characters key 与磁盘文件夹名一致）
 * 带有交错入场动画
 *
 * @param {string} bandId - 当前选中的乐队ID
 */
function generateCharacterGrid(bandId) {
  characterGrid.innerHTML = "";
  const band = BANDS_CONFIG[bandId];
  if (!band) return;

  /**
   * 使用 characters 对象的 key 作为数据源（这些 key 与磁盘文件夹名一致），
   * 确保每个可选项都有对应的图片资源。
   * 若该乐队无任何角色图片资源（characters 为空），显示提示文字。
   */
  const charKeys = Object.keys(band.characters || {});

  if (charKeys.length === 0) {
    // 该乐队暂无角色图片资源，显示提示
    const hint = document.createElement("p");
    hint.className = "control__hint";
    hint.style.textAlign = "center";
    hint.style.padding = "16px 0";
    hint.textContent = `${band.name.zh} 暂无角色贴纸资源，将显示该乐队全部可用贴纸`;
    characterGrid.appendChild(hint);
    return;
  }

  charKeys.forEach((dirKey, index) => {
    const charConfig = band.characters[dirKey] || {};
    const card = document.createElement("div");
    card.className = "char-card";
    /** 使用 characters 的 key（即磁盘文件夹名）作为存储和过滤标识 */
    card.dataset.charKey = dirKey;
    card.setAttribute("role", "checkbox");
    card.setAttribute("aria-checked", "false");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `${charConfig.displayName || dirKey}${charConfig.displayNameEn ? ` (${charConfig.displayNameEn})` : ""}`);

    // 设置交错延迟动画
    card.style.opacity = "0";
    card.style.transform = "translateY(10px)";

    card.innerHTML = `
      <div class="char-card__checkbox">${CHECK_SVG}</div>
      <div class="char-card__info">
        <span class="char-card__name">${charConfig.displayName || dirKey}</span>
        ${charConfig.displayNameEn ? `<span class="char-card__name-en">${charConfig.displayNameEn}</span>` : ""}
      </div>
    `;

    // 点击切换选中状态
    card.addEventListener("click", () => {
      toggleCharacterCard(card);
    });

    // 键盘支持：空格/回车切换
    card.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        toggleCharacterCard(card);
      }
    });

    characterGrid.appendChild(card);

    // 交错入场动画
    setTimeout(() => {
      card.style.transition = "opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1), transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, 40 + index * 40);
  });
}

/**
 * 切换单个角色卡片的选中状态（带弹性动画反馈）
 * @param {HTMLElement} card - 角色 DOM 元素
 */
function toggleCharacterCard(card) {
  const isChecked = card.classList.toggle("char-card--checked");
  card.setAttribute("aria-checked", String(isChecked));

  if (isChecked) {
    // 选中弹跳效果
    card.style.transform = "scale(1.03)";
    setTimeout(() => {
      card.style.transform = "";
    }, 150);
  }
}

/**
 * 从角色网格中获取当前已选中的角色 key 列表
 * @returns {string[]} 已选中的角色子目录名数组
 */
function getSelectedCharacters() {
  const checkedCards = characterGrid.querySelectorAll(".char-card--checked");
  return Array.from(checkedCards).map((card) => card.dataset.charKey);
}

/**
 * 应用已保存的角色选中状态到 UI（不触发动画，用于加载设置时恢复）
 * @param {string[]} selectedKeys - 已选中的角色 key 数组
 */
function applyCharacterSelections(selectedKeys) {
  if (!Array.isArray(selectedKeys)) return;
  const cards = characterGrid.querySelectorAll(".char-card");
  const keySet = new Set(selectedKeys);
  cards.forEach((card) => {
    const isSelected = keySet.has(card.dataset.charKey);
    card.classList.toggle("char-card--checked", isSelected);
    card.setAttribute("aria-checked", String(isSelected));
  });
}

/**
 * 全选当前乐队的所有角色
 */
function selectAllCharacters() {
  const cards = characterGrid.querySelectorAll(".char-card");
  cards.forEach((card, i) => {
    if (!card.classList.contains("char-card--checked")) {
      setTimeout(() => {
        card.classList.add("char-card--checked");
        card.setAttribute("aria-checked", "true");
        card.style.transform = "scale(1.03)";
        setTimeout(() => { card.style.transform = ""; }, 120);
      }, i * 40);
    }
  });
}

/**
 * 取消选中当前乐队的所有角色
 */
function deselectAllCharacters() {
  const cards = characterGrid.querySelectorAll(".char-card--checked");
  cards.forEach((card) => {
    card.classList.remove("char-card--checked");
    card.setAttribute("aria-checked", "false");
  });
}

/**
 * 显示角色选择器（带展开动画）
 */
function showCharacterSelector() {
  characterSelector.style.display = "";
  characterSelector.style.opacity = "0";
  characterSelector.style.transform = "translateY(-6px)";
  characterSelector.style.maxHeight = "0";

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      characterSelector.style.transition = "opacity 0.35s ease, transform 0.35s ease, max-height 0.35s ease";
      characterSelector.style.opacity = "1";
      characterSelector.style.transform = "translateY(0)";
      characterSelector.style.maxHeight = characterSelector.scrollHeight + 100 + "px";
    });
  });
}

/**
 * 隐藏角色选择器（带收起动画）
 */
function hideCharacterSelector() {
  characterSelector.style.transition = "opacity 0.25s ease, transform 0.25s ease";
  characterSelector.style.opacity = "0";
  characterSelector.style.transform = "translateY(-4px)";

  setTimeout(() => {
    characterSelector.style.display = "none";
    characterSelector.style.transform = "";
    characterSelector.style.maxHeight = "";
  }, 250);
}

// ===== 数据持久化 =====

/**
 * 从 chrome.storage.sync 加载设置并应用到表单
 * 包含旧版值迁移检测和修正
 * @returns {Promise<void>}
 */
async function loadSettings() {
  try {
    const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);

    // 迁移检测：如果 sizeScale 超过新上限(150)，回退到默认值
    const rawSizeScale = Number(stored.sizeScale);
    if (rawSizeScale > 150) {
      console.warn(
        `[bandori-options] 检测到旧版 sizeScale (${rawSizeScale}%)，`,
        `已自动修正为 ${DEFAULT_SETTINGS.sizeScale}%`
      );
      stored.sizeScale = DEFAULT_SETTINGS.sizeScale;
      // 静默回写修正后的值
      chrome.storage.sync.set({ sizeScale: DEFAULT_SETTINGS.sizeScale }).catch(() => {});
    }

    const settings = normalizeSettings(stored);
    console.log("[bandori-options] 设置已加载:", settings);
    applyToForm(settings);
  } catch (error) {
    console.error("[bandori-options] 设置加载失败", error);
    setStatus("\u26a0\ufe0f 设置加载失败，使用默认值。");
    applyToForm(DEFAULT_SETTINGS);
  }
}

/**
 * 保存设置到 chrome.storage.sync（带成功反馈动画）
 * @param {Object} settings - 要保存的设置对象
 * @returns {Promise<void>}
 */
async function saveSettings(settings) {
  try {
    console.log("[bandori-options] 正在保存设置:", JSON.stringify(settings));
    await chrome.storage.sync.set(settings);
    setStatus("\u2705 已保存！刷新B站页面即可看到新效果。");
    console.log("[bandori-options] 设置已成功写入 storage");

    // 按钮成功反馈脉冲
    const submitBtn = form.querySelector('.button--primary');
    if (submitBtn) {
      submitBtn.style.transform = "scale(0.95)";
      setTimeout(() => { submitBtn.style.transform = ""; }, 120);
    }
  } catch (error) {
    console.error("[bandori-options] 设置保存失败", error);
    setStatus("\u274c 保存失败，请重试。");
  }
}

/**
 * 从表单收集当前设置值
 * 强制从 DOM 实时读取，避免缓存或中间状态导致值不一致
 * @returns {Object} 当前表单的设置对象
 */
function collectFormSettings() {
  const checkedModeInput = document.querySelector('input[name="displayMode"]:checked');
  const displayMode = checkedModeInput?.value || DEFAULT_SETTINGS.displayMode;

  // 关键修复：强制从 DOM 重新获取元素和值，不使用闭包中的旧引用
  const probInput = document.getElementById("appearance-probability");
  const scaleInput = document.getElementById("size-scale");
  const opacityInput = document.getElementById("sticker-opacity");
  const shadowInput = document.getElementById("shadow-intensity");

  const rawProb = probInput ? probInput.value : DEFAULT_SETTINGS.appearanceProbability;
  const rawScale = scaleInput ? scaleInput.value : DEFAULT_SETTINGS.sizeScale;
  const rawOpacity = opacityInput ? opacityInput.value : DEFAULT_SETTINGS.stickerOpacity;
  const rawShadow = shadowInput ? shadowInput.value : DEFAULT_SETTINGS.shadowIntensity;

  const settings = normalizeSettings({
    enabled: true,
    displayMode: displayMode,
    selectedBand: getSelectedBand(),
    /** 收集当前角色多选状态 */
    selectedCharacters: getSelectedCharacters(),
    appearanceProbability: rawProb,
    sizeScale: rawScale,
    stickerOpacity: rawOpacity,
    shadowIntensity: rawShadow
  });

  console.log("[bandori-options] 表单收集详情:", {
    displayMode,
    selectedBand: getSelectedBand(),
    selectedCharacters: getSelectedCharacters(),
    // 原始 DOM 值（字符串）
    appearanceProbabilityDOM: rawProb,
    sizeScaleDOM: rawScale,
    // 最终规范化结果
    normalized: settings
  });

  return settings;
}

// ===== 事件监听器 =====

// 滑块实时更新显示（带节流优化）
let sliderRaf = null;
function handleSliderInput() {
  if (sliderRaf) cancelAnimationFrame(sliderRaf);
  sliderRaf = requestAnimationFrame(updateOutputs);
}

appearanceProbabilityInput.addEventListener("input", handleSliderInput);
sizeScaleInput.addEventListener("input", handleSliderInput);
stickerOpacityInput.addEventListener("input", handleSliderInput);
shadowIntensityInput.addEventListener("input", handleSliderInput);

// 显示模式切换事件
displayModeInputs.forEach((input) => {
  input.addEventListener("change", (event) => {
    const mode = event.target.value;
    toggleBandSelectorVisibility(mode);
    console.log(`[bandori-options] 显示模式切换为: ${mode}`);
  });
});

// 全选 / 全不选 按钮
selectAllCharsBtn?.addEventListener("click", selectAllCharacters);
deselectAllCharsBtn?.addEventListener("click", deselectAllCharacters);

// 表单提交（保存）— 防止重复提交
let isSubmitting = false;
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (isSubmitting) return;
  isSubmitting = true;

  const settings = collectFormSettings();
  await saveSettings(settings);

  setTimeout(() => { isSubmitting = false; }, 400);
});

// 重置按钮（带确认对话框和重置动画）
resetButton.addEventListener("click", async () => {
  if (!confirm("确定要重置所有设置为默认值吗？")) {
    return;
  }

  // 重置动画：面板闪烁
  panelFlash();

  applyToForm(DEFAULT_SETTINGS);
  await saveSettings(DEFAULT_SETTINGS);
  setStatus("\u21a9\ufe0f 已重置为默认设置。");
});

/**
 * 面板闪烁反馈动画
 */
function panelFlash() {
  const panel = document.querySelector(".panel");
  if (!panel) return;

  panel.style.transition = "box-shadow 0.15s ease";
  panel.style.boxShadow = "0 0 40px rgba(255, 45, 122, 0.4), 0 20px 60px rgba(0, 0, 0, 0.4)";
  setTimeout(() => {
    panel.style.boxShadow = "";
  }, 300);
}

// ===== 初始化 =====

/**
 * 初始化设置页面
 * 生成乐队选择器（带交错动画）→ 加载设置 → 绑定事件
 */
function init() {
  console.log("[bandori-options] BanG Dream! 设置页初始化...");

  // 1. 动态生成乐队选择网格（带交错入场动画）
  generateBandGrid();

  // 2. 加载已保存的设置（等待卡片动画完成后应用）
  setTimeout(() => {
    loadSettings().catch((error) => {
      console.error("[bandori-options] 初始化失败", error);
      setStatus("\u274c 初始化失败，请刷新页面重试。");
    });
  }, 60 + Object.keys(BANDS_CONFIG).length * 50 + 200);
}

// 启动初始化
init();
