# 作品集网页

这是一个简洁、高级、可按文件夹维护内容的静态作品集网页。你只需要把作品图片和文字说明放进 `content` 文件夹，再运行一次生成命令，网页就会自动更新。

## 内容结构

推荐这样放：

```text
content/
  profile.json
  01-品牌设计/
    项目A/
      info.txt
      cover.jpg
      01.jpg
      02.png
  02-摄影作品/
    项目B/
      info.txt
      cover.jpg
```

文件夹规则：

- `content/profile.json`：修改你的名字、简介、联系方式等。
- 社交媒体账号也写在 `content/profile.json` 的 `Social` 字段里，例如 `小红书：你的账号 / Instagram：yourname`。
- `content/分类名/作品名/`：每一个作品一个文件夹。
- `info.txt`：这个作品的说明文字。
- 图片支持：`.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.avif`。
- 分类名前面可以加数字排序，比如 `01-品牌设计`、`02-摄影作品`。
- `content/个人主页/`：放 1-2 张图片，会自动作为首页视觉图，不会进入作品分类。

也可以把单张图片直接放在分类文件夹里：

```text
content/
  03-插画/
    海报01.jpg
    海报01.txt
```

同名 `.txt` 会作为这张图片的说明。

## 更新网页

安装好 Node.js 后，在本目录运行：

```bash
npm run build
```

它会扫描 `content` 文件夹，并生成 `portfolio-data.js`。

## 访问网页

直接用浏览器打开 `index.html` 即可。

如果你想本地启动一个访问地址，可以运行：

```bash
npm start
```

## 导出 PDF

打开网页后，点击右上角 `PDF` 按钮，在浏览器打印窗口里选择“保存为 PDF”。页面已经写好了 A4 打印样式，会自动隐藏导航和按钮。
