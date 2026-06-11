/**
 * 乐队配置文件 - BanG Dream! 全乐队贴纸扩展
 *
 * 定义所有支持的乐队及其元数据、角色子目录映射
 * 图片目录结构：images/bands/{bandId}/{characterDir}/{filename}.png
 *
 * ⚠️ 重要：characters 的 key 必须与 images/bands/ 下的实际文件夹名完全一致，
 *     否则探测和过滤逻辑会找不到图片。members 数组仅用于 UI 展示。
 *
 * @version 1.0
 */

const BANDS_CONFIG = {
  // ===== Poppin'Party =====
  poppinparty: {
    id: "poppinparty",
    name: {
      zh: "Poppin'Party",
      en: "Poppin'Party",
      ja: "ポッパンパーティー"
    },
    color: "#FF69B4",
    /** 官方成员列表（用于 UI 角色多选展示，含暂无图片的成员） */
    members: ["户山香澄", "市谷有咲", "牛込里美", "山吹沙绫", "若叶昴"],
    description: "以'朋友'和'梦想'为主题的初心乐队",
    /**
     * key = 文件系统中的子目录名（必须与 images/bands/poppinparty/ 下的文件夹名完全一致）
     * 仅列出实际存在图片资源的角色
     */
    characters: {
      "户山香澄": { displayName: "户山香澄", displayNameEn: "Kasumi" }
      // 注：市谷有咲、牛込里美、山吹沙绫、若叶昴 暂无图片资源
    }
  },

  // ===== Afterglow =====
  afterglow: {
    id: "afterglow",
    name: {
      zh: "Afterglow",
      en: "Afterglow",
      ja: "アフターグロー"
    },
    color: "#9370DB",
    members: ["丸山彩", "凑友希那", "千早爱音", "弦卷心", "濑田薰"],
    description: "追求成熟与美丽的女性团体",
    characters: {
      "上原绯玛丽": { displayName: "上原绯玛丽", displayNameEn: "Himari" },
      "美竹兰": { displayName: "美竹兰", displayNameEn: "Ran" },
      "羽泽鸫": { displayName: "羽泽鸫", displayNameEn: "Tsugumi" }
      // 注：丸山彩、凑友希那、千早爱音、弦卷心、濑田薰 暂无图片资源
    }
  },

  // ===== Hello, Happy World! =====
  hhw: {
    id: "hhw",
    name: {
      zh: "Hello, Happy World!",
      en: "Hello, Happy World!",
      ja: "ハロー、ハッピーワールド！"
    },
    color: "#FFD700",
    members: ["弦卷心", "濑田薰", "北泽育美", "奥仓真珠", "秦美波"],
    description: "为世界带来欢笑的奇幻风格偶像",
    characters: {
      "松原花音": { displayName: "松原花音", displayNameEn: "Kaoru" }
      // 注：弦卷心、濑田薰、北泽育美、奥仓真珠、秦美波 暂无图片资源
    }
  },

  // ===== Pastel*Palettes =====
  pastelPalettes: {
    id: "pastelPalettes",
    name: {
      zh: "Pastel*Palettes",
      en: "Pastel*Palettes",
      ja: "パステルパレット"
    },
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

  // ===== Roselia =====
  roselia: {
    id: "roselia",
    name: {
      zh: "Roselia",
      en: "Roselia",
      ja: "ロゼリア"
    },
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

  // ===== RAISE A SUILEN =====
  ras: {
    id: "ras",
    name: {
      zh: "RAISE A SUILEN",
      en: "RAISE A SUILEN",
      ja: "レイズ ア スイレン"
    },
    color: "#DC143C",
    members: ["莲江春香", "朝日六花", "泷泽美羽", "佐藤一歌", "鸟藤葵"],
    description: "从暗夜中崛起的摇滚乐队",
    characters: {
      "朝日六花": { displayName: "朝日六花 (LOCK)", displayNameEn: "Rokka (LOCK)" },
      "珠手知由CHU\u00B2": { displayName: "珠手知由", displayNameEn: "Chiyu (CHU\u00B2)" },
      "\u9c26\u539f\u4ee4\u738b\u90a3PAREO": { displayName: "鳰原令王那", displayNameEn: "Reona (PAREO)" }
      // 注：莲江春香、泷泽美羽、佐藤一歌、鸟藤葵 暂无图片资源
    }
  },

  // ===== Morfonica =====
  morfonica: {
    id: "morfonica",
    name: {
      zh: "Morfonica",
      en: "Morfonica",
      ja: "モルフォニカ"
    },
    color: "#9932CC",
    members: ["仓田真白", "桐丘沙奈", "二叶筑紫", "广町七深", "八潮瑠唯"],
    description: "融合古典与摇滚的贵族女子学院乐队",
    characters: {
      "二叶筑紫": { displayName: "二叶筑紫", displayNameEn: "Tzuki" },
      "仓田真白": { displayName: "仓田真白", displayNameEn: "Mashiro" },
      "广町七深": { displayName: "广町七深", displayNameEn: "Nanami" }
      // 注：桐丘沙奈、八潮瑠唯 暂无图片资源
    }
  },

  // ===== MyGO!!!!! =====
  mygo: {
    id: "mygo",
    name: {
      zh: "MyGO!!!!!",
      en: "MyGO!!!!!",
      ja: "マイゴ"
    },
    color: "#00CED1",
    members: ["高松灯", "要乐奈", "长崎爽世", "椎名立希", "千早爱音"],
    description: "在迷茫中寻找答案的真实系乐队",
    characters: {
      "千早爱音": { displayName: "千早爱音", displayNameEn: "Anon" },
      "椎名立希": { displayName: "椎名立希", displayNameEn: "Taki" },
      "\u9577\u5d0e\u723d\u4e16": { displayName: "长崎爽世", displayNameEn: "Sumire" },
      "高松灯": { displayName: "高松灯", displayNameEn: "Tomori" }
      // 注：要乐奈 暂无图片资源；注意：磁盘文件夹名为繁体"長崎爽世"
    }
  },

  // ===== Ave Mujica =====
  aveMujica: {
    id: "aveMujica",
    name: {
      zh: "Ave Mujica",
      en: "Ave Mujica",
      ja: "アヴェムジカ"
    },
    color: "#800080",
    members: ["丰川祥子", "若叶睦", "八幡海铃", "长崎爽世", "椎名立希"],
    description: "沉睡于剧场中的幻想乐团",
    characters: {}
    // 注：Ave Mujica 暂无任何图片资源
  }
};

/**
 * 特殊模式配置
 */
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

// 导出供其他模块使用
if (typeof globalThis !== "undefined") {
  globalThis.BANDS_CONFIG = BANDS_CONFIG;
  globalThis.DISPLAY_MODES = DISPLAY_MODES;
}
