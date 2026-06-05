# 📋 待办便贴纸 TodoStickyNote

[English](README_EN.md) | 中文

一款 Windows 桌面待办浮窗软件，基于 Electron 构建，始终置顶于桌面，随时记录待办事项。

## 功能特性

- **待办管理** — 添加、编辑、完成、删除待办事项
- **截止时间** — 为待办设置截止日期，三色分级提醒（安全/警告/紧急）
- **待办排序** — 支持按创建时间或按截止时间排序
- **批量导入** — 支持从 .txt 文件批量导入待办
- **数据导出** — 一键导出所有待办为文本文件
- **窗口置顶** — 始终悬浮在桌面最前方，支持图钉快捷切换
- **透明度调节** — 自由调节窗口透明度
- **字体缩放** — 自定义界面字体大小
- **深浅主题** — 支持浅色/深色/跟随系统三种模式
- **自动清理** — 可选自动删除已完成的待办（7/30/90/180天）
- **开机自启** — 可选开机自动启动

## 安装

1. 前往 [Releases](https://github.com/LeslieHoHoHo/TodoStickyNote/releases) 页面下载最新版 `TodoStickyNote-Setup-x.x.x.exe`
2. 双击运行安装程序
3. 选择安装路径，完成安装
4. 从桌面快捷方式或开始菜单启动

## 源码打包

### 环境要求

- [Node.js](https://nodejs.org/) >= 18
- npm（随 Node.js 一起安装）

### 步骤

```bash
# 1. 克隆仓库
git clone https://github.com/LeslieHoHoHo/TodoStickyNote.git
cd TodoStickyNote

# 2. 安装依赖
npm install

# 3. 开发模式运行
npm start

# 4. 打包生成安装程序
npm run build
```

打包完成后，安装程序位于 `dist/TodoStickyNote-Setup-x.x.x.exe`。

### 技术栈

- [Electron](https://www.electronjs.org/) v28 — 桌面应用框架
- [electron-store](https://github.com/sindresorhus/electron-store) — 本地数据持久化
- [electron-builder](https://www.electron.build/) — 应用打包
