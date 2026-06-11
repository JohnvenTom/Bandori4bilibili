/**
 * BanG Dream! 邦多利贴纸扩展 - 内容脚本
 *
 * 功能：
 * - 在B站视频封面上叠加 BanG Dream! 角色贴纸
 * - 支持9个乐队的独立贴图池
 * - 支持随机混合模式或指定乐队模式
 * - 使用确定性哈希确保同一视频始终显示相同贴纸
 *
 * @version 1.0.0
 * @author 改编自 bili-sticker
 */

// ===== 乐队配置（内联：content script 运行在隔离环境中，无法加载外部 JS）=====

const BANDS_CONFIG = {
  poppinparty: {
    id: "poppinparty",
    name: { zh: "Poppin'Party", en: "Poppin'Party", ja: "ポッパンパーティー" },
    color: "#FF69B4",
    members: ["户山香澄", "市谷有咲", "牛込里美", "山吹沙绫", "若叶昴"],
    description: "以'朋友'和'梦想'为主题的初心乐队",
    characters: { "户山香澄": { displayName: "户山香澄", displayNameEn: "Kasumi" } }
  },
  afterglow: {
    id: "afterglow",
    name: { zh: "Afterglow", en: "Afterglow", ja: "アフターグロー" },
    color: "#9370DB",
    members: ["丸山彩", "凑友希那", "千早爱音", "弦卷心", "濑田薰"],
    description: "追求成熟与美丽的女性团体",
    characters: {
      "上原绯玛丽": { displayName: "上原绯玛丽", displayNameEn: "Himari" },
      "美竹兰": { displayName: "美竹兰", displayNameEn: "Ran" },
      "羽泽鸫": { displayName: "羽泽鸫", displayNameEn: "Tsugumi" }
    }
  },
  hhw: {
    id: "hhw",
    name: { zh: "Hello, Happy World!", en: "Hello, Happy World!", ja: "ハロー、ハッピーワールド！" },
    color: "#FFD700",
    members: ["弦卷心", "濑田薰", "北泽育美", "奥仓真珠", "秦美波"],
    description: "为世界带来欢笑的奇幻风格偶像",
    characters: { "松原花音": { displayName: "松原花音", displayNameEn: "Kaoru" } }
  },
  pastelPalettes: {
    id: "pastelPalettes",
    name: { zh: "Pastel*Palettes", en: "Pastel*Palettes", ja: "パステルパレット" },
    color: "#FFB6C1",
    members: ["丸山彩", "冰川日菜", "白鹭千圣", "大和麻弥", "若宫伊芙"],
    description: "偶像组合出身，色彩斑斓的可爱风格",
    characters: {
      "丸山彩": { displayName: "丸山彩", displayNameEn: "Aya" },
      "冰川日菜": { displayName: "冰川日菜", displayNameEn: "Hina" },
      "白鹭千圣": { displayName: "白鹭千圣", displayNameEn: "Chisato" },
      "若宫伊芙": { displayName: "若宫伊芙", displayNameEn: "Eve" }
    }
    // 注：大和麻弥 暂无图片资源
  },
  roselia: {
    id: "roselia",
    name: { zh: "Roselia", en: "Roselia", ja: "ロゼリア" },
    color: "#4169E1",
    members: ["凑友希那", "冰川日菜", "今井莉莎", "宇田川亚纱", "朝日六花"],
    description: "追求绝对完美的贵族气质乐队",
    characters: {
      "今井莉莎": { displayName: "今井莉莎", displayNameEn: "Lisa" },
      "冰川纱夜": { displayName: "冰川纱夜", displayNameEn: "Sayo" },
      "凑友希那": { displayName: "凑友希那", displayNameEn: "Yukina" },
      "宇田川亚子": { displayName: "宇田川亚子", displayNameEn: "Ako" },
      "白金燐子": { displayName: "白金燐子", displayNameEn: "Rinko" }
    }
  },
  ras: {
    id: "ras",
    name: { zh: "RAISE A SUILEN", en: "RAISE A SUILEN", ja: "レイズ ア スイレン" },
    color: "#DC143C",
    members: ["莲江春香", "朝日六花", "泷泽美羽", "佐藤一歌", "鸟藤葵"],
    description: "从暗夜中崛起的摇滚乐队",
    characters: {
      "朝日六花": { displayName: "朝日六花", displayNameEn: "Rokka (LOCK)" },
      "珠手知由CHU\u00B2": { displayName: "珠手知由", displayNameEn: "Chiyu (CHU\u00B2)" },
      "\u9c26\u539f\u4ee4\u738b\u90a3PAREO": { displayName: "鳰原令王那", displayNameEn: "Reona (PAREO)" }
    }
  },
  morfonica: {
    id: "morfonica",
    name: { zh: "Morfonica", en: "Morfonica", ja: "モルフォニカ" },
    color: "#9932CC",
    members: ["仓田真白", "桐丘沙奈", "二叶筑紫", "广町七深", "八潮瑠唯"],
    description: "融合古典与摇滚的贵族女子学院乐队",
    characters: {
      "二叶筑紫": { displayName: "二叶筑紫", displayNameEn: "Tzuki" },
      "仓田真白": { displayName: "仓田真白", displayNameEn: "Mashiro" },
      "广町七深": { displayName: "广町七深", displayNameEn: "Nanami" }
    }
  },
  mygo: {
    id: "mygo",
    name: { zh: "MyGO!!!!!", en: "MyGO!!!!!", ja: "マイゴ" },
    color: "#00CED1",
    members: ["高松灯", "要乐奈", "长崎爽世", "椎名立希", "千早爱音"],
    description: "在迷茫中寻找答案的真实系乐队",
    characters: {
      "千早爱音": { displayName: "千早爱音", displayNameEn: "Anon" },
      "椎名立希": { displayName: "椎名立希", displayNameEn: "Taki" },
      "長崎爽世": { displayName: "长崎爽世", displayNameEn: "Sumire" },
      "高松灯": { displayName: "高松灯", displayNameEn: "Tomori" }
    }
  },
  aveMujica: {
    id: "aveMujica",
    name: { zh: "Ave Mujica", en: "Ave Mujica", ja: "アヴェムジカ" },
    color: "#800080",
    members: ["丰川祥子", "若叶睦", "八幡海铃", "长崎爽世", "椎名立希"],
    description: "沉睡于剧场中的幻想乐团",
    characters: {}
  }
};

const DISPLAY_MODES = {
  RANDOM_MIX: {
    id: "random_mix",
    name: { zh: "随机混合", en: "Random Mix", ja: "ランダムミックス" },
    description: { zh: "从所有乐队中随机选择贴纸", en: "Randomly pick stickers from all bands" }
  },
  BAND_SPECIFIC: {
    id: "band_specific",
    name: { zh: "指定乐队", en: "Specific Band", ja: "指定バンド" },
    description: { zh: "只显示选定乐队的贴纸", en: "Only show stickers from selected band" }
  }
};

// ===== 配置常量 =====

/** 视频链接选择器 */
const VIDEO_LINK_SELECTOR = [
  'a[href*="/video/BV"]',
  'a[href*="/video/av"]',
  'a[href*="//www.bilibili.com/video/"]',
  'a[href*="https://www.bilibili.com/video/"]',
].join(", ");

/** 媒体元素选择器 */
const MEDIA_SELECTOR = [
  "img",
  "picture img",
  "canvas",
  '[style*="background-image"]'
].join(", ");

/** 贴纸位置预设（4个角落） */
const POSITION_PRESETS = [
  { bottom: -8, left: -12 },
  { bottom: -8, right: -12 },
  { bottom: -2, left: "12%" },
  { bottom: -2, right: "12%" }
];

/** DOM处理标记 */
const PROCESSED_FLAG = "bandoriStickerAttached";
const LAYER_CLASS_NAME = "bandori-sticker-layer";
const STYLE_TAG_ID = "bandori-sticker-style";

/** 扫描延迟计划（毫秒）- 应对异步加载 */
const SCAN_SCHEDULE_MS = [0, 800, 2000, 4000];

/** 默认用户设置 */
const DEFAULT_SETTINGS = {
  enabled: true,
  displayMode: "random_mix", // "random_mix" 或 "band_specific"
  selectedBand: "poppinparty", // 当 displayMode 为 "band_specific" 时使用
  /** 角色多选列表（角色子目录名数组），空数组 = 显示该乐队所有角色 */
  selectedCharacters: [],
  appearanceProbability: 100,
  sizeScale: 75
};

// ===== 全局状态 =====

let currentSettings = { ...DEFAULT_SETTINGS };
let scanQueued = false;

/**
 * 多乐队贴图池
 * 结构：{ bandId: [url1, url2, ...], ... }
 */
let BAND_STICKER_POOLS = {};

/**
 * 混合模式下的统一贴图池（所有乐队的图片合并）
 */
let MIXED_STICKER_POOL = [];

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
 * 获取元素的可视区域面积
 * @param {HTMLElement} element - DOM元素
 * @returns {number} 面积（平方像素）
 */
function getArea(element) {
  const rect = element.getBoundingClientRect();
  return rect.width * rect.height;
}

/**
 * 检查元素是否足够大（用于过滤小图标）
 * @param {HTMLElement} element - DOM元素
 * @returns {boolean} 是否足够大（>=120x68）
 */
function isLargeEnough(element) {
  const rect = element.getBoundingClientRect();
  return rect.width >= 120 && rect.height >= 68;
}

/**
 * 获取元素的边界矩形
 * @param {HTMLElement} element - DOM元素
 * @returns {DOMRect} 边界矩形
 */
function getRect(element) {
  return element.getBoundingClientRect();
}

/**
 * 检查媒体元素的尺寸比例是否合理（用于识别视频封面）
 * @param {DOMRect} rect - 边界矩形
 * @returns {boolean} 是否为合理的视频封面比例
 */
function isReasonableMediaRect(rect) {
  if (rect.width < 120 || rect.height < 68) {
    return false;
  }

  const ratio = rect.width / rect.height;
  return ratio > 1.1 && ratio < 2.6;
}

/**
 * 检查内层矩形是否靠近外层矩形的顶部区域
 * @param {DOMRect} innerRect - 内层矩形
 * @param {DOMRect} outerRect - 外层矩形
 * @returns {boolean} 是否靠近顶部
 */
function isRectNearTop(innerRect, outerRect) {
  return innerRect.top - outerRect.top <= Math.max(24, outerRect.height * 0.12);
}

/**
 * FNV-1a 哈希算法 - 用于确定性随机选择
 * @param {string} input - 输入字符串
 * @param {number} seed=0 - 哈希种子
 * @returns {number} 32位无符号哈希值
 */
function hashString(input, seed = 0) {
  let hash = 2166136261 ^ seed;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

/**
 * 将哈希值归一化到 [0, 1] 范围
 * @param {string} input - 输入字符串
 * @param {number} seed=0 - 哈希种子
 * @returns {number} 归一化后的值（0到1之间）
 */
function normalizedHash(input, seed = 0) {
  return hashString(input, seed) / 4294967295;
}

/**
 * 规范化用户设置，确保值在有效范围内
 * @param {Object} settings - 原始设置对象
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
      : DEFAULT_SETTINGS.selectedBand,
    /** 角色多选：确保为有效字符串数组 */
    selectedCharacters: Array.isArray(settings.selectedCharacters)
      ? settings.selectedCharacters.filter((c) => typeof c === "string")
      : DEFAULT_SETTINGS.selectedCharacters,
    appearanceProbability: Math.round(
      clamp(Number(settings.appearanceProbability) || DEFAULT_SETTINGS.appearanceProbability, 0, 100)
    ),
    sizeScale: Math.round(
      clamp(Number(settings.sizeScale) || DEFAULT_SETTINGS.sizeScale, 50, 150)
    )
  };
}

/**
 * 从 chrome.storage 同步加载设置
 * 包含自动迁移逻辑：检测并修正超范围的旧值
 * @returns {Promise<void>}
 */
async function loadSettings() {
  try {
    const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);

    // 迁移检测：旧版 sizeScale 上限为 250，新版为 150
    // 如果存储值超过新上限，自动回退到默认值
    const rawSizeScale = Number(stored.sizeScale);
    if (rawSizeScale > 150) {
      console.warn(
        `[bandori-sticker] 检测到旧版 sizeScale 值 (${rawSizeScale}%)，`,
        `已自动修正为默认值 (100%)`
      );
      stored.sizeScale = DEFAULT_SETTINGS.sizeScale;
      // 静默保存修正后的值
      chrome.storage.sync.set({ sizeScale: DEFAULT_SETTINGS.sizeScale }).catch(() => {});
    }

    currentSettings = normalizeSettings(stored);
  } catch (error) {
    console.warn("[bandori-sticker] 设置加载失败，使用默认值", error);
    currentSettings = { ...DEFAULT_SETTINGS };
  }
}

// ===== 贴图池构建 =====

/**
 * 构建所有乐队的贴图池
 *
 * 策略（优先级从高到低）：
 *   1. 加载预生成的文件清单 images/bands/file-manifest.json（推荐）
 *   2. 回退到并发探测模式（较慢，覆盖有限）
 *
 * 图片目录结构：
 *   images/bands/{bandId}/{characterDir}/{characterName}_{cardId}_{type}.png
 *   type = "ta" (大图) 或 "tn" (缩略图)
 *
 * @returns {Promise<void>}
 */
async function buildStickerPools() {
  try {
    const bandIds = Object.keys(BANDS_CONFIG);
    BAND_STICKER_POOLS = {};
    MIXED_STICKER_POOL = [];

    // ===== 策略1：尝试加载预生成的文件清单 =====
    const manifestLoaded = await tryLoadFromManifest();

    if (!manifestLoaded) {
      // ===== 策略2：回退到并发探测 =====
      console.warn(
        "[bandori-sticker] 未找到文件清单，使用探测模式（可能较慢且不完整）"
      );
      console.info(
        "[bandori-sticker] 提示：运行 'node scripts/generate-manifest.js' 生成完整清单以提升加载速度"
      );
      await probeBuildStickerPools();
    }

    // 统计结果
    let totalImages = 0;
    for (const bandId of bandIds) {
      const count = (BAND_STICKER_POOLS[bandId] || []).length;
      if (count > 0) {
        totalImages += count;
        console.log(`[bandori-sticker] ${BANDS_CONFIG[bandId].name.zh}: 已加载 ${count} 张贴纸`);
      } else {
        console.warn(`[bandori-sticker] ${BANDS_CONFIG[bandId].name.zh}: 未找到贴纸资源`);
      }
    }

    console.log(
      `[bandori-sticker] 贴图池构建完成，总计 ${totalImages} 张贴纸`
    );
  } catch (error) {
    console.error("[bandori-sticker] 贴图池构建失败", error);
  }
}

/**
 * 策略1：从预生成的文件清单加载贴图URL
 * 清单格式：{ bandId: { characterDir: [url1, url2, ...], ... }, ... }
 * @returns {Promise<boolean>} 是否成功加载
 */
async function tryLoadFromManifest() {
  try {
    const manifestUrl = chrome.runtime.getURL("images/bands/file-manifest.json");
    const response = await fetch(manifestUrl);

    if (!response.ok) {
      return false;
    }

    const manifest = await response.json();

    for (const [bandId, characterMap] of Object.entries(manifest)) {
      if (!BANDS_CONFIG[bandId]) continue; // 跳过未知乐队

      const pool = [];
      for (const urls of Object.values(characterMap)) {
        if (Array.isArray(urls)) {
          pool.push(...urls.map((url) => chrome.runtime.getURL(url)));
        }
      }

      if (pool.length > 0) {
        BAND_STICKER_POOLS[bandId] = pool;
        MIXED_STICKER_POOL.push(...pool);
      }
    }

    return MIXED_STICKER_POOL.length > 0;
  } catch (error) {
    // 文件不存在或解析失败 → 返回 false 触发回退策略
    return false;
  }
}

/**
 * 策略2：并发探测模式（回退方案）
 *
 * 对每个已配置角色的子目录进行批量并发请求，
 * 基于 BanG Dream! 游戏卡牌 ID 分布规律生成候选 URL。
 *
 * 探测规则：
 *   - 文件命名：{角色目录名}_{卡牌ID}_{类型}.png
 *   - 类型后缀：_ta.png (大图优先), _tn.png (缩略图备选)
 *   - 卡牌ID范围：基于实际观察到的分布区间
 *
 * 性能说明：
 *   - 使用 Promise.allSettled 批量并发（每批 PROBE_BATCH_SIZE 个请求）
 *   - 首次加载可能需要 3-8 秒（取决于图片数量和网络）
 *   - 结果会在后续访问中保持（直到扩展重启）
 *
 * @returns {Promise<void>}
 */
async function probeBuildStickerPools() {
  /** 每批并发探测数量 */
  const PROBE_BATCH_SIZE = 50;

  /** 单个角色最大探测候选数上限（防止过多无效请求） */
  const MAX_CANDIDATES_PER_CHAR = 600;

  /** 探测超时时间（毫秒） */
  const PROBE_TIMEOUT_MS = 8000;

  const bandIds = Object.keys(BANDS_CONFIG);

  for (const bandId of bandIds) {
    const band = BANDS_CONFIG[bandId];
    const charDirs = Object.keys(band.characters || {});

    if (charDirs.length === 0) {
      continue; // 该乐队无角色配置，跳过
    }

    const pool = [];

    for (const charDir of charDirs) {
      // 生成该角色的候选URL列表
      const candidates = generateProbeCandidates(bandId, charDir, MAX_CANDIDATES_PER_CHAR);

      if (candidates.length === 0) continue;

      // 分批并发探测
      const validUrls = await batchProbeUrls(candidates, PROBE_BATCH_SIZE, PROBE_TIMEOUT_MS);
      pool.push(...validUrls);
    }

    if (pool.length > 0) {
      BAND_STICKER_POOLS[bandId] = pool;
      MIXED_STICKER_POOL.push(...pool);
    }
  }
}

/**
 * 生成单个角色的候选探测URL列表
 *
 * 基于观察到的 BanG Dream! 卡牌 ID 分布规律：
 *   - 常规卡面：1 ~ 3000（密集分布）
 *   - 四位数卡面：3001 ~ 8000（中等密度）
 *   - 五位数特殊卡：90001 ~ 90500, 100001 ~ 100050 等
 *
 * @param {string} bandId - 乐队ID
 * @param {string} charDirName - 角色子目录名
 * @param {number} maxCandidates - 最大候选数限制
 * @returns {string[]} 候选URL数组
 */
function generateProbeCandidates(bandId, charDirName, maxCandidates) {
  const baseUrl = chrome.runtime.getURL(`images/bands/${bandId}/${charDirName}`);
  const candidates = [];

  /**
   * 卡牌 ID 探测范围定义
   * 每项：[起始ID, 结束ID, 步长]
   * 步长 > 1 表示稀疏采样（减少请求数）
   */
  const idRanges = [
    // 常规小ID区（最密集，全量扫描）
    [1, 500, 1],
    [501, 1000, 1],
    [1001, 2000, 1],
    [2001, 3000, 1],

    // 中等ID区（中等密度）
    [3001, 4000, 2],
    [4001, 5000, 2],
    [5001, 6000, 3],
    [6001, 7000, 3],
    [7001, 8000, 3],

    // 大ID区（稀疏采样）
    [8001, 9000, 5],
    [9001, 10000, 5],

    // 特殊卡面区域（已知的高概率区间）
    [10001, 10100, 2],
    [50001, 50050, 1],
    [90030, 90060, 1],
    [90090, 90110, 1],
    [100001, 100060, 1],
  ];

  /** 后缀类型：优先 ta（大图），其次 tn（缩略图） */
  const suffixes = ["_ta.png", "_tn.png"];

  for (const [start, end, step] of idRanges) {
    for (let id = start; id <= end; id += step) {
      for (const suffix of suffixes) {
        candidates.push(`${baseUrl}/${charDirName}_${id}${suffix}`);

        if (candidates.length >= maxCandidates) {
          return candidates; // 达到上限，提前返回
        }
      }
    }
  }

  return candidates;
}

/**
 * 批量并发探测 URL 是否可访问
 *
 * 将候选 URL 分成多批，每批 PROBE_BATCH_SIZE 个并发请求，
 * 收集所有成功响应（HTTP 200）的 URL。
 *
 * @param {string[]} candidates - 候选URL数组
 * @param {number} batchSize - 每批并发数
 * @param {number} timeoutMs - 全局超时（毫秒）
 * @returns {Promise<string[]>} 所有可访问的URL数组
 */
async function batchProbeUrls(candidates, batchSize, timeoutMs) {
  const validUrls = [];
  const startTime = Date.now();

  // 将候选分成多批
  for (let i = 0; i < candidates.length; i += batchSize) {
    // 超时检查
    if (Date.now() - startTime > timeoutMs) {
      console.warn(
        `[bandori-sticker] 探测超时 (${timeoutMs}ms)，已处理 ${i}/${candidates.length}`
      );
      break;
    }

    const batch = candidates.slice(i, i + batchSize);

    // 并发探测当前批次
    const results = await Promise.allSettled(
      batch.map(async (url) => {
        try {
          const resp = await fetch(url, { method: "HEAD" });
          return resp.ok ? url : null;
        } catch {
          return null;
        }
      })
    );

    // 收集成功的URL
    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        validUrls.push(result.value);
      }
    }

    // 批间延迟（避免过于密集的请求）
    if (i + batchSize < candidates.length) {
      await new Promise((r) => setTimeout(r, 5));
    }
  }

  return validUrls;
}

/**
 * 根据当前设置获取可用的贴图池
 * 在"指定乐队"模式下，若用户选择了具体角色，则仅返回对应角色的贴纸
 * @returns {string[]} 贴图URL数组
 */
function getActiveStickerPool() {
  if (currentSettings.displayMode === "band_specific") {
    const bandId = currentSettings.selectedBand;
    const fullPool = BAND_STICKER_POOLS[bandId] || [];

    /** 若用户选择了具体角色（非空数组），按角色子目录名过滤贴纸 URL */
    const selectedChars = currentSettings.selectedCharacters;
    if (Array.isArray(selectedChars) && selectedChars.length > 0) {
      /**
       * 兼容 Chrome 对中文路径的 URL 编码：
       * chrome.runtime.getURL() 可能将中文目录名编码为 %XX 格式
       * （如 "丸山彩" → "%E4%B8%B8%E5%B1%B1%E5%BD%A9"），
       * 因此需要同时匹配原始 URL 和解码后的 URL
       */
      const filtered = fullPool.filter((url) => {
        try {
          const decodedUrl = decodeURIComponent(url);
          return selectedChars.some((charDir) =>
            url.includes(`/${charDir}/`) || decodedUrl.includes(`/${charDir}/`)
          );
        } catch {
          // 解码失败时降级为原始匹配
          return selectedChars.some((charDir) => url.includes(`/${charDir}/`));
        }
      });

      /**
       * 防护逻辑：当角色过滤器导致结果为空时（常见于切换乐队后
       * selectedCharacters 残留旧乐队角色名），回退到全量池并告警，
       * 避免贴图池为空导致所有扫描被跳过
       */
      if (filtered.length === 0 && fullPool.length > 0) {
        console.warn(
          `[bandori-sticker] 角色过滤结果为空（可能残留其他乐队角色名: ${selectedChars.join(", ")}），`,
          `已自动回退显示 ${BANDS_CONFIG[bandId]?.name.zh || bandId} 全部 ${fullPool.length} 张贴纸`
        );
        return fullPool;
      }

      return filtered;
    }

    return fullPool;
  }

  // random_mix 模式
  return MIXED_STICKER_POOL;
}

// ===== DOM操作与智能定位 =====

/**
 * 向上遍历DOM树，找到最适合作为定位容器的父元素
 * 用于处理B站视频卡片的多层嵌套结构
 * @param {HTMLElement} mediaElement - 媒体元素（img等）
 * @param {HTMLElement} anchor - 锚点元素（视频链接<a>）
 * @returns {HTMLElement} 最合适的容器元素
 */
function climbToCoverContainer(mediaElement, anchor) {
  let current = mediaElement;
  let best = mediaElement;
  const anchorRect = getRect(anchor);
  const mediaRect = getRect(mediaElement);

  while (current.parentElement && current.parentElement !== anchor) {
    const parent = current.parentElement;
    const parentRect = getRect(parent);
    const topClose = Math.abs(parentRect.top - mediaRect.top) <= 12;
    const leftClose = Math.abs(parentRect.left - mediaRect.left) <= 12;
    const widthClose = Math.abs(parentRect.width - mediaRect.width) <= 24;
    const tallEnough = parentRect.height >= mediaRect.height;
    const notTooTall = parentRect.height <= Math.max(mediaRect.height * 1.25, mediaRect.height + 24);
    const staysInTopRegion = parentRect.bottom <= anchorRect.top + Math.max(mediaRect.height + 32, anchorRect.height * 0.72);

    if (!(topClose && leftClose && widthClose && tallEnough && notTooTall && staysInTopRegion)) {
      break;
    }

    best = parent;
    current = parent;
  }

  return best;
}

/**
 * 从锚点元素内选择最大的合适媒体元素作为贴纸载体
 * @param {HTMLElement} anchor - 视频链接元素
 * @returns {HTMLElement|null} 选中的媒体元素，或null
 */
function chooseLargestCandidate(anchor) {
  const anchorRect = getRect(anchor);
  const mediaCandidates = Array.from(anchor.querySelectorAll(MEDIA_SELECTOR))
    .filter((node) => node instanceof HTMLElement)
    .filter((node) => isLargeEnough(node))
    .filter((node) => isReasonableMediaRect(getRect(node)))
    .filter((node) => isRectNearTop(getRect(node), anchorRect))
    .map((node) => climbToCoverContainer(node, anchor))
    .filter((node) => node instanceof HTMLElement)
    .filter((node) => isReasonableMediaRect(getRect(node)));

  if (!mediaCandidates.length) {
    return null;
  }

  // 按面积降序排序，选择最大的
  mediaCandidates.sort((left, right) => getArea(right) - getArea(left));
  return mediaCandidates[0];
}

/**
 * 确保根元素具有正确的定位上下文
 * 设置 position: relative 和 overflow: hidden 以容纳绝对定位的贴纸
 * @param {HTMLElement} root - 需要设置的容器元素
 */
function ensurePositionContext(root) {
  const computedStyle = window.getComputedStyle(root);

  if (computedStyle.position === "static") {
    root.style.position = "relative";
  }

  if (computedStyle.overflow === "visible") {
    root.style.overflow = "hidden";
  }

  root.style.isolation = "isolate";
}

/**
 * 获取锚点元素的唯一标识键（用于哈希）
 * @param {HTMLElement} anchor - 锚点元素
 * @returns {string} 唯一标识
 */
function getAnchorKey(anchor) {
  return anchor.href || anchor.getAttribute("href") || anchor.textContent || "";
}

// ===== 贴纸显示逻辑 =====

/**
 * 判断是否应该在当前锚点上显示贴纸
 * 基于用户设置的出现概率和确定性哈希
 * @param {HTMLElement} anchor - 锚点元素
 * @returns {boolean} 是否应该显示
 */
function shouldAttachSticker(anchor) {
  if (!currentSettings.enabled) {
    return false;
  }

  const probability = currentSettings.appearanceProbability / 100;

  if (probability <= 0) {
    return false;
  }

  if (probability >= 1) {
    return true;
  }

  // 使用哈希确保同一视频的结果一致
  return normalizedHash(`${getAnchorKey(anchor)}:appearance`, 11) <= probability;
}

/**
 * 根据锚点和当前设置确定要显示的贴纸图片URL
 * 使用确定性哈希确保同一视频始终显示相同贴纸
 * @param {HTMLElement} anchor - 锚点元素
 * @returns {string} 贴纸图片URL
 */
function getStickerSource(anchor) {
  const key = getAnchorKey(anchor);
  const pool = getActiveStickerPool();

  if (!pool.length) {
    console.warn("[bandori-sticker] 贴图池为空");
    return "";
  }

  const index = Math.floor(normalizedHash(`${key}:sticker`, 23) * pool.length);
  return pool[index] || pool[0];
}

/**
 * 根据锚点确定贴纸的显示位置（4个预设位置之一）
 * 使用确定性哈希确保一致性
 * @param {HTMLElement} anchor - 锚点元素
 * @returns {Object} 位置样式对象（如 {bottom: -8, left: -12}）
 */
function getStickerPosition(anchor) {
  const key = getAnchorKey(anchor);
  const index = Math.floor(normalizedHash(`${key}:position`, 31) * POSITION_PRESETS.length);
  return POSITION_PRESETS[index] || POSITION_PRESETS[0];
}

/**
 * 清除页面上所有已附加的贴纸
 * 在设置变更时调用
 */
function clearAttachedStickers() {
  document.querySelectorAll(`.${LAYER_CLASS_NAME}`).forEach((element) => {
    element.remove();
  });

  document.querySelectorAll(VIDEO_LINK_SELECTOR).forEach((anchor) => {
    if (anchor instanceof HTMLAnchorElement) {
      delete anchor.dataset[PROCESSED_FLAG];
    }
  });
}

/**
 * 创建贴纸图片元素
 * 根据容器大小、用户设置和哈希计算尺寸与样式
 * @param {HTMLElement} root - 容器元素
 * @param {HTMLElement} anchor - 锚点元素
 * @returns {HTMLImageElement} 创建好的贴纸元素
 */
function createStickerElement(root, anchor) {
  const rect = root.getBoundingClientRect();
  const sticker = document.createElement("img");
  const position = getStickerPosition(anchor);
  const key = getAnchorKey(anchor);
  const sizeScale = currentSettings.sizeScale / 100;

  // 随机大小变化（基于哈希），范围 72% ~ 108%
  const randomScale = 0.72 + normalizedHash(`${key}:size`, 41) * 0.36;
  const size = Math.round(clamp(rect.width * randomScale * sizeScale, 60, 900));

  // 最大宽高限制（百分比，与 sizeScale 范围 50-150 对应）
  const maxWidthPercent = Math.round(clamp(100 * sizeScale, 50, 160));
  const maxHeightPercent = Math.round(clamp(140 * sizeScale, 80, 220));

  sticker.src = getStickerSource(anchor);
  sticker.alt = "BanG Dream! 贴纸";
  sticker.className = "bandori-sticker";
  sticker.loading = "eager";
  sticker.decoding = "async";

  // 基础样式
  sticker.style.position = "absolute";
  sticker.style.zIndex = "1";
  sticker.style.width = `${size}px`;
  sticker.style.height = "auto";
  sticker.style.maxWidth = `${maxWidthPercent}%`;
  sticker.style.maxHeight = `${maxHeightPercent}%`;
  sticker.style.pointerEvents = "none";
  sticker.style.userSelect = "none";

  // 阴影效果（增加立体感）
  sticker.style.filter = "drop-shadow(0 6px 16px rgba(0, 0, 0, 0.28))";

  // 应用位置
  for (const [keyName, value] of Object.entries(position)) {
    sticker.style[keyName] = typeof value === "number" ? `${value}px` : value;
  }

  return sticker;
}

/**
 * 注入必要的CSS规则（隐藏悬停时的贴纸）
 */
function ensureStickerStyles() {
  if (document.getElementById(STYLE_TAG_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_TAG_ID;
  style.textContent = `
    .bili-video-card__image--hover > .${LAYER_CLASS_NAME} {
      visibility: hidden !important;
      opacity: 0 !important;
    }
  `;
  document.documentElement.appendChild(style);
}

/**
 * 解析贴纸层的最佳插入位置
 * 处理B站视频卡片的复杂DOM结构
 * @param {HTMLElement} root - 媒体容器
 * @returns {Object} 插入位置信息 {host, beforeNode, boundsRoot}
 */
function resolveLayerPlacement(root) {
  const homeMaskSelector = ":scope > .bili-video-card__mask";
  const homeImageSelector = ".bili-video-card__image";
  const homeImageWrapSelector = ":scope > .bili-video-card__image--wrap";

  // 尝试匹配标准B站卡片结构
  const homeImage =
    (root.matches?.(homeImageSelector) && root) ||
    root.querySelector?.(homeImageSelector);

  if (homeImage instanceof HTMLElement) {
    const mask = homeImage.querySelector(homeMaskSelector);
    const imageWrap = homeImage.querySelector(homeImageWrapSelector);

    if (mask instanceof HTMLElement && imageWrap instanceof HTMLElement) {
      return {
        host: homeImage,
        beforeNode: mask,
        boundsRoot: imageWrap
      };
    }
  }

  // 回退方案：直接查找mask
  const directMask = root.querySelector(homeMaskSelector);

  if (directMask instanceof HTMLElement) {
    return {
      host: root,
      beforeNode: directMask,
      boundsRoot: root
    };
  }

  // 最终回退
  return {
    host: root,
    beforeNode: null,
    boundsRoot: root
  };
}

/**
 * 确保层宿主元素具有正确的定位上下文
 * @param {HTMLElement} boundsRoot - 边界根元素
 * @param {HTMLElement} host - 宿主元素
 */
function ensureLayerHostContext(boundsRoot, host) {
  if (host === boundsRoot) {
    ensurePositionContext(boundsRoot);
    return;
  }

  const computedStyle = window.getComputedStyle(host);

  if (computedStyle.position === "static") {
    host.style.position = "relative";
  }

  host.style.isolation = "isolate";
}

/**
 * 核心函数：为单个视频锚点附加贴纸
 * @param {HTMLElement} anchor - 视频链接元素
 * @returns {boolean} 是否成功附加
 */
function attachStickerToAnchor(anchor) {
  if (!(anchor instanceof HTMLAnchorElement)) {
    return false;
  }

  if (!shouldAttachSticker(anchor)) {
    return false;
  }

  const root = chooseLargestCandidate(anchor);

  if (!root) {
    anchor.dataset[PROCESSED_FLAG] = "false";
    return false;
  }

  const placement = resolveLayerPlacement(root);

  // 检查是否已经存在贴纸层（避免重复添加）
  const existingLayer =
    placement.host.querySelector(`:scope > .${LAYER_CLASS_NAME}`) ||
    placement.boundsRoot.querySelector(`:scope > .${LAYER_CLASS_NAME}`);

  if (existingLayer) {
    anchor.dataset[PROCESSED_FLAG] = "true";
    return false;
  }

  // 准备宿主环境
  ensureLayerHostContext(placement.boundsRoot, placement.host);

  // 创建贴纸层容器
  const layer = document.createElement("span");
  layer.className = LAYER_CLASS_NAME;
  layer.style.position = "absolute";
  layer.style.pointerEvents = "none";
  layer.style.display = "block";
  layer.style.overflow = "hidden";
  layer.style.transition = "opacity .2s linear, visibility .2s linear";

  // 计算层的位置和尺寸
  const boundsRect = placement.boundsRoot.getBoundingClientRect();

  if (placement.host === placement.boundsRoot) {
    layer.style.inset = "0";
  } else {
    const hostRect = placement.host.getBoundingClientRect();
    layer.style.top = `${boundsRect.top - hostRect.top}px`;
    layer.style.left = `${boundsRect.left - hostRect.left}px`;
    layer.style.width = `${boundsRect.width}px`;
    layer.style.height = `${boundsRect.height}px`;
  }

  // 继承圆角（适配B站卡片的圆角设计）
  const rootStyle = window.getComputedStyle(placement.boundsRoot);
  if (rootStyle.borderRadius !== "0px") {
    layer.style.borderRadius = rootStyle.borderRadius;
  }

  // 如果没有beforeNode，提高z-index确保可见
  if (!placement.beforeNode) {
    layer.style.zIndex = "3";
  }

  // 创建并添加贴纸图片
  layer.appendChild(createStickerElement(placement.boundsRoot, anchor));

  // 插入到DOM中
  if (placement.beforeNode) {
    placement.host.insertBefore(layer, placement.beforeNode);
  } else {
    placement.host.appendChild(layer);
  }

  anchor.dataset[PROCESSED_FLAG] = "true";
  return true;
}

/**
 * 批量处理指定范围内的所有视频锚点
 * @param {HTMLElement|Document} scope - 搜索范围
 */
function attachStickers(scope) {
  const pool = getActiveStickerPool();

  if (!pool.length) {
    console.warn("[bandori-sticker] 贴图池为空，跳过扫描");
    return;
  }

  const anchors = Array.from(scope.querySelectorAll(VIDEO_LINK_SELECTOR))
    .filter((node) => node instanceof HTMLAnchorElement);

  anchors.forEach((anchor) => {
    attachStickerToAnchor(anchor);
  });
}

/**
 * 将扫描任务加入队列（使用 requestAnimationFrame 批量处理）
 * 避免短时间内频繁触发导致的性能问题
 */
function queueScan() {
  if (scanQueued) {
    return;
  }

  scanQueued = true;
  requestAnimationFrame(() => {
    scanQueued = false;
    attachStickers(document);
  });
}

/**
 * 处理设置变更事件
 * 当用户在选项页修改设置时自动更新
 * @param {Object} changes - 变更的对象
 * @param {string} areaName - 存储区域名称 ("sync" 或 "local")
 */
function handleSettingsChanged(changes, areaName) {
  if (areaName !== "sync") {
    return;
  }

  // 检查是否有相关设置变更
  const relevantKeys = ["enabled", "displayMode", "selectedBand", "selectedCharacters", "appearanceProbability", "sizeScale"];
  const hasRelevantChange = relevantKeys.some(key => changes[key]);

  if (!hasRelevantChange) {
    return;
  }

  console.log("[bandori-sticker] 收到设置变更通知:", changes);

  applySettingsFromChanges(changes);
}

/**
 * 从变更对象中提取并应用新设置
 * 清除现有贴纸并重新扫描页面
 * @param {Object} changes - chrome.storage.onChanged 的 changes 参数
 */
function applySettingsFromChanges(changes) {
  // 更新当前设置（从变更中取 newValue，未变更的保持原值）
  currentSettings = normalizeSettings({
    enabled: changes.enabled?.newValue ?? currentSettings.enabled,
    displayMode: changes.displayMode?.newValue ?? currentSettings.displayMode,
    selectedBand: changes.selectedBand?.newValue ?? currentSettings.selectedBand,
    /** 角色多选：确保为数组类型 */
    selectedCharacters: Array.isArray(changes.selectedCharacters?.newValue)
      ? changes.selectedCharacters.newValue
      : currentSettings.selectedCharacters,
    appearanceProbability: changes.appearanceProbability?.newValue ?? currentSettings.appearanceProbability,
    sizeScale: changes.sizeScale?.newValue ?? currentSettings.sizeScale
  });

  console.log("[bandori-sticker] 设置已更新:", currentSettings);

  // 清除现有贴纸并重新扫描
  clearAttachedStickers();

  if (currentSettings.enabled) {
    queueScan();
  }
}

/**
 * 主动从 storage 重新加载最新设置（轮询保障）
 * 作为 chrome.storage.onChanged 的补充，确保设置变更一定生效
 * @returns {Promise<boolean>} 是否检测到设置变化
 */
async function reloadSettings() {
  try {
    const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    const newSettings = normalizeSettings(stored);

    // 检测是否有任何值发生变化
    const changed =
      newSettings.enabled !== currentSettings.enabled ||
      newSettings.displayMode !== currentSettings.displayMode ||
      newSettings.selectedBand !== currentSettings.selectedBand ||
      /** 角色多选：使用 JSON 序列化比较数组内容 */
      JSON.stringify(newSettings.selectedCharacters) !== JSON.stringify(currentSettings.selectedCharacters) ||
      newSettings.appearanceProbability !== currentSettings.appearanceProbability ||
      newSettings.sizeScale !== currentSettings.sizeScale;

    if (changed) {
      console.log("[bandori-sticker] 轮询检测到设置变化:", { old: currentSettings, new: newSettings });
      currentSettings = newSettings;
      clearAttachedStickers();
      if (currentSettings.enabled) {
        queueScan();
      }
      return true;
    }

    return false;
  } catch (error) {
    /** 扩展上下文失效时静默忽略（扩展被重载/更新时正常现象） */
    if (error.message?.includes("Extension context invalidated")) {
      return false;
    }
    console.warn("[bandori-sticker] 轮询读取设置失败:", error);
    return false;
  }
}

// ===== DOM监听器 =====

/**
 * MutationObserver 监听器
 * 监听B站页面动态加载的视频内容
 */
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === "childList") {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) {
          continue;
        }

        // 检测新增的视频链接或包含视频链接的容器
        if (node.matches?.(VIDEO_LINK_SELECTOR) || node.querySelector?.(VIDEO_LINK_SELECTOR)) {
          queueScan();
          return;
        }
      }
    }

    // 监听属性变化（如src更新）
    if (mutation.type === "attributes" && mutation.target instanceof HTMLElement) {
      const target = mutation.target;

      if (target.matches(VIDEO_LINK_SELECTOR) || target.closest(VIDEO_LINK_SELECTOR)) {
        queueScan();
        return;
      }
    }
  }
});

// ===== 初始化 =====

/**
 * 初始化扩展
 * 加载设置 → 构建贴图池 → 启动监听器 → 执行初始扫描
 * @returns {Promise<void>}
 */
async function init() {
  console.log("[bandori-sticker] BanG Dream! 贴纸扩展 v1.0 启动中...");

  // 1. 加载用户设置
  await loadSettings();

  // 2. 构建贴图池（异步扫描图片资源）
  await buildStickerPools();

  // 3. 注入必要CSS
  ensureStickerStyles();

  // 4. 启动DOM监听
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style", "src"],
    childList: true,
    subtree: true
  });

  // 5. 监听设置变更（主通道：storage onChanged 事件）
  if (chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener(handleSettingsChanged);
    console.log("[bandori-sticker] 已注册 storage.onChanged 监听器");
  } else {
    console.warn("[bandori-sticker] chrome.storage.onChanged 不可用，将使用轮询模式");
  }

  // 6. 备用通道：页面获得焦点时重新读取设置
  // 用户从 options 页切回 B站 时触发，确保设置变更生效
  window.addEventListener("focus", () => {
    reloadSettings().catch(() => {});
  });

  // 7. 备用通道：启动后 30 秒内每 3 秒轮询一次设置
  // 捕获 onChanged 可能遗漏的变更通知
  const POLL_INTERVAL_MS = 3000;
  const POLL_DURATION_MS = 30000;
  let pollCount = 0;
  const pollTimer = window.setInterval(() => {
    pollCount++;
    if (pollCount * POLL_INTERVAL_MS >= POLL_DURATION_MS) {
      clearInterval(pollTimer);
      return;
    }
    reloadSettings().catch(() => {});
  }, POLL_INTERVAL_MS);

  // 8. 执行多次延迟扫描（应对SPA动态内容）
  SCAN_SCHEDULE_MS.forEach((delay) => {
    window.setTimeout(queueScan, delay);
  });

  // 9. 监听页面事件
  window.addEventListener("pageshow", queueScan);
  window.addEventListener("resize", queueScan, { passive: true });

  console.log(
    "[bandori-sticker] 初始化完成",
    `\n- 模式: ${currentSettings.displayMode === "random_mix" ? "随机混合" : BANDS_CONFIG[currentSettings.selectedBand]?.name.zh}`,
    `\n- 出现概率: ${currentSettings.appearanceProbability}%`,
    `\n- 大小缩放: ${currentSettings.sizeScale}%`,
    `\n- 可用贴纸: ${getActiveStickerPool().length} 张`
  );
}

// 启动扩展
init().catch((error) => {
  console.error("[bandori-sticker] 初始化失败", error);
});
