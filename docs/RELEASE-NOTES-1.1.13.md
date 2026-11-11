# Jcat 1.1.13

Builds are **not Apple-signed or notarized** and **not Windows-signed**. Verify downloads with `SHA256SUMS.txt`. Do not disable OS security features to open Jcat.

---

## 中文

- **项目：** 打开一个装着很多实验文件夹的目录时，每个子文件夹是一个项目。编译和运行只处理当前打开的那个项目。同一个项目里的 public 类会一起编译，可以互相 `new`、互相调用。旁边的实验不会被编进去。只打开一个实验文件夹时，这个文件夹本身就是项目，里面的子文件夹也算在这个项目里。
- **macOS：** 当前未签名、未公证。第一次请在访达中右键 Jcat → 打开。
- **Windows：** 当前未代码签名，SmartScreen 可能显示“未知发布者”。这次没有在一台 Windows 电脑上逐项点击验证；安装包仍由 CI 做安装、PE 架构和启动存活检查。ARM64 包尚未在原生 ARM64 设备上运行验证。
- **安装包：**
  - `jcat-1.1.13.dmg` — macOS Apple Silicon
  - `jcat-1.1.13-x64-setup.exe` — Windows x64
  - `jcat-1.1.13-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.13-setup.exe` — Windows 自动识别（同一安装包内含 x64 与 ARM64 负载）

## English

- **Projects:** opening a folder of lab folders treats each child folder as a project. Compile and run use only the project of the file you have open. Public classes in that project compile together and can call each other. Neighboring labs are left out. Opening one lab folder keeps that folder as a single project, including its subfolders.
- **macOS:** unsigned and not notarized. First open in Finder: right-click Jcat → Open.
- **Windows:** not code-signed; SmartScreen may show an unknown publisher. This build was not click-tested on a Windows PC. CI still runs install, PE-arch, and launch checks. The ARM64 installer has not been run on a native ARM64 device.
- **Installers:**
  - `jcat-1.1.13.dmg` — macOS Apple Silicon
  - `jcat-1.1.13-x64-setup.exe` — Windows x64
  - `jcat-1.1.13-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.13-setup.exe` — Windows auto-detect (x64 and ARM64 payloads in one NSIS)

## 한국어

- **프로젝트:** 실습 폴더가 여러 개 들어 있는 폴더를 열면 각 하위 폴더가 프로젝트가 됩니다. 컴파일과 실행은 지금 연 파일이 속한 프로젝트만 다룹니다. 그 프로젝트의 public 클래스는 함께 컴파일되어 서로 호출할 수 있습니다. 옆 실습은 포함하지 않습니다. 실습 폴더 하나만 열면 그 폴더가 프로젝트이고 하위 폴더도 포함합니다.
- **macOS:** 서명·공증되지 않았습니다. 처음에는 Finder에서 우클릭 → 열기.
- **Windows:** 코드 서명이 없어 SmartScreen이 뜰 수 있습니다. 이번 빌드는 Windows PC에서 직접 클릭 검증하지 않았습니다. CI의 설치·PE·실행 검사는 그대로입니다. ARM64는 실제 ARM64 기기 실행 검증이 아직 없습니다.
- **설치 파일:**
  - `jcat-1.1.13.dmg` — macOS Apple Silicon
  - `jcat-1.1.13-x64-setup.exe` — Windows x64
  - `jcat-1.1.13-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.13-setup.exe` — Windows 자동 인식(한 설치 파일에 x64와 ARM64)
