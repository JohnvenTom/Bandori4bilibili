/**
 * BanG Dream! 贴纸扩展 - 弹窗脚本
 *
 * 功能：
 * - 显示当前扩展状态（启用/禁用、当前模式/乐队）
 * - 提供快速开关功能（带弹性动画反馈）
 * - 跳转到详细设置页面
 *
 * @version 1.0.0
 */

// ===== 默认设置 =====

const DEFAULT_SETTINGS = {
  enabled: true,
  displayMode: "random_mix",
  selectedBand: "poppinparty"
};

// ===== DOM元素引用 =====

const toggleButton = document.getElementById("toggle-button");
const toggleLabel = toggleButton.querySelector(".toggle__label");
const toggleState = toggleButton.querySelector(".toggle__state");
const openOptionsButton = document.getElementById("open-options-button");
const modeText = document.getElementById("mode-text");

// ===== 工具函数 =====

/**
 * 规范化设置对象，确保值有效
 * @param {Object} settings - 原始设置
 * @returns {Object} 规范化后的设置
 */
function normalizeSettings(settings) {
  return {
    enabled: settings.enabled !== false,
    displayMode: ["random_mix", "band_specific"].includes(settings.displayMode)
      ? settings.displayMode
      : DEFAULT_SETTINGS.displayMode,
    selectedBand: Object.keys(BANDS_CONFIG).includes(settings.selectedBand)
      ? settings.selectedBand
      : DEFAULT_SETTINGS.selectedBand
  };
}

/**
 * 根据当前模式生成状态文本（带 emoji 和颜色标识）
 * @param {Object} settings - 当前设置
 * @returns {string} 模式描述文本
 */
function getModeDisplayText(settings) {
  if (settings.displayMode === "random_mix") {
    return "\ud83c\udfb8 随机混合（全部乐队）";
  }

  // band_specific 模式 — 显示乐队名和对应颜色点
  const band = BANDS_CONFIG[settings.selectedBand];
  if (band) {
    return `\ud83c\udfb8 ${band.name.zh}`;
  }

  return "未知乐队";
}

/**
 * 渲染弹窗UI状态（带平滑过渡动画）
 * @param {Object} settings - 当前设置
 */
function render(settings) {
  const enabled = settings.enabled;
  const wasEnabled = toggleButton.classList.contains("toggle--enabled");

  // 更新开关按钮状态
  toggleButton.classList.toggle("toggle--enabled", enabled);
  toggleButton.classList.toggle("toggle--disabled", !enabled);
  toggleButton.setAttribute("aria-pressed", String(enabled));

  // 标签文字过渡
  animateText(toggleLabel, enabled ? "当前已开启" : "当前已关闭");
  animateText(toggleState, enabled ? "点击关闭" : "点击开启");

  // 模式文本过渡（带颜色闪烁效果）
  const newModeText = getModeDisplayText(settings);
  if (modeText.textContent !== newModeText) {
    modeText.style.opacity = "0";
    modeText.style.transform = "translateX(6px)";
    modeText.textContent = newModeText;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        modeText.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        modeText.style.opacity = "1";
        modeText.style.transform = "translateX(0)";
      });
    });
  }
}

/**
 * 文字内容变化的淡入淡出动画
 * @param {HTMLElement} element - 目标元素
 * @param {string} newText - 新文本
 */
function animateText(element, newText) {
  if (element.textContent === newText) return;

  element.style.opacity = "0";
  element.style.transform = "scale(0.95)";
  element.textContent = newText;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      element.style.transition = "opacity 0.2s ease, transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)";
      element.style.opacity = "1";
      element.style.transform = "scale(1)";
    });
  });
}

// ===== 数据操作 =====

/**
 * 从 chrome.storage.sync 加载设置
 * @returns {Promise<void>}
 */
async function loadSettings() {
  try {
    const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    render(normalizeSettings(stored));
  } catch (error) {
    console.error("[bandori-popup] 设置加载失败", error);
    render(DEFAULT_SETTINGS);
  }
}

/**
 * 切换扩展启用/禁用状态（带按钮脉冲动画）
 * @returns {Promise<void>}
 */
async function toggleEnabled() {
  toggleButton.disabled = true;

  // 点击脉冲反馈
  toggleButton.style.transform = "scale(0.97)";
  setTimeout(() => {
    toggleButton.style.transform = "";
  }, 100);

  try {
    const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    const nextSettings = normalizeSettings(stored);
    nextSettings.enabled = !nextSettings.enabled;
    await chrome.storage.sync.set(nextSettings);
    render(nextSettings);
  } finally {
    toggleButton.disabled = false;
  }
}

// ===== 事件监听器 =====

// 开关按钮点击（带涟漪效果）
toggleButton.addEventListener("click", (event) => {
  createRipple(toggleButton, event);
  toggleEnabled().catch((error) => {
    console.error("[bandori-popup] 状态切换失败", error);
  });
});

// 打开设置页
openOptionsButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

// 监听设置变更（当在options页修改时实时更新）
if (chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") {
      return;
    }

    // 检查是否有相关变更
    if (changes.enabled || changes.displayMode || changes.selectedBand) {
      const newSettings = {
        enabled: changes.enabled?.newValue ?? true,
        displayMode: changes.displayMode?.newValue ?? DEFAULT_SETTINGS.displayMode,
        selectedBand: changes.selectedBand?.newValue ?? DEFAULT_SETTINGS.selectedBand
      };
      render(normalizeSettings(newSettings));
    }
  });
}

// ===== 涟漪效果工具函数 =====

/**
 * 在目标元素上创建点击涟漪效果
 * @param {HTMLElement} element - 目标元素
 * @param {Event} event - 点击事件对象
 */
function createRipple(element, event) {
  const oldRipple = element.querySelector(".popup-ripple");
  if (oldRipple) oldRipple.remove();

  const ripple = document.createElement("span");
  ripple.className = "popup-ripple";

  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.5;
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
    border-radius: 50%;
    transform: scale(0);
    animation: popup-ripple-expand 0.5s ease-out forwards;
    pointer-events: none;
    z-index: 2;
  `;

  // 注入涟漪动画关键帧（仅一次）
  if (!document.querySelector("#popup-ripple-style")) {
    const style = document.createElement("style");
    style.id = "popup-ripple-style";
    style.textContent = `
      @keyframes popup-ripple-expand {
        to { transform: scale(2); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  element.style.position = "relative";
  element.style.overflow = "hidden";
  element.appendChild(ripple);

  setTimeout(() => ripple.remove(), 500);
}

// ===== 初始化 =====

/**
 * 初始化弹窗（带入场动画序列）
 */
loadSettings().catch((error) => {
  console.error("[bandori-popup] 初始化失败", error);
  render(DEFAULT_SETTINGS);
});
