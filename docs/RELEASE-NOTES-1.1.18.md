# Jcat 1.1.18

Builds are **not Apple-signed or notarized** and **not Windows-signed**. Verify downloads with `SHA256SUMS.txt`. Do not disable OS security features to open Jcat.

---

## 中文

- **代码长图：** 「保存代码长图」会打开一张黄金比例的预览窗。宽高跟着代码走，预览自动适应窗口。打开时用当前主题，也可以在窗口里另选主题，只改这张图。可以勾选隐去行号、带上运行输出、合并此项目的代码，并选择竖着接或横着接。合并后可以拖动文件名调整顺序。设置里的「隐去行号」挪到了这个窗口。
- **macOS：** 当前未签名、未公证。第一次请在访达中右键 Jcat → 打开。
- **Windows：** 当前未代码签名，SmartScreen 可能显示“未知发布者”。这次没有在一台 Windows 电脑上逐项点击验证；安装包仍由 CI 做安装、PE 架构和启动存活检查。ARM64 包尚未在原生 ARM64 设备上运行验证。
- **安装包：**
  - `jcat-1.1.18.dmg` — macOS Apple Silicon
  - `jcat-1.1.18-x64-setup.exe` — Windows x64
  - `jcat-1.1.18-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.18-setup.exe` — Windows 自动识别（同一安装包内含 x64 与 ARM64 负载）

## English

- **Long image:** Save long image opens a golden-ratio sheet. Width and height follow the code, and the preview fits the window. It starts in the current theme; picking another theme changes only the picture. You can hide line numbers, include the run, join the project vertically or horizontally, and drag the file names to change the order. Hide line numbers moved here from Settings.
- **macOS:** unsigned and not notarized. First open in Finder: right-click Jcat → Open.
- **Windows:** not code-signed; SmartScreen may show an unknown publisher. This build was not click-tested on a Windows PC. CI still runs install, PE-arch, and launch checks. The ARM64 installer has not been run on a native ARM64 device.
- **Installers:**
  - `jcat-1.1.18.dmg` — macOS Apple Silicon
  - `jcat-1.1.18-x64-setup.exe` — Windows x64
  - `jcat-1.1.18-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.18-setup.exe` — Windows auto-detect (x64 and ARM64 payloads in one NSIS)

## 한국어

- **긴 그림:** 코드 긴 그림 저장이 황금비 창으로 열립니다. 가로와 세로는 코드를 따르고, 미리보기는 창에 맞춥니다. 열릴 때는 현재 테마를 쓰고, 다른 테마를 고르면 그림만 바뀝니다. 줄 번호 숨기기, 실행 결과 포함, 이 프로젝트 코드를 아래 또는 옆으로 잇기를 고를 수 있고, 파일 이름을 끌어 순서를 바꿉니다. 줄 번호 숨기기는 설정에서 이 창으로 옮겼습니다.
- **macOS:** 서명·공증되지 않았습니다. 처음에는 Finder에서 우클릭 → 열기.
- **Windows:** 코드 서명이 없어 SmartScreen이 뜰 수 있습니다. 이번 빌드는 Windows PC에서 직접 클릭 검증하지 않았습니다. CI의 설치·PE·실행 검사는 그대로입니다. ARM64는 실제 ARM64 기기 실행 검증이 아직 없습니다.
- **설치 파일:**
  - `jcat-1.1.18.dmg` — macOS Apple Silicon
  - `jcat-1.1.18-x64-setup.exe` — Windows x64
  - `jcat-1.1.18-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.18-setup.exe` — Windows 자동 인식(한 설치 파일에 x64와 ARM64)
