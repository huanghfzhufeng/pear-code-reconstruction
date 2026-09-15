# 设计刻度与例外

普通阅读和评审界面使用 4/8/12/16/24/32/48/64 间距与 12/16/20/32/48 字号。

以下是现站实测的电影场景字号：场景整体缩放时参与图文配准，为保留原站画面而逐项列为展示层刻度例外；不能在普通 UI 任意使用。

- `--type-scene-1`：`10px`
- `--type-scene-2`：`clamp(30px, 8.11vw, 177px)`
- `--type-scene-3`：`26.222px`
- `--type-scene-4`：`12.8px`
- `--type-scene-5`：`26.57px`
- `--type-scene-6`：`12.16px`
- `--type-scene-7`：`9.16px`
- `--type-scene-8`：`20px`
- `--type-scene-9`：`14px`
- `--type-scene-10`：`11px`
- `--type-scene-11`：`25px`
- `--type-scene-12`：`77.872px`
- `--type-scene-13`：`23.903px`
- `--type-scene-14`：`15.8px`
- `--type-scene-15`：`8.4px`
- `--type-scene-16`：`23.222px`
- `--type-scene-17`：`clamp(34px, 4.6vw, 86px)`
- `--type-scene-18`：`.92em`
- `--type-scene-19`：`clamp(9px, .72vw, 11px)`
- `--type-scene-20`：`clamp(9px, .66vw, 12px)`
- `--type-scene-21`：`9px`
- `--type-scene-22`：`clamp(8px, .534vw, 10px)`
- `--type-scene-23`：`clamp(28px, 4.6vw, 82px)`
- `--type-scene-24`：`clamp(30px, 5.357vw, 96px)`
- `--type-scene-25`：`clamp(14px, 1.68vw, 30px)`
- `--type-scene-26`：`clamp(26px, 3.32vw, 60px)`
- `--type-scene-27`：`clamp(13px, 1.068vw, 19px)`
- `--type-scene-28`：`20.4px`
- `--type-scene-29`：`14.6px`
- `--type-scene-30`：`31px`
- `--type-scene-31`：`16.4px`
- `--type-scene-32`：`13.2px`
- `--type-scene-33`：`55.7px`
- `--type-scene-34`：`calc(10.784vw - 3.575px)`
- `--type-scene-35`：`16px`

舞台坐标、SVG 路径、纹理像素、着色器几何量属于画面几何数据，不作为 UI 间距。颜色集中在 tokens.css 和 scene.css 的 :root 定义，所有状态颜色引用语义变量。
