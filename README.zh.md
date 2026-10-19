# zhang.workbench

[English](README.md) | 中文

`zhang.workbench` V0.1 是基于 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 定制的本地工作台，提供文件夹式工作区首页、简化的项目对话界面、可稍后添加的多模型 API Key 配置以及会话累计 Token 统计。右侧文件夹信息栏悬停展开，不展示本地路径。保留上游 MIT 许可证及源码来源说明。

## 文档工作台

本地工作台整合了 [Simin-Lab](https://github.com/chusimin/Simin-Lab) 的文档、AI 讨论与修改审阅流程，并保留其 MIT 署名。项目内同时展示文档列表、Markdown 阅读区和原有 AI 对话。新建文档与 AI 提出的修改需要预览并确认后才会写入；取消不会修改文档。工作台保留 zhang.workbench 品牌及模型提供商设置。

项目默认保存在源码目录下已被 Git 忽略的 `projects/` 中。已有工作区与会话不会搬动，可从**设置 → 原有工作区与会话**进入之前的界面。文档流程目前支持 Markdown 和纯文本文件，不导入 Simin-Lab 的示例项目或 PM Skills。

## 从源码运行本版本

需要 Node.js 22.19+ 或 24+ 以及 pnpm 11.7.0。克隆本仓库，安装依赖、构建，再启动本地网页界面：

```sh
git clone https://github.com/zhang1845/zhang.workbench.git
cd zhang.workbench
pnpm install
DSH_CLIENT_TITLE='zhang.workbench' pnpm build
pnpm dsh web
```

API Key 在应用内配置，也可稍后添加。不要提交密钥、`.env`、`.dsh-home`、个人工作区或会话数据。V0.1 发布源码，已有的本地开发 App 不是便携安装包。下方软件包版本属于上游框架，与本定制版的 `V0.1` 发布标签分别管理。

## 上游框架

DeepSeek Harness（`dsh`）是由 [DeepSeek AI](https://deepseek.com) 开发的开源 agent harness（智能体框架）。

它构建于**一切皆插件**的架构之上，由 [Cordis](https://github.com/cordiverse/cordis) 驱动，其设计参见论文 [_A Programming Paradigm for Spatiotemporal Composability_](https://arxiv.org/abs/2608.25512)。

文档：[https://deepseek-harness.github.io/deepseek-harness/](https://deepseek-harness.github.io/deepseek-harness/)

## 开发者预览

DeepSeek Harness 处于 _开发者预览_ 阶段，正在快速迭代。**未来将出现破坏兼容性的变更。**

运行本项目前，请阅读[安全说明](SAFETY.zh.md)。

<a id="run"></a>

## 运行

### 通过 `npm` 运行

安装 `Node.js`，然后运行：

```sh
npx @deepseek-ai/dsh web
```

该命令默认会在 `http://127.0.0.1:3080` 启动 Web UI，本机启动时还会用默认浏览器打开页面。通过 SSH 启动时只打印宿主机 URL，因为本地转发地址由 SSH 客户端或编辑器持有。传入 `--no-open` 可仅运行服务器而不打开浏览器。详见 [Web UI 指南](docs/user/guide/index.zh.md)。

<a id="run-from-source"></a>

### 从源码运行

如需从仓库源码运行：

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web
```

`pnpm run build` 会准备仓库产物。`pnpm dsh web` 会直接使用这些已构建产物，不会重新构建。

## 社区与支持

- 通过 [GitHub Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions) 提交反馈或 bug 报告。
- 为你的插件仓库添加 [`dsh-plugin`](https://github.com/topics/dsh-plugin) 话题，便于被发现。
- 欢迎加入 DeepSeek Harness 企微群！扫描下方二维码填写入群问卷，小助手会定期发送入群邀请。

<table>
  <thead>
    <tr>
      <th align="center">入群问卷</th>
      <th align="center">微信公众号</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center"><a href="https://trtgsjkv6r.feishu.cn/share/base/form/shrcnIt5twSVdLGD52KJBckGCgg"><img src="https://cdn.deepseek.com/harness/readme/community-wecom-survey.png" alt="DeepSeek Harness 入群问卷二维码" width="180" height="180"></a></td>
      <td align="center"><img src="https://cdn.deepseek.com/harness/readme/community-wechat-official-account.png" alt="DeepSeek Harness 团队微信公众号二维码" width="180" height="180"></td>
    </tr>
  </tbody>
</table>

## 参与贡献

参见 [CONTRIBUTING.md](CONTRIBUTING.zh.md)。

## 开发

请先阅读[开发指南](docs/development.zh.md)与[架构文档](docs/architecture.zh.md)。

`pnpm run dev:web` 会在一个终端里完成构建、启动，并在源码修改时重建 client bundle；`make help` 列出 Web 与 Desktop 对应的 Make target。完整表格见开发指南的「应用命令」一节。

面向 agent：请遵循 [AGENTS.md](AGENTS.md)。

## 引用

```bibtex
@misc{deepseek-harness2026,
  title={DeepSeek Harness: Everything is a Plugin},
  author={DeepSeek-AI},
  year={2026},
  publisher={GitHub},
  howpublished={\url{https://github.com/deepseek-ai/deepseek-harness}},
}
```

## 许可证

[MIT](LICENSE)

第三方依赖及其许可证见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
