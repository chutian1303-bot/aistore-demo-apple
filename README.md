# JNBY AI 店铺手机端 Demo

这是一个可手机演示的 H5，并已接入服务端代理架构：

- 前端：`index.html` + `styles.css` + `app.js`
- 后端代理：`api/chat.js`（调用 Minimax OpenAI 兼容接口）
- 设计参考：`source-journey.html`

## 已实现能力

- 底部输入框常驻
- 输入框上方推荐意图
- 商品详情以浮层打开（不跳页）
- 详情态推荐意图切换（尺码、AI试衣、优惠等）
- 关闭详情后在输入框上方左侧显示 `店内足迹` 入口
- 调用 `/api/chat` 失败时自动回退本地模拟逻辑

## 本地运行（仅前端）

```bash
cd "/Users/headplus/Documents/New project"
python3 -m http.server 8080
```

访问：

- `http://localhost:8080`

说明：`python http.server` 不会运行 `api/chat.js`，因此本地会走前端模拟回复（这是预期行为）。

## 公网部署（推荐：Vercel）

`api/chat.js` 是服务端函数，建议部署到 Vercel（不要用 GitHub Pages，它只支持静态页面）。

1. 把代码推到 GitHub 仓库。
2. 打开 [Vercel](https://vercel.com/) 并导入该 GitHub 仓库。
3. 在 Vercel 项目里配置环境变量：

- `MINIMAX_API_KEY` = 你的 Minimax Key
- `MINIMAX_BASE_URL` = `https://api.minimaxi.com/v1`
- `MINIMAX_MODEL` = `MiniMax-M2.5`

4. 点击 Deploy，等待完成后会得到公网 URL。
5. 用二维码工具把该 URL 生成二维码，客户即可手机扫码体验。

## 安全注意事项

- API Key 必须只放在部署平台环境变量中，不能写进前端代码或仓库。
- 建议保留 `.gitignore` 中的 `.env` / `.env.local`。

