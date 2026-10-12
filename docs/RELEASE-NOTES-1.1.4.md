# Jcat 1.1.4

Builds are **not Apple-signed or notarized** and **not Windows-signed**. Verify downloads with `SHA256SUMS.txt`. Do not disable OS security features to open Jcat.

---

## 中文

- **项目树：** 点击文件或文件夹不再卡住窗口。Mac 和 Windows 用的是同一套点击处理，这次去掉了会冻住界面的指针捕获。
- **拖动：** 可以把文件从文件夹拖回项目根目录。之前会被拒绝，并误提示「名字不能包含路径分隔符」。
- **文件夹：** 展开或收起后，文件夹行不再一直保持选中底色。
- **macOS：** 当前未签名、未公证。第一次请在访达中右键 Jcat → 打开。
- **Windows：** 当前未代码签名，SmartScreen 可能显示“未知发布者”。这次没有在一台 Windows 电脑上逐项点击验证；安装包仍由 CI 做安装、PE 架构和启动存活检查。ARM64 包尚未在原生 ARM64 设备上运行验证。
- **安装包：**
  - `jcat-1.1.4.dmg` — macOS Apple Silicon
  - `jcat-1.1.4-x64-setup.exe` — Windows x64
  - `jcat-1.1.4-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.4-setup.exe` — Windows 自动识别（同一安装包内含 x64 与 ARM64 负载）

## English

- **Project tree:** clicking a file or folder no longer freezes the window. macOS and Windows share this click path; the pointer capture that locked the UI is gone.
- **Drag:** a file can be dragged out of a folder onto the project root. That used to be rejected and reported as a bad file name.
- **Folders:** expanding or collapsing a folder no longer leaves the row highlighted.
- **macOS:** unsigned and not notarized. First open in Finder: right-click Jcat → Open.
- **Windows:** not code-signed; SmartScreen may show an unknown publisher. This build was not click-tested on a Windows PC. CI still runs install, PE-arch, and launch checks. The ARM64 installer has not been run on a native ARM64 device.
- **Installers:**
  - `jcat-1.1.4.dmg` — macOS Apple Silicon
  - `jcat-1.1.4-x64-setup.exe` — Windows x64
  - `jcat-1.1.4-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.4-setup.exe` — Windows auto-detect (x64 and ARM64 payloads in one NSIS)

## 한국어

- **프로젝트 트리:** 파일이나 폴더를 눌러도 창이 멈추지 않습니다. macOS와 Windows가 같은 클릭 처리를 쓰며, 화면을 잠그던 포인터 캡처를 뺐습니다.
- **끌기:** 폴더 안의 파일을 프로젝트 루트로 다시 끌어낼 수 있습니다. 이전에는 거절되고 이름 오류로 보였습니다.
- **폴더:** 펼치거나 접은 뒤에도 그 줄이 선택된 채로 남지 않습니다.
- **macOS:** 서명·공증되지 않았습니다. 처음에는 Finder에서 우클릭 → 열기.
- **Windows:** 코드 서명이 없어 SmartScreen이 뜰 수 있습니다. 이번 빌드는 Windows PC에서 직접 클릭 검증하지 않았습니다. CI의 설치·PE·실행 검사는 그대로입니다. ARM64는 실제 ARM64 기기 실행 검증이 아직 없습니다.
- **설치 파일:**
  - `jcat-1.1.4.dmg` — macOS Apple Silicon
  - `jcat-1.1.4-x64-setup.exe` — Windows x64
  - `jcat-1.1.4-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.4-setup.exe` — Windows 자동 인식(한 설치 파일에 x64와 ARM64)
