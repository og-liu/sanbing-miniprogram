# 三冰 AI 助手

![三冰 AI 助手图标](brand/sanbing-icon-144.png)

> 非官方项目，与游戏官方及发行方无关。

面向《三国冰河时代》玩家的非官方微信小程序。一期先把账号、角色档案、核心属性和个人中心搭起来，基于微信云开发，不依赖自建服务器。



## 项目简介

《三国冰河时代》的角色数据、核心属性和同盟信息，通常散落在游戏界面和群聊里。三冰 AI 助手希望把这些信息收进一个统一入口：

- 我是谁：微信身份与游戏角色绑定；
- 我在哪：所属区服、所属同盟；
- 我有多强：核心属性与出征兵力；
- 我们在做什么：后续的同盟协作、成员视图与数据分析。

头像和昵称不是登录前置条件；项目不调用 `getPhoneNumber`，也不申请手机号权限。

## 技术栈

- **客户端**：微信小程序原生框架，WXML / WXSS / JavaScript，`glass-easel`，自定义 tabBar 与导航栏
- **后端**：微信云开发
  - 云函数：`sanbingAccount`
  - 云数据库：`sanbing_users`、`sanbing_game_profiles`
  - 云存储：`avatars/`
- **身份**：使用微信云调用上下文，不维护自建 Session
- **测试**：Node.js 原生 `node:test`

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

## 相关文档

- [项目目录结构说明](docs/项目目录结构说明.md)
- [界面设计规范](docs/界面设计规范.md)
- [云函数接口文档](docs/云函数接口文档.md)
- [开发日志](docs/开发日志.md)
