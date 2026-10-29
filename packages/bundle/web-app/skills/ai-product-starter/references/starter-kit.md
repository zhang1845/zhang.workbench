# 产品工具包资料

在项目对话中使用 `/ai-product-starter`，描述想做的产品或要继续的阶段。当前模型按本技能的启动流程读取项目状态、PRD 和本轮要求；原工具包的规则与手册按下表补充，避免一次加载全部资料。

## 按阶段取资料

| 当前任务 | 原始资料 | 使用方式 |
| --- | --- | --- |
| 了解工具包和六阶段流程 | [使用手册](../assets/starter-kit/开始看这里.md) | 解释当前阶段、产品负责人要决定的事和证据交付方式 |
| PRD 访谈、体检 | [PRD 模板](../assets/starter-kit/docs/PRD模板.md) | 围绕八类输入补全需求，区分真实要求、假设和待确认项 |
| 查阶段产出、状态与决策台账 | [原始规则卡](../assets/starter-kit/AGENTS.md) | 参考阶段清单和状态模板；本技能的工作台适配优先 |
| 技术适配、后端 MVP、模型验证 | [通用技术栈手册](../assets/starter-kit/docs/手册/AI产品Vibe%20Coding通用技术栈手册.md) | 只查当前问题；沿用已有工程，不照搬版本和供应商 |
| 正式前端、交互与验收 | [前端手册](../assets/starter-kit/docs/手册/AI产品Vibe%20Coding通用前端技术栈手册.md) | 结合目标终端和现有技术栈选择相关章节 |
| 用户已要求部署或部署方案 | [上线部署手册](../assets/starter-kit/docs/手册/AI产品%20Vibe%20Coding%20通用上线部署手册.md) | 查流程与参考代码；使用平台前核对当前能力和费用 |

## 文档工作台与工程模板

文档项目继续使用根目录 `PRD.md`、`项目状态.md`、`技术适配声明.md` 和阶段验收文档，通过工作台预览、确认后保存。原模板的 `projects/<产品名>/docs/` 布局仅供独立工程参考，不在现有文档项目中强制创建，也不覆盖已有项目规则或数据。

`assets/starter-kit/` 保存原仓库的规则、模板、手册、CloudBase 参考代码和 `verify.sh`。仅当用户要求创建独立可执行工程，且当前环境允许写入该工程时，才按需复制模板、合并规则并为目标系统调整启动与验证说明。复制模板不表示已经安装依赖、实现产品或完成部署。没有代码执行能力时交付工程方案和交接清单，真实模型与脚本验证保留待验。

原始 `.gitignore` 以 `.gitignore.template` 保存，防止 npm 打包遗漏。创建新工程时恢复为 `.gitignore`；已有工程合并所需规则，不覆盖原文件。其内容与原文件一致，来源清单保留原路径。

## Windows 与 macOS

原始快照注明仅支持 macOS；工作台中的阶段方法可在 Windows 使用，但原始 `verify.sh` 和 Mac 命令不作为 Windows 可执行入口。Windows 工程使用自己的 Python `.venv/Scripts/python.exe`、Node 和包管理器；macOS 使用该工程的 `.venv/bin/python`。根据目标工程的依赖声明检查版本，保留路径中的中文与空格，不要求为文档阶段安装额外运行时。

需要验证可执行工程时，先读取它的既有测试、构建及启停脚本。Windows 使用该工程可执行的 PowerShell/Python 检查，macOS 使用已有对应入口；需要新增验证入口时同时维护两端说明。记录实际命令、退出码、证据文件与未配置项，不把原始 Bash 脚本未运行写成通过，不把 mock 当作真实模型结果。部署、费用和外部数据上传仍按当前用户请求和授权处理。

## 来源

原仓库为 [AI Product Starter Kit](https://github.com/hubooooooo/ai-product-starter-kit)，作者 hubooooooo，采用 [MIT 许可](../LICENSE)。[SOURCE.json](../SOURCE.json)记录原始快照版本与每个文件的 SHA-256；快照文件保持原样，工作台适配维护在本技能及本说明中。
