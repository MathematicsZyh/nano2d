  (function(){
    //—— Canvas 与 Context 初始化 ——
    const canvas = document.getElementById('nano2dCanvas');
    const ctx    = canvas.getContext('2d');
    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    //—— 资源管理器 ——
    const Resource = {
      images: {}, audios: {},
      loadImage(src) {
        if (!this.images[src]) {
          const img = new Image();
          img.src = src;
          this.images[src] = img;
        }
        return this.images[src];
      },
      loadAudio(src) {
        if (!this.audios[src]) {
          const a = new Audio(src);
          a.preload = 'auto';
          this.audios[src] = a;
        }
        // 返回可独立控制的实例
        return this.audios[src].cloneNode();
      }
    };

    //—— 全局输入管理 ——
    const Input = {
      keys: {}, mouse:{ x:0,y:0,down:false,up:false,click:false }, touches:{},
      init() {
        window.addEventListener('keydown', e => this.keys[e.code] = true);
        window.addEventListener('keyup',   e => this.keys[e.code] = false);

        canvas.addEventListener('mousedown', e => {
          this.mouse.down = true;
          this.mouse.x = e.offsetX; this.mouse.y = e.offsetY;
        });
        canvas.addEventListener('mouseup', e => {
          this.mouse.up    = true;
          this.mouse.down  = false;
          this.mouse.x     = e.offsetX;
          this.mouse.y     = e.offsetY;
          this.mouse.click = true;
        });
        canvas.addEventListener('mousemove', e => {
          this.mouse.x = e.offsetX; this.mouse.y = e.offsetY;
        });

        canvas.addEventListener('touchstart', e => {
          const t = e.touches[0];
          this.touches.start = { x:t.clientX, y:t.clientY };
          e.preventDefault();
        }, {passive:false});
        canvas.addEventListener('touchend', e => {
          this.touches.end = true;
          e.preventDefault();
        }, {passive:false});
      },
      clear() {
        this.mouse.click = false;
        this.mouse.up    = false;
        this.touches.end = false;
      }
    };

    //—— 精灵类（支持动画、物理、交互） ——
    class Sprite {
      constructor(opts) {
        this.name     = opts.name     || '';
        this.texture  = Resource.loadImage(opts.texture);
        this.x        = opts.x        || 0;
        this.y        = opts.y        || 0;
        this.width    = opts.width    || this.texture.width;
        this.height   = opts.height   || this.texture.height;
        this.visible  = opts.visible  !== false;
        this.rotation = opts.rotation || 0;
        this.scaleX   = opts.scaleX   || 1;
        this.scaleY   = opts.scaleY   || 1;
        this.alpha    = opts.alpha    || 1;
        // 帧动画
        this.frames       = opts.frames     || null;
        this.frameSpeed   = opts.frameSpeed || 0;
        this.currentFrame = 0;
        this._frameTimer  = 0;
        // 点击回调
        this.onClick = opts.onClick || null;
        // 物理属性
        this.physicsEnabled = opts.physicsEnabled || false;
        this.vx = opts.vx || 0;
        this.vy = opts.vy || 0;
        this.ax = opts.ax || 0;
        this.ay = opts.ay || 0;
        this.mass        = opts.mass        || 1;
        this.restitution = opts.restitution || 0.8;
      }
      update(dt) {
        // 物理积分
        if (this.physicsEnabled) {
          this.vx += this.ax * dt;
          this.vy += (this.ay + PhysicsSystem.gravity) * dt;
          this.x  += this.vx * dt;
          this.y  += this.vy * dt;
        }
        // 帧动画
        if (this.frames) {
          this._frameTimer += dt;
          if (this._frameTimer >= this.frameSpeed) {
            this.currentFrame = (this.currentFrame + 1) % this.frames.length;
            this.texture = Resource.loadImage(this.frames[this.currentFrame]);
            this._frameTimer = 0;
          }
        }
        // 点击检测
        if (this.onClick && Input.mouse.click) {
          if (Input.mouse.x >= this.x && Input.mouse.x <= this.x + this.width &&
              Input.mouse.y >= this.y && Input.mouse.y <= this.y + this.height) {
            this.onClick();
          }
        }
      }
      draw() {
        if (!this.visible) return;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.rotation);
        ctx.scale(this.scaleX, this.scaleY);
        ctx.drawImage(this.texture,
                      -this.width/2, -this.height/2,
                      this.width, this.height);
        ctx.restore();
      }
      collidesWith(o) {
        return this.x < o.x + o.width &&
               this.x + this.width > o.x &&
               this.y < o.y + o.height &&
               this.y + this.height > o.y;
      }
    }

    //—— 碰撞与物理系统 ——
    const PhysicsSystem = {
      gravity: 600,
      update(sprites, dt) {
        const bodies = sprites.filter(s => s.physicsEnabled);
        for (let i = 0; i < bodies.length; i++) {
          for (let j = i + 1; j < bodies.length; j++) {
            const A = bodies[i], B = bodies[j];
            if (A.collidesWith(B)) {
              const nx = (B.x+B.width/2)-(A.x+A.width/2),
                    ny = (B.y+B.height/2)-(A.y+A.height/2);
              const dist = Math.hypot(nx,ny)||1;
              const ux = nx/dist, uy = ny/dist;
              const va = A.vx*ux + A.vy*uy;
              const vb = B.vx*ux + B.vy*uy;
              const e  = Math.min(A.restitution,B.restitution);
              const jn = (-(1+e)*(va-vb))/(1/A.mass+1/B.mass);
              A.vx += (jn*ux)/A.mass;
              A.vy += (jn*uy)/A.mass;
              B.vx -= (jn*ux)/B.mass;
              B.vy -= (jn*uy)/B.mass;
            }
          }
        }
      }
    };

    //—— 场景管理 ——
    class Scene {
      constructor(){ this.sprites=[]; }
      add(s){ this.sprites.push(s); }
      remove(s){ this.sprites=this.sprites.filter(x=>x!==s); }
      update(dt){ this.sprites.forEach(s=>s.update(dt)); }
      draw()  { this.sprites.forEach(s=>s.draw());  }
    }

    //—— 简易粒子 ——
    class Particle {
      constructor(x,y,vx,vy,life,color){
        this.x=x; this.y=y; this.vx=vx; this.vy=vy;
        this.life=life; this.age=0; this.color=color;
      }
      update(dt){
        this.age+=dt;
        this.x+=this.vx*dt;
        this.y+=this.vy*dt;
      }
      draw(){
        if(this.age>this.life) return;
        ctx.save();
        ctx.globalAlpha = 1-this.age/this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x,this.y,2,2);
        ctx.restore();
      }
    }

    //—— 音频管理 ——
    const AudioManager = {
      play(src, opts={loop:false,volume:1}){
        const a = Resource.loadAudio(src);
        a.loop   = !!opts.loop;
        a.volume = opts.volume;
        a.play();
        return a;
      },
      stop(a){
        a.pause();
        a.currentTime = 0;
      }
    };

    //—— 网络请求 ——
    const Network = {
      fetchJSON(url,opts){ return fetch(url,opts).then(r=>r.json()); },
      fetchText(url,opts){ return fetch(url,opts).then(r=>r.text()); },
      postJSON(url,data){
        return fetch(url,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify(data)
        }).then(r=>r.json());
      }
    };

    //—— 主控制器 ——
    const Game = {
      scene: new Scene(), lastTime:0, fps:0,
      init(startCb){
        Input.init();
        this.lastTime = performance.now();
        startCb();
        requestAnimationFrame(this.loop.bind(this));
      },
      loop(now){
        const dt = (now-this.lastTime)/1000;
        this.lastTime = now;
        this.fps      = 1/dt;
        PhysicsSystem.update(this.scene.sprites, dt);
        ctx.clearRect(0,0,canvas.width,canvas.height);
        this.scene.update(dt);
        this.scene.draw();
        Input.clear();
        requestAnimationFrame(this.loop.bind(this));
      }
    };

    //—— UI 模块扩展 ——
    const UI = {};
    class UIControl {
      constructor(o){ Object.assign(this,o); this.visible = o.visible!==false; }
      update(dt){}; draw(ctx){}
      contains(px,py){
        return px>=this.x && px<=this.x+this.width &&
               py>=this.y && py<=this.y+this.height;
      }
    }
    class Button extends UIControl {
      constructor(o){ super(o);
        this.text=o.text||'Button';
        this.onClick=o.onClick||(()=>{});
        this.colorIdle=o.colorIdle||'#444';
        this.colorHover=o.colorHover||'#666';
        this.colorDown=o.colorDown||'#222';
        this.state='idle';
      }
      update(){
        const M=Input.mouse;
        if(!this.visible) return;
        if(M.click && this.contains(M.x,M.y)){
          this.state='down'; this.onClick();
        }
        else if(M.down && this.contains(M.x,M.y)){
          this.state='down';
        }
        else if(this.contains(M.x,M.y)){
          this.state='hover';
        }
        else this.state='idle';
      }
      draw(){
        if(!this.visible) return;
        let c=this.colorIdle;
        if(this.state==='hover') c=this.colorHover;
        if(this.state==='down')  c=this.colorDown;
        ctx.save();
        ctx.fillStyle=c;
        ctx.fillRect(this.x,this.y,this.width,this.height);
        ctx.fillStyle='#fff';
        ctx.font=`${Math.floor(this.height*0.5)}px sans-serif`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(this.text,
          this.x+this.width/2,
          this.y+this.height/2);
        ctx.restore();
      }
    }
    class Joystick extends UIControl {
      constructor(o){ super(o);
        this.radius=o.radius||50;
        this.knobRadius=o.knobRadius||20;
        this.pointerId=null;
        this.knobX=this.x+this.radius;
        this.knobY=this.y+this.radius;
        this.value={x:0,y:0};
      }
      update(){
        const M=Input.mouse;
        if(M.down && this.contains(M.x,M.y)) this.pointerId='mouse';
        if(M.up && this.pointerId==='mouse'){
          this.pointerId=null;
          this.knobX=this.x+this.radius;
          this.knobY=this.y+this.radius;
          this.value={x:0,y:0};
        }
        if(this.pointerId==='mouse' && M.down){
          const dx=M.x-(this.x+this.radius),
                dy=M.y-(this.y+this.radius),
                dist=Math.hypot(dx,dy),
                maxd=this.radius-this.knobRadius,
                r=Math.min(dist,maxd)/(dist||1);
          this.knobX=this.x+this.radius+dx*r;
          this.knobY=this.y+this.radius+dy*r;
          this.value={ x:(this.knobX-(this.x+this.radius))/maxd,
                       y:(this.knobY-(this.y+this.radius))/maxd };
        }
      }
      draw(){
        if(!this.visible) return;
        const cx=this.x+this.radius, cy=this.y+this.radius;
        ctx.save();
        ctx.globalAlpha=0.4;
        ctx.fillStyle='#888';
        ctx.beginPath();
        ctx.arc(cx,cy,this.radius,0,2*Math.PI);
        ctx.fill();
        ctx.globalAlpha=0.8;
        ctx.fillStyle='#ccc';
        ctx.beginPath();
        ctx.arc(this.knobX,this.knobY,this.knobRadius,0,2*Math.PI);
        ctx.fill();
        ctx.restore();
      }
    }
    class TextInput extends UIControl {
      constructor(o){ super(o);
        this.text=''; this.placeholder=o.placeholder||'';
        this.maxLength=o.maxLength||20;
        this.focused=false; this.cursorPos=0;
        this.blinkTimer=0; this.showCursor=true;
      }
      update(dt){
        const M=Input.mouse;
        if(M.click){
          this.focused = this.contains(M.x,M.y);
        }
        if(this.focused){
          for(let code in Input.keys){
            if(Input.keys[code] && !Input._handled[code]){
              Input._handled[code]=true;
              if(code==='Backspace'){
                if(this.cursorPos>0){
                  this.text=this.text.slice(0,this.cursorPos-1)
                           +this.text.slice(this.cursorPos);
                  this.cursorPos--;
                }
              }
              else if(code==='ArrowLeft'){
                this.cursorPos=Math.max(0,this.cursorPos-1);
              }
              else if(code==='ArrowRight'){
                this.cursorPos=Math.min(this.text.length,this.cursorPos+1);
              }
              else if(code.startsWith('Key')||code.startsWith('Digit')||code==='Space'){
                if(this.text.length<this.maxLength){
                  let ch=code==='Space'?' ':code.replace('Key','');
                  this.text=this.text.slice(0,this.cursorPos)
                           + ch + this.text.slice(this.cursorPos);
                  this.cursorPos++;
                }
              }
            }
          }
        }
        if(this.focused){
          this.blinkTimer+=dt;
          if(this.blinkTimer>0.5){
            this.showCursor = !this.showCursor;
            this.blinkTimer = 0;
          }
        } else {
          this.showCursor=false;
        }
      }
      draw(){
        if(!this.visible) return;
        ctx.save();
        ctx.fillStyle='#222';
        ctx.fillRect(this.x,this.y,this.width,this.height);
        ctx.strokeStyle=this.focused?'#0f0':'#555';
        ctx.lineWidth=2;
        ctx.strokeRect(this.x,this.y,this.width,this.height);
        ctx.fillStyle='#fff';
        ctx.font=`${Math.floor(this.height*0.6)}px sans-serif`;
        ctx.textBaseline='middle';
        const ty=this.y+this.height/2;
        const disp=this.text||this.placeholder;
        ctx.fillText(disp,this.x+5,ty);
        if(this.focused && this.showCursor){
          const txt=this.text.slice(0,this.cursorPos);
          const w=ctx.measureText(txt).width;
          const cx=this.x+5+w;
          ctx.beginPath();
          ctx.moveTo(cx,this.y+5);
          ctx.lineTo(cx,this.y+this.height-5);
          ctx.strokeStyle='#fff';
          ctx.lineWidth=1;
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    Input._handled = {};
    window.addEventListener('keyup', e => { Input._handled[e.code]=false; });

    //—— 将所有模块暴露到全局 Nano2D ——
    window.Nano2D = {
      Resource, Input, Sprite, PhysicsSystem,
      Scene, Particle, AudioManager, Network,
      Game, UI: { Button, Joystick, TextInput }
    };
  })();