# Jcat 1.1.17

Builds are **not Apple-signed or notarized** and **not Windows-signed**. Verify downloads with `SHA256SUMS.txt`. Do not disable OS security features to open Jcat.

---

## 中文

- **文件菜单：** 右键文件或文件夹，可以「在文件夹中显示」。macOS 会在访达里选中它，Windows 会在资源管理器里选中它。
- **下拉：** 语言、更多、运行类、排序这些菜单收起时也会收回去，不再一下消失。
- **macOS：** 当前未签名、未公证。第一次请在访达中右键 Jcat → 打开。
- **Windows：** 当前未代码签名，SmartScreen 可能显示“未知发布者”。这次没有在一台 Windows 电脑上逐项点击验证；安装包仍由 CI 做安装、PE 架构和启动存活检查。ARM64 包尚未在原生 ARM64 设备上运行验证。
- **安装包：**
  - `jcat-1.1.17.dmg` — macOS Apple Silicon
  - `jcat-1.1.17-x64-setup.exe` — Windows x64
  - `jcat-1.1.17-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.17-setup.exe` — Windows 自动识别（同一安装包内含 x64 与 ARM64 负载）

## English

- **File menu:** right-click a file or folder and choose Show in Folder. macOS selects it in Finder. Windows selects it in File Explorer.
- **Menus:** language, More, the run class, and sort now animate closed as well as open.
- **macOS:** unsigned and not notarized. First open in Finder: right-click Jcat → Open.
- **Windows:** not code-signed; SmartScreen may show an unknown publisher. This build was not click-tested on a Windows PC. CI still runs install, PE-arch, and launch checks. The ARM64 installer has not been run on a native ARM64 device.
- **Installers:**
  - `jcat-1.1.17.dmg` — macOS Apple Silicon
  - `jcat-1.1.17-x64-setup.exe` — Windows x64
  - `jcat-1.1.17-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.17-setup.exe` — Windows auto-detect (x64 and ARM64 payloads in one NSIS)

## 한국어

- **파일 메뉴:** 파일이나 폴더를 우클릭하면 폴더에서 보기를 고를 수 있습니다. macOS는 Finder에서, Windows는 탐색기에서 그 항목을 선택합니다.
- **메뉴:** 언어, 더 보기, 실행 클래스, 정렬 메뉴가 닫힐 때도 접히며 사라집니다.
- **macOS:** 서명·공증되지 않았습니다. 처음에는 Finder에서 우클릭 → 열기.
- **Windows:** 코드 서명이 없어 SmartScreen이 뜰 수 있습니다. 이번 빌드는 Windows PC에서 직접 클릭 검증하지 않았습니다. CI의 설치·PE·실행 검사는 그대로입니다. ARM64는 실제 ARM64 기기 실행 검증이 아직 없습니다.
- **설치 파일:**
  - `jcat-1.1.17.dmg` — macOS Apple Silicon
  - `jcat-1.1.17-x64-setup.exe` — Windows x64
  - `jcat-1.1.17-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.17-setup.exe` — Windows 자동 인식(한 설치 파일에 x64와 ARM64)
