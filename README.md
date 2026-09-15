# Pear · 代码实现与验收

> 状态更正：原交付的画面对照与功能测试，不证明“所有可代码化素材均已替代”。已新增实际代码替代实验，详见 [实验结论](experiments/media-replacement/report.md)。单图整体变换、局部网格和纯代码三维梨均已运行；当前仍不能认定全部满足这条硬要求。

按 2026-09-15 现站研究重建的完整首页。**能用代码实现的部分全部用代码实现**；原始绘画和连续画面信息另行列明，不把视频播放算作程序生成画面。

## 打开

```sh
npm ci
npm run build
npm run preview
```

- 网站：<http://127.0.0.1:4187/>
- 对照、录像与文档：<http://127.0.0.1:4187/review/>
- 静态阅读：<http://127.0.0.1:4187/?reader=1>
- 固定首屏：`?hero=signal`、`?hero=colossus`、`?hero=reveal`。

服务器只监听本机。表单写入 `.local/inbox/applications.ndjson`，成功后显示本地收件结果，不会向 Pear 或第三方发送。请勿把 `.local/` 的收件记录提交或分享。

## 自检

```sh
npm run verify
npm run test:e2e
node scripts/test-frame-refresh.mjs
node scripts/test-review.mjs
```

浏览器检查默认使用 macOS 的 Google Chrome；也可通过 `CHROME_PATH` 指定路径。WebKit 检查需要先执行 `npx playwright-core install webkit`。`npm run compare` 需要联网访问 Pear，用于重新抓取对照。`node scripts/record-motion.mjs` 录制实际浏览器的正向与反向滚动。

## 文档

- [验收约定](docs/ACCEPTANCE.md)
- [实现说明](docs/IMPLEMENTATION.md)
- [UI/UX 设计交付要求](docs/DESIGN-HANDOFF.md)
- [检查结果与未验证项](docs/VERIFICATION.md)
- [设计刻度与展示层例外](docs/DESIGN-SCALES.md)

`verification/generated/` 保存截图、对照数据、浏览器录像和自检结果。评审页使用这些实际文件。修改场景后需要更新相应证据，不能继续将旧截图当成新版本验收。

`dist/build-manifest.json` 绑定实际源码与构建产物摘要。素材文件身份见 `docs/reference-assets.json`；视频分端处理、帧率、尺寸和质量记录见 `docs/video-provenance.json`。

本项目保留原站的概念、艺术方向、文案与媒体来源说明，属于内部技术研究，不是 Pear 官方源码仓库或商业授权声明。设计交付说明先由朱锋与 Owen 确认，再与 Cici 沟通。
