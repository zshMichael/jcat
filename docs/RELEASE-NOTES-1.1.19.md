# Jcat 1.1.19

Builds are **not Apple-signed or notarized** and **not Windows-signed**. Verify downloads with `SHA256SUMS.txt`. Do not disable OS security features to open Jcat.

---

## 中文

- **代码长图：** 预览框离窗口边缘更远，图片是圆角。右侧打勾会马上勾上，图在后面更新，不再卡住。导出的图按所选主题着色，和 IDE 里一致；标志和「类名 · 主题名」恢复成原来的长图样子。浅色主题也能看清。
- **macOS：** 当前未签名、未公证。第一次请在访达中右键 Jcat → 打开。
- **Windows：** 当前未代码签名，SmartScreen 可能显示“未知发布者”。这次没有在一台 Windows 电脑上逐项点击验证；安装包仍由 CI 做安装、PE 架构和启动存活检查。ARM64 包尚未在原生 ARM64 设备上运行验证。
- **安装包：**
  - `jcat-1.1.19.dmg` — macOS Apple Silicon
  - `jcat-1.1.19-x64-setup.exe` — Windows x64
  - `jcat-1.1.19-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.19-setup.exe` — Windows 自动识别（同一安装包内含 x64 与 ARM64 负载）

## English

- **Long image:** the preview sits further inside the sheet, and the picture has rounded corners. Checkboxes respond immediately, and the picture updates afterward. The exported image uses that theme's IDE colors, and the mark plus "class · theme" match the previous long image. Light themes stay readable.
- **macOS:** unsigned and not notarized. First open in Finder: right-click Jcat → Open.
- **Windows:** not code-signed; SmartScreen may show an unknown publisher. This build was not click-tested on a Windows PC. CI still runs install, PE-arch, and launch checks. The ARM64 installer has not been run on a native ARM64 device.
- **Installers:**
  - `jcat-1.1.19.dmg` — macOS Apple Silicon
  - `jcat-1.1.19-x64-setup.exe` — Windows x64
  - `jcat-1.1.19-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.19-setup.exe` — Windows auto-detect (x64 and ARM64 payloads in one NSIS)

## 한국어

- **긴 그림:** 미리보기가 창 가장자리에서 더 떨어져 있고, 그림 모서리는 둥급니다. 체크는 바로 바뀌고 그림은 뒤에서 갱신됩니다. 내보낸 그림은 고른 테마의 IDE 색을 쓰고, 표시와 "클래스 · 테마"는 이전 긴 그림과 같습니다. 밝은 테마도 읽을 수 있습니다.
- **macOS:** 서명·공증되지 않았습니다. 처음에는 Finder에서 우클릭 → 열기.
- **Windows:** 코드 서명이 없어 SmartScreen이 뜰 수 있습니다. 이번 빌드는 Windows PC에서 직접 클릭 검증하지 않았습니다. CI의 설치·PE·실행 검사는 그대로입니다. ARM64는 실제 ARM64 기기 실행 검증이 아직 없습니다.
- **설치 파일:**
  - `jcat-1.1.19.dmg` — macOS Apple Silicon
  - `jcat-1.1.19-x64-setup.exe` — Windows x64
  - `jcat-1.1.19-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.19-setup.exe` — Windows 자동 인식(한 설치 파일에 x64와 ARM64)
