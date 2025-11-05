# Peekswap Lite

一个专注“聊天封面整蛊彩蛋”的移动端优先 Web 小工具。用户上传两张图片（封面图 A 与彩蛋图 B），本地浏览器即时合成一张包含上下白底缓冲的超长图：在微信/QQ 会话预览只露出封面图，中间藏着彩蛋，点开后展示完整画面。

## ✨ 核心特性
- **移动端优先**：UI/交互全部按照 375–430px 视口设计，桌面端自动适配并提供拖拽上传、快捷键等增强体验。
- **双图上传**：封面/彩蛋独立上传，自动校验尺寸与格式，调侃式提示信息让流程更轻松。
- **所见即所得预览**：提供“好友预览”“彩蛋全貌”两种模式，模拟真实聊天缩略裁切效果。
- **白底缓冲控制**：可调节上下白底高度，确保第二张图片始终居中展示，即便两张图尺寸差异较大也不穿帮。
- **本地合成导出**：纯前端 Canvas 合成，浏览器内完成导出与下载，不依赖任何后端服务。
- **玩乐氛围**：整蛊文案、彩带动效、粒子动画营造“搞事彩蛋实验室”风格。

## 🛠️ 技术栈
- [Next.js 16](https://nextjs.org/) + [React 19](https://react.dev/)（App Router）
- [Tailwind CSS 4](https://tailwindcss.com/) + 自定义动效 / 玻璃拟态风格
- [Zustand](https://github.com/pmndrs/zustand) 管理上传图片、白底参数状态
- Canvas (HTML5) 本地绘图合成
- [Radix UI](https://www.radix-ui.com/) 组件 + 自定义动效
- 打包部署推荐 [Vercel](https://vercel.com/)

## 🚀 快速开始
> 需要 Node.js 18+ 与 pnpm

```bash
cd code
pnpm install
pnpm dev
```

默认监听 `http://localhost:3000`。移动端体验建议使用浏览器开发者工具的设备模拟模式或真机调试。

### 构建与部署
```bash
pnpm build   # 生成生产环境构建产物
pnpm start   # 以生产模式本地预览
```

部署到 Vercel：
1. 将仓库导入 Vercel。
2. Framework 选择 Next.js，构建命令保持 `pnpm install && pnpm build`。
3. 输出目录使用默认设置，首发即可获得一个 `*.vercel.app` 地址。

## 📁 目录结构
```
.
├── README.md                # 当前说明文档
├── code/                    # Next.js 应用
│   ├── app/                 # App Router 页面与布局
│   ├── components/          # UI 组件
│   ├── lib/                 # 图片处理、状态管理等工具函数
│   ├── public/              # 静态资源
│   └── styles/              # Tailwind 适配样式
└── doc/                     # 产品文档（需求、UI 方案、常见问题）
```

## 🧪 功能验证要点
1. 上传尺寸差别较大的两张图片，调整白底高度，确认预览中的彩蛋图始终居中。
2. 切换到“完整彩蛋”标签，验证上下白底被同步拉伸，导出后仍保持原样。
3. 通过手机浏览器测试长按保存，或桌面端下载按钮确认导出的 JPEG 正常显示。

## 🤝 参与贡献
欢迎提出 Issue / Pull Request：
1. Fork 本仓库并创建新分支。
2. `pnpm lint` 检查代码风格。
3. 提交 PR 时附上问题描述 & 截图或录屏。

## 📄 License
本项目采用 [MIT License](./LICENSE) 许可。
