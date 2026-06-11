/**
 * 文件清单生成器 - BanG Dream! 贴纸扩展
 *
 * 功能：
 *   扫描 images/bands/ 目录下的所有 PNG 图片，
 *   生成 file-manifest.json 供 content.js 快速加载。
 *
 * 使用方法：
 *   node scripts/generate-manifest.js
 *
 * 输出：
 *   images/bands/file-manifest.json
 *
 * @version 1.0.0
 */

const fs = require("fs");
const path = require("path");

// ===== 配置 =====

/** 扩展根目录（脚本所在位置的上两级） */
const ROOT_DIR = path.resolve(__dirname, "..");

/** 乐队图片根目录 */
const BANDS_DIR = path.join(ROOT_DIR, "images", "bands");

/** 输出文件路径 */
const OUTPUT_FILE = path.join(BANDS_DIR, "file-manifest.json");

// ===== 主函数 =====

/**
 * 生成文件清单
 */
function generateManifest() {
  console.log("========================================");
  console.log("  BanG Dream! 贴纸 - 文件清单生成器");
  console.log("========================================\n");

  // 检查目录是否存在
  if (!fs.existsSync(BANDS_DIR)) {
    console.error(`错误：乐队目录不存在: ${BANDS_DIR}`);
    process.exit(1);
  }

  const manifest = {};
  let totalFiles = 0;
  let totalBands = 0;

  // 读取所有子目录（每个子目录 = 一个乐队）
  const bandDirs = fs.readdirSync(BANDS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => name !== "README.md"); // 排除说明文件

  console.log(`发现 ${bandDirs.length} 个乐队目录\n`);

  for (const bandId of bandDirs) {
    const bandPath = path.join(BANDS_DIR, bandId);

    // 检查是否是有效目录（包含角色子目录）
    const charDirs = fs.readdirSync(bandPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    if (charDirs.length === 0) {
      console.log(`  [跳过] ${bandId} / 无角色子目录`);
      continue;
    }

    manifest[bandId] = {};
    let bandCount = 0;

    for (const charDir of charDirs) {
      const charPath = path.join(bandPath, charDir);

      // 读取该角色目录下所有 PNG 文件
      const files = fs.readdirSync(charPath)
        .filter((name) => name.toLowerCase().endsWith(".png"))
        .sort();

      if (files.length === 0) continue;

      // 生成相对路径 URL（chrome.runtime.getURL 的相对路径部分）
      const urls = files.map(
        (file) => `images/bands/${bandId}/${charDir}/${file}`
      );

      manifest[bandId][charDir] = urls;
      bandCount += files.length;
      totalFiles += files.length;

      console.log(`    ${charDir}: ${files.length} 张图片`);
    }

    if (bandCount > 0) {
      totalBands++;
      const charCount = Object.keys(manifest[bandId]).length;
      console.log("  [OK] " + bandId + ": " + bandCount + " 张贴纸 (" + charCount + " 个角色)\n");
    } else {
      delete manifest[bandId];
    }
  }

  // 写入清单文件
  const output = JSON.stringify(manifest, null, 2);
  fs.writeFileSync(OUTPUT_FILE, output, "utf-8");

  // 输出统计
  console.log("----------------------------------------");
  console.log(`生成完成！`);
  console.log(`  有效乐队: ${totalBands}`);
  console.log(`  总图片数: ${totalFiles}`);
  console.log(`  输出文件: ${path.relative(ROOT_DIR, OUTPUT_FILE)}`);
  console.log("----------------------------------------");
}

// ===== 执行 =====

try {
  generateManifest();
} catch (error) {
  console.error("生成失败:", error.message);
  process.exit(1);
}
