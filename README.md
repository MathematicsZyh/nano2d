# Nano2D 详细使用文档

## 1. 概述

Nano2D 是一个零依赖、轻量级的 HTML5 Canvas 游戏引擎，集成了：  
- 精灵管理（绘制、动画、物理）  
- 场景分组与更新  
- 输入处理（键盘、鼠标、触摸）  
- 资源缓存（图片、音频）  
- 简易粒子系统  
- 音频播放与控制  
- 异步网络请求  
- UI 控件（按钮、摇杆、文本输入）  

适合快速上手 2D 游戏或交互应用开发。

---

## 2. 快速开始

1. 在 HTML 中引入引擎脚本  
   ```html
   <script src="nano2d.js"></script>
   ```
2. 创建全屏 Canvas 并初始化游戏  
   ```html
   <canvas id="nano2dCanvas"></canvas>
   <script>
     Nano2D.Game.init(() => {
       // 启动逻辑
     });
   </script>
   ```
3. 在回调内添加精灵、UI 或自定义逻辑  
   ```js
   const hero = new Nano2D.Sprite({
     texture: 'hero.png', x:50, y:50
   });
   Nano2D.Game.scene.add(hero);
   ```

---

## 3. 核心模块

### 3.1 Resource 资源管理

| 方法               | 参数      | 返回值        | 说明                         |
| ------------------ | --------- | ------------- | ---------------------------- |
| loadImage(src)     | src:String | Image 对象    | 缓存并返回 Image 实例        |
| loadAudio(src)     | src:String | Audio 实例    | 缓存、克隆并返回 Audio 实例  |

### 3.2 Input 输入管理

```js
Nano2D.Input.init();    // 初始化监听
Nano2D.Input.clear();   // 每帧结束后清除一次 click/up/touchend
```

- **keys**: `{ [code]: boolean }`  
- **mouse**: `{ x, y, down, up, click }`  
- **touches**: `{ start?, end? }`

### 3.3 Sprite 精灵对象

#### 构造参数（options）

| 字段              | 类型         | 默认               | 说明                                |
| ----------------- | ------------ | ------------------ | ----------------------------------- |
| name              | String       | ''                 | 可选名称                            |
| texture           | String       | —                  | 图片路径                            |
| x, y              | Number       | 0                  | 初始坐标                            |
| width, height     | Number       | 图片原始大小       | 渲染尺寸                            |
| visible           | Boolean      | true               | 可见性                              |
| rotation          | Number(rad)  | 0                  | 旋转角度                            |
| scaleX, scaleY    | Number       | 1                  | 缩放                                |
| alpha             | Number [0,1] | 1                  | 透明度                              |
| frames            | String[]     | null               | 帧动画贴图数组                      |
| frameSpeed        | Number(sec)  | 0                  | 帧切换速度                          |
| onClick           | Function     | null               | 点击回调                            |
| physicsEnabled    | Boolean      | false              | 是否启用物理                        |
| vx, vy            | Number       | 0                  | 初速度                              |
| ax, ay            | Number       | 0                  | 初加速度                            |
| mass              | Number       | 1                  | 质量                                |
| restitution       | Number       | 0.8                | 弹性系数                            |

#### 方法

```js
sprite.update(dt);     // 内部自动处理动画/物理/点击
sprite.draw();         // 绘制
sprite.collidesWith(o);// AABB 碰撞检测
```

### 3.4 PhysicsSystem 物理与碰撞

- **gravity**: 全局重力加速度（像素/s²）  
- **update(sprites, dt)**: 对 `sprites` 数组中启用物理的精灵执行重力积分及弹性碰撞响应

### 3.5 Scene 场景管理

```js
const scene = new Nano2D.Scene();
scene.add(sprite);
scene.remove(sprite);
scene.update(dt);
scene.draw();
```

### 3.6 Particle 简易粒子

```js
const p = new Nano2D.Particle(x,y,vx,vy,life,color);
p.update(dt);
p.draw();
```

### 3.7 AudioManager 音频管理

| 方法                       | 参数                                 | 返回         | 说明                       |
| -------------------------- | ------------------------------------ | ------------ | -------------------------- |
| play(src, {loop, volume})  | src:String, loop:Boolean, volume:Number | Audio 实例 | 播放音效，可循环、调节音量 |
| stop(audioInstance)        | audioInstance:Audio                 | —            | 停止播放并重置至开头       |

### 3.8 Network 网络请求

| 方法                    | 参数                     | 返回           | 说明                 |
| ----------------------- | ------------------------ | -------------- | -------------------- |
| fetchJSON(url, opts?)   | URL、fetch 配置         | Promise\<JSON> | GET JSON             |
| fetchText(url, opts?)   | URL、fetch 配置         | Promise\<Text> | GET 文本             |
| postJSON(url, data)     | URL、JS 对象            | Promise\<JSON> | POST JSON            |

### 3.9 Game 主循环

```js
Nano2D.Game.init(startCallback);
```

- 内部会：  
  1. 调用 Input.init()  
  2. 执行 `startCallback()`  
  3. 使用 `requestAnimationFrame` 驱动主循环  
- **loop(now)**：每帧完成  
  1. 计算 `dt`  
  2. 物理更新  
  3. 清屏、场景更新与渲染  
  4. Input.clear()

---

## 4. UI 模块（Canvas 原生控件）

| 控件          | 说明                                       |
| ------------- | ------------------------------------------ |
| Button        | 支持三种状态（idle/hover/down）的点击按钮  |
| Joystick      | 虚拟摇杆，输出归一化向量 `{x,y}`           |
| TextInput     | 文本输入框，支持聚焦、输入、删除与光标闪烁 |

### 4.1 Button

```js
new Nano2D.UI.Button({
  x, y, width, height,
  text, onClick,
  colorIdle, colorHover, colorDown
});
```

- **state**: `'idle' | 'hover' | 'down'`  
- update()/draw() 自动由场景管理

### 4.2 Joystick

```js
const joy = new Nano2D.UI.Joystick({
  x, y,
  radius, knobRadius
});
```

- **value**: `{ x: Number, y: Number }` ∈ [-1,1]  
- 鼠标/触摸拖拽控制

### 4.3 TextInput

```js
new Nano2D.UI.TextInput({
  x, y, width, height,
  placeholder, maxLength
});
```

- **text**: 当前输入内容  
- 支持 Backspace、左右箭头、数字/字母/空格输入  
- 光标闪烁效果

---

## 5. 使用示例

```html
<canvas id="nano2dCanvas"></canvas>
<script src="nano2d.js"></script>
<script>
  Nano2D.Game.init(() => {
    // 背景音乐
    Nano2D.AudioManager.play('bgm.mp3',{loop:true,volume:0.3});

    // 主角
    const hero = new Nano2D.Sprite({
      texture: 'hero.png',
      x:100, y:100,
      frames:['h1.png','h2.png','h3.png'],
      frameSpeed:0.2,
      onClick:()=>console.log('Hero clicked!')
    });
    Nano2D.Game.scene.add(hero);

    // UI 控件
    const btn = new Nano2D.UI.Button({
      x:20, y:20, width:100, height:40,
      text:'开始',
      onClick:()=>alert('游戏开始')
    });
    Nano2D.Game.scene.add(btn);

    const joy = new Nano2D.UI.Joystick({
      x:300, y:300, radius:60, knobRadius:25
    });
    Nano2D.Game.scene.add(joy);

    const input = new Nano2D.UI.TextInput({
      x:20, y:80, width:200, height:40,
      placeholder:'输入名称'
    });
    Nano2D.Game.scene.add(input);

    // 网络请求示例
    Nano2D.Network.fetchJSON('/api/data')
      .then(d=>console.log('服务器返回：', d));
  });
</script>
```

---

## 6. 高级扩展

- 集成第三方物理（Box2D.js、Planck.js）  
- 实现多人在线（WebSocket、WebRTC）  
- 自定义渲染管线与着色器  
- 动态资源热更新与场景切换  

欢迎根据项目需求自由扩展，Nano2D 设计通用且易于插拔。祝您开发愉快！
