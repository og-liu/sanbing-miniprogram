# 三冰 AI 助手

面向《三国冰河时代》玩家的非官方微信小程序。一期先把账号、角色档案、核心属性和个人中心搭起来，基于微信云开发，不依赖自建服务器。

![三冰 AI 助手图标](brand/sanbing-icon-144.png)

> 非官方项目，与游戏官方及发行方无关。名称中的“AI”是产品方向，当前一期尚未接入 AI 识别或分析能力。

## 项目简介

《三国冰河时代》的角色数据、核心属性和同盟信息，通常散落在游戏界面和群聊里。三冰 AI 助手希望把这些信息收进一个统一入口：

- 我是谁：微信身份与游戏角色绑定；
- 我在哪：所属区服、所属同盟；
- 我有多强：核心属性与出征兵力；
- 我们在做什么：后续的同盟协作、成员视图与数据分析。

一期先做“账号 + 角色档案 + 个人中心”的底座。总览、拜访、同盟三个 tab 目前是占位页，等成员、区服和同盟业务接入后再逐步填充。

## 当前功能

| 模块 | 说明 |
|---|---|
| 微信身份 | 用户主动登录后，由云函数从 `cloud.getWXContext().OPENID` 识别身份，不使用自建 Token |
| 可选资料 | 微信头像、昵称可稍后完善，不作为登录前置条件 |
| 角色初始化 | 游戏昵称、当前总战力、性别三项初始化，写入云数据库 |
| 个人中心 | 展示游戏昵称、性别、区服、同盟、核心属性与出征兵力上限 |
| 核心属性 | 8 项百分比属性 + 出征兵力，可进入独立编辑页修改 |
| 设置 | 微信资料编辑、账号信息、应用信息、退出登录 |
| 底部导航 | 总览 / 拜访 / 同盟 / 我的，自定义 tabBar |

### 登录流程

```text
打开小程序
  → 直接进入「总览」，不拦截、不弹授权
  → 进入「我的」：未登录时直接到登录页，可点「先逛逛」返回
  → 用户主动点「微信登录」
      → 云函数识别微信身份
      → 角色未初始化：进入角色初始化
      → 角色已初始化：进入个人中心
```

头像和昵称不是登录前置条件；项目不调用 `getPhoneNumber`，也不申请手机号权限。

## 技术栈

- **客户端**：微信小程序原生框架，WXML / WXSS / JavaScript，`glass-easel`，自定义 tabBar 与导航栏
- **后端**：微信云开发
  - 云函数：`sanbingAccount`
  - 云数据库：`sanbing_users`、`sanbing_game_profiles`
  - 云存储：`avatars/`
- **身份**：使用微信云调用上下文，不维护自建 Session
- **测试**：Node.js 原生 `node:test`

## 快速开始

1. 克隆仓库：

   ```bash
   git clone git@github.com:og-liu/sanbing-miniprogram.git
   cd sanbing-miniprogram
   ```

2. 用微信开发者工具打开项目，把自己的小程序 AppID 填入项目配置。

3. 开通云开发环境，把环境 ID 写入 [`config/index.js`](config/index.js)：

   ```js
   const CLOUD_ENV_ID = '你的云环境 ID'
   ```

4. 在云开发控制台创建集合：

   ```text
   sanbing_users
   sanbing_game_profiles
   ```

   并创建云存储目录 `avatars/`。

5. 右键 `cloudfunctions/sanbingAccount`，选择「上传并部署：云端安装依赖」。

6. 编译运行。首次身份由 `wx.cloud` 自动完成，不需要配置服务器域名或 AppSecret。

`project.private.config.json` 是微信开发者工具的本地私有配置，已在 `.gitignore` 中排除，不会提交。

## 项目结构

```text
sanbing-miniprogram/
├── app.js / app.json / app.wxss
├── config/index.js                 # 云环境与云函数配置
├── pages/                          # 页面
│   ├── overview/                   # 总览（占位）
│   ├── visit/                      # 拜访（占位）
│   ├── alliance/                   # 同盟（占位）
│   ├── profile/                    # 个人中心
│   ├── index/                      # 登录页
│   ├── init/                       # 角色初始化
│   ├── game-profile-edit/          # 角色资料编辑
│   ├── wechat-profile/             # 微信资料编辑
│   └── settings/                   # 设置
├── components/nav-bar/             # 自定义导航栏
├── custom-tab-bar/                 # 自定义底部导航
├── services/                       # 云函数调用与登录态
├── utils/                          # 头像、校验、展示、导航、动效
├── cloudfunctions/sanbingAccount/  # 账号、角色、头像云函数
├── tests/                          # 云函数与首登逻辑测试
├── docs/                           # 结构、设计、接口与开发记录
└── brand/                          # 应用图标
```

## 测试

```bash
node --test tests/cloud-function.test.js tests/onboarding.test.js
```

云函数动作、数据模型与错误码见 [云函数接口文档](docs/云函数接口文档.md)。

## 设计

界面采用「暖纸 / 墨黑 / 深青」三色体系：

```text
暖纸 #F3F1EA
墨黑 #141B21
深青 #255F59
```

不使用渐变、3D、阴影堆叠和装饰性动效；页面以内容结构为先，动效只做轻量反馈。完整规范见 [界面设计规范](docs/界面设计规范.md)。

## 当前边界

- 区服、同盟的创建 / 加入 / 成员管理尚未接入；
- 总览、拜访、同盟仍是占位状态；
- 截图上传、战力更新、报告、排行、AI 识别与自动操作尚未实现；
- 不提供游戏自动登录或云端代操作。

## 文档

- [项目目录结构说明](docs/项目目录结构说明.md)
- [界面设计规范](docs/界面设计规范.md)
- [云函数接口文档](docs/云函数接口文档.md)
- [开发日志](docs/开发日志.md)
