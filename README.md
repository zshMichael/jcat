# Jcat

本地 Java IDE：编译运行、DeepSeek 灰度补全、AI Debug、代码长图导出。猫咪只以线条出现。

## 开发

需要本机 Node.js 20+，以及 JDK（可选 Maven）。

```bash
npm install
npm run dev
```

打开 `examples/hello` 可以立刻编译运行。在设置里填入 DeepSeek API Key 后，状态栏打开「补全」，停键会出现灰色预写，Tab 采纳。

## 打包

```bash
npm run build:mac    # macOS .dmg / .app
npm run build:win    # Windows x64 + arm64 安装包（也可在 GitHub Actions 上打）
```

Windows 交叉编译若在 macOS 上失败，推送 tag 后用 `.github/workflows/build.yml` 在 Windows runner 打包。本机打的 macOS 安装包未签名，第一次打开用右键「打开」。

API Key 只保存在本机用户目录，不会写入工程文件。
