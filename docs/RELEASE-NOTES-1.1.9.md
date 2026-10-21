# Jcat 1.1.9

Builds are **not Apple-signed or notarized** and **not Windows-signed**. Verify downloads with `SHA256SUMS.txt`. Do not disable OS security features to open Jcat.

---

## 中文

- **主题：** 去掉「开心果」。原位置换成「夜航」：深蓝底，关键字淡紫，字符串亮绿，名字偏蓝。如果之前选的是开心果，打开后会自动变成夜航。
- **macOS：** 当前未签名、未公证。第一次请在访达中右键 Jcat → 打开。
- **Windows：** 当前未代码签名，SmartScreen 可能显示“未知发布者”。这次没有在一台 Windows 电脑上逐项点击验证；安装包仍由 CI 做安装、PE 架构和启动存活检查。ARM64 包尚未在原生 ARM64 设备上运行验证。
- **安装包：**
  - `jcat-1.1.9.dmg` — macOS Apple Silicon
  - `jcat-1.1.9-x64-setup.exe` — Windows x64
  - `jcat-1.1.9-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.9-setup.exe` — Windows 自动识别（同一安装包内含 x64 与 ARM64 负载）

## English

- **Theme:** Pistachio is gone. Its place is Night sail (夜航): a dark navy editor with lavender keywords, green strings, and blue names. A saved pistachio choice becomes Night sail.
- **macOS:** unsigned and not notarized. First open in Finder: right-click Jcat → Open.
- **Windows:** not code-signed; SmartScreen may show an unknown publisher. This build was not click-tested on a Windows PC. CI still runs install, PE-arch, and launch checks. The ARM64 installer has not been run on a native ARM64 device.
- **Installers:**
  - `jcat-1.1.9.dmg` — macOS Apple Silicon
  - `jcat-1.1.9-x64-setup.exe` — Windows x64
  - `jcat-1.1.9-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.9-setup.exe` — Windows auto-detect (x64 and ARM64 payloads in one NSIS)

## 한국어

- **테마:** 피스타치오를 뺐습니다. 그 자리는 야항(夜航)입니다. 짙은 남색 배경에 연보라 키워드, 초록 문자열, 파란 이름입니다. 이전에 피스타치오를 골랐으면 야항으로 바뀝니다.
- **macOS:** 서명·공증되지 않았습니다. 처음에는 Finder에서 우클릭 → 열기.
- **Windows:** 코드 서명이 없어 SmartScreen이 뜰 수 있습니다. 이번 빌드는 Windows PC에서 직접 클릭 검증하지 않았습니다. CI의 설치·PE·실행 검사는 그대로입니다. ARM64는 실제 ARM64 기기 실행 검증이 아직 없습니다.
- **설치 파일:**
  - `jcat-1.1.9.dmg` — macOS Apple Silicon
  - `jcat-1.1.9-x64-setup.exe` — Windows x64
  - `jcat-1.1.9-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.9-setup.exe` — Windows 자동 인식(한 설치 파일에 x64와 ARM64)
