<div align="center">

# BlockGate

![BlockGate](https://img.shields.io/badge/version-1.2.7-blue)
![License](https://img.shields.io/badge/license-GPLv3-green)
![Tauri](https://img.shields.io/badge/Tauri-2.x-purple)
![React](https://img.shields.io/badge/React-18-blue)
![Rust](https://img.shields.io/badge/Rust-stable-orange)

一款现代化的 Minecraft 启动器，基于 Tauri + React 构建

[功能特性](#功能特性) • [快速开始](#快速开始) • [技术栈](#技术栈) • [贡献指南](#贡献指南) • [许可证](#许可证)

</div>

## 功能特性

### 🎮 游戏管理
- **多版本支持** - 支持 Minecraft Java 版所有正式版本和快照版本
- **模组加载器** - 内置 Forge、NeoForge、Fabric、Quilt 等主流模组加载器一键安装
- **实例管理** - 每个游戏实例独立管理，互不干扰
- **快速启动** - 支持直接快速启动到指定存档，省去点击单人游戏和选择存档的步骤

### 📦 资源下载
- **Modrinth 集成** - 完整支持 Modrinth 平台，可下载 Mod、模组包、资源包、光影包等
- **多镜像源** - 支持官方源、BMCLAPI、FastMinecraftMirror 等多个下载源
- **自动安装** - 一键下载并自动安装到对应实例

### ☕ Java 管理
- **自动检测** - 自动扫描系统中已安装的 Java 版本
- **一键下载** - 支持下载 Mojang 官方 Java 以及第三方 Java 发行版
  - Azul Zulu
  - BellSoft Liberica JDK
  - Eclipse Temurin (Adoptium)
- **版本推荐** - 根据游戏版本自动推荐合适的 Java 版本

### 🌐 多人联机
- **陶瓦联机** - 内置陶瓦联机支持，无需公网 IP 即可和好友联机
- **自定义服务器** - 支持添加自定义多人游戏服务器

### 🌍 国际化
- **多语言支持** - 支持简体中文、繁体中文、英语、法语、日语
- **自动检测** - 根据系统语言自动切换界面语言

### 🎨 界面设计
- **现代化 UI** - 基于 Chakra UI 的现代化界面设计
- **主题切换** - 支持亮色/暗色主题
- **流畅动画** - 精心设计的过渡动画效果

### ⚡ 性能优化
- **启动优化** - 优化启动流程，减少界面响应延迟
- **懒加载** - 非关键资源按需加载
- **虚拟列表** - 大量资源时使用虚拟列表保证流畅性

## 技术栈

### 前端
- **React 18** - 用户界面库
- **Next.js 15** - React 框架
- **TypeScript** - 类型安全
- **Chakra UI** - 组件库
- **Tauri API v2** - 与后端通信

### 后端
- **Rust** - 系统级编程语言
- **Tauri v2** - 跨平台桌面应用框架
- **Tokio** - 异步运行时
- **Reqwest** - HTTP 客户端

### 构建工具
- **npm** / **pnpm** - 包管理器
- **Cargo** - Rust 构建工具
- **Tauri CLI** - Tauri 开发和构建工具

## 快速开始

### 环境要求

- Node.js >= 18
- Rust (stable)
- 系统依赖（根据操作系统）
  - **Windows**: WebView2（Windows 10/11 已内置）
  - **macOS**: Xcode Command Line Tools
  - **Linux**: libwebkit2gtk-4.1-dev 等依赖

### 开发环境

```bash
# 克隆仓库
git clone https://github.com/yzh-q/BlockGate.git
cd BlockGate

# 安装依赖
npm install
# 或使用 pnpm
# pnpm install

# 启动开发服务器
npm run tauri dev
```

### 构建生产版本

```bash
# 构建桌面应用
npm run tauri build

# 构建产物位于 src-tauri/target/release/bundle/ 目录下
```

## 项目结构

```
BlockGate/
├── src/                     # 前端源代码
│   ├── components/          # React 组件
│   ├── contexts/            # React Context
│   ├── pages/               # Next.js 页面
│   ├── services/            # API 服务
│   ├── models/              # TypeScript 类型定义
│   ├── locales/             # 多语言文件
│   └── styles/              # 样式文件
├── src-tauri/               # Tauri/Rust 后端
│   ├── src/
│   │   ├── launcher_config/ # 启动器配置
│   │   ├── instance/        # 游戏实例管理
│   │   ├── resource/        # 资源下载
│   │   ├── launch/          # 游戏启动
│   │   ├── multiplayer/     # 多人联机
│   │   ├── networking/      # 网络功能
│   │   └── utils/           # 工具函数
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
└── README.md
```

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

### 代码规范

- **前端**: 遵循 ESLint 和 Prettier 配置
- **Rust**: 遵循 `rustfmt` 和 `clippy` 规范
- **提交信息**: 使用有意义的提交信息描述更改

## 许可证

本项目采用 **GNU General Public License v3.0** 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 致谢

- [Tauri](https://tauri.app/) - 跨平台桌面应用框架
- [Minecraft](https://www.minecraft.net/) - 伟大的游戏
- [Modrinth](https://modrinth.com/) - Mod 平台
- [BMCLAPI](https://bmclapidoc.bangbang93.com/) - 国内下载镜像源
- [SJMCL](https://gitee.com/colid/SJMCL) - 项目基础来源

---

<div align="center">

⭐ 如果这个项目对你有帮助，欢迎点个 Star！

</div>
