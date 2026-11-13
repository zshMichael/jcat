# Jcat 1.2.0

安装包没有 Apple 公证，也没有 Windows 签名。发布里的 `SHA256SUMS.txt` 可以用来核对下载文件。

---

## 中文

1.1 后面的一串小版本收在这一版里。

- 一个课程文件夹里如果有多个实验，每个实验单独编译运行，实验里的 public 类可以互相调用。一个文件里有多个顶层类时，不再跟着改文件名。
- macOS 上标题栏里的按钮可以点开，包括设置。菜单展开和收起都有动画。
- Windows 上窗口按显示器大小打开，右上角用系统按钮，界面用 Segoe UI。
- 保存长图会先打开预览。可以合并当前项目的代码，竖着或横着接，拖动排序，隐去行号，换预览主题而不改编辑器。卡片宽度跟着最长的一行，行尾留有空隙。预览框大小固定，拖动查看，滚轮缩放，点「回到初始」恢复。
- 文件菜单可以在访达或资源管理器中显示。新增夜航主题。

安装包：

- `jcat-1.2.0.dmg` — macOS Apple Silicon
- `jcat-1.2.0-x64-setup.exe` — Windows x64
- `jcat-1.2.0-arm64-setup.exe` — Windows ARM64
- `jcat-1.2.0-setup.exe` — Windows 自动识别（含 x64 与 ARM64）

macOS 第一次打开：访达里右键 Jcat → 打开。Windows 若出现 SmartScreen，选「仍要运行」。这次没有在 Windows 电脑上逐项点击。CI 会做安装、架构和启动检查。ARM64 包还没有在 ARM64 设备上跑过。

## English

The 1.1 patch releases are collected in this version.

- A course folder of labs is a workspace. Each lab compiles on its own, and its public classes can call each other. A file with several top-level types keeps its name.
- On macOS, title-bar buttons stay clickable, including Settings. Menus animate.
- On Windows, the window opens to most of the display, caption buttons are the system ones, and the UI uses Segoe UI.
- Long image opens a preview. Join this project's files vertically or horizontally, drag to reorder, hide line numbers, and preview another theme without changing the editor. The card follows the longest line and leaves room at the end. The frame stays fixed: drag to look around, scroll to zoom, and a button returns to the start.
- The file menu can reveal an item in Finder or Explorer. The 夜航 theme is included.

Installers:

- `jcat-1.2.0.dmg` — macOS Apple Silicon
- `jcat-1.2.0-x64-setup.exe` — Windows x64
- `jcat-1.2.0-arm64-setup.exe` — Windows ARM64
- `jcat-1.2.0-setup.exe` — Windows auto-detect (x64 and ARM64)

macOS first launch: right-click Jcat in Finder → Open. On Windows, if SmartScreen appears, choose Run anyway. This build was not click-tested on a Windows PC. CI still checks install, architecture, and launch. The ARM64 installer has not been run on an ARM64 device.

## 한국어

1.1의 작은 수정은 이 버전에 모았습니다.

- 실험 폴더가 여러 개면 각 실험이 따로 컴파일되고, 그 안의 public 클래스는 서로 호출할 수 있습니다. 파일에 최상위 타입이 여러 개면 파일 이름은 바꾸지 않습니다.
- macOS에서 제목 막대 버튼(설정 포함)을 누를 수 있습니다. 메뉴는 열리고 닫힐 때 움직입니다.
- Windows에서는 창이 화면 대부분을 차지하고, 캡션 버튼은 시스템 버튼이며, UI는 Segoe UI를 씁니다.
- 긴 그림은 미리보기로 열립니다. 이 프로젝트 파일을 세로 또는 가로로 잇고, 순서를 끌고, 줄 번호를 숨기고, 편집기 테마는 둔 채 미리보기 테마만 바꿀 수 있습니다. 카드 너비는 가장 긴 줄을 따르고 끝에 여백이 있습니다. 프레임 크기는 고정입니다. 끌어서 보고, 스크롤로 확대하며, 버튼으로 처음으로 돌아갑니다.
- 파일 메뉴에서 Finder 또는 탐색기에 표시할 수 있습니다. 夜航 테마가 들어 있습니다.

설치 파일:

- `jcat-1.2.0.dmg` — macOS Apple Silicon
- `jcat-1.2.0-x64-setup.exe` — Windows x64
- `jcat-1.2.0-arm64-setup.exe` — Windows ARM64
- `jcat-1.2.0-setup.exe` — Windows 자동 인식(x64와 ARM64)

macOS에서 처음 열 때는 Finder에서 우클릭 → 열기. Windows에서 SmartScreen이 뜨면 그래도 실행을 고릅니다. 이번 빌드는 Windows PC에서 직접 눌러 보지 않았습니다. CI는 설치, 아키텍처, 실행을 확인합니다. ARM64 설치 파일은 ARM64 기기에서 아직 실행하지 않았습니다.
