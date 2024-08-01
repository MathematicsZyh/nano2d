var sprNum; var click_x; var click_y;
var sprArr = new Array();
var cv = document.getElementById("demo");
class sprite {
    constructor(name, texture, posx, posy, sprWidth, sprHeight) {
        this.name = name; this.texture = texture; this.posx = posx; this.posy = posy; this.sprWidth = sprWidth; this.sprHeight = sprHeight; this.hp = 100; this.isVisible = 1; this.isdead = 0;
    }
    function isCollidedWith(sprName) {
        var i = 0; var is = 0;
        while (i <= sprNum) {
            if (sprArr[i].name != sprName) {
                i += 1;
            } else if (((sprArr[i].posx+sprArr[i].width = this.posx) || (sprArr[i].posx-this.width = this.posx)) && ((sprArr[i].posy+sprArr[i].height = this.posy) || (sprArr[i].posy-this.height = this.posy))) {
                is = 1;
            }
        }
        return is;
    }
    function isTouchStart() {
        document.addEventListener('touchstart', function(event) {
            click_x = event.clientX,
            click_y = event.clientY;
        });
        if (((click_x >= this.posx) && (click_x <= this.posx+this.width)) || ((click_y >= this.posy) && (click_y <= this.posy+this.height))) {
            return 1;
        } else {
            return 0;
        }
    }
    function isTouchEnd() {
        document.addEventListener('touchend', function(event) {
            click_x = event.clientX,
            click_y = event.clientY;
        });
        if (((click_x >= this.posx) && (click_x <= this.posx+this.width)) || ((click_y >= this.posy) && (click_y <= this.posy+this.height))) {
            return 1;
        } else {
            return 0;
        }
    }
    function isTouchMove() {
        document.addEventListener('touchmove', function(event) {
            click_x = event.clientX,
            click_y = event.clientY;
        });
        if (((click_x >= this.posx) && (click_x <= this.posx+this.width)) || ((click_y >= this.posy) && (click_y <= this.posy+this.height))) {
            return 1;
        } else {
            return 0;
        }
    }
    function isMouseUp() {
        document.addEventListener('mouseup', function(event) {
            click_x = event.clientX,
            click_y = event.clientY;
        });
        if (((click_x >= this.posx) && (click_x <= this.posx+this.width)) || ((click_y >= this.posy) && (click_y <= this.posy+this.height))) {
            return 1;
        } else {
            return 0;
        }
    }
    function isMouseDown() {
        document.addEventListener('mousedown', function(event) {
            click_x = event.clientX,
            click_y = event.clientY;
        });
        if (((click_x >= this.posx) && (click_x <= this.posx+this.width)) || ((click_y >= this.posy) && (click_y <= this.posy+this.height))) {
            return 1;
        } else {
            return 0;
        }
    }
    function isMouseOver() {
        document.addEventListener('mouseover', function(event) {
            click_x = event.clientX,
            click_y = event.clientY;
        });
        if (((click_x >= this.posx) && (click_x <= this.posx+this.width)) || ((click_y >= this.posy) && (click_y <= this.posy+this.height))) {
            return 1;
        } else {
            return 0;
        }
    }
    function move(a, b) {
        var unit = a/b;
        while ((this.posx <= this.posx+a) && (this.posy <= this.posy+b)) {
            this.posx += unit; this.posy += 1;
        }
    }
    function goto(a, b) {
        var A = a-this.posx; var B = b-this.posy; move(A, B)}
}
function creat(name, texture, posx, posy, sprWidth, sprHeight) {
    let newspr = new sprite(name, texture, type, posx, posy, sprWidth, sprHeight);
    sprArr.push(newspr);
    sprNum += 1;
}
function delet(id) {
    sprNum[id] = null;
}
function show(id) {
    sprNum[id].isVisible = 1;
}
function hide(id) {
    sprNum[id].isVisible = 0;
}
function getKey() {
    document.addEventListener('keydown', function(event) {
        var x; if (window.event) {
            x = event.keyCode;
        } else if (event.which) {
            x = event.which;
        } var keychar = String.fromCharCode(x);
    });
    return keychar;
}
var timer = (function () {
    var counter = 0;
    return function () {
        return counter += 1;
    }
})();
function draw() {
    for (var i = 0; i < sprNum; i++) {
        if (cv.getContext) {
            ctx.restore();
            var ctx = cv.getContext("2d");

            ctx.drawImage(sprArr[i].texture, sprArr[i].posx, sprArr[i].posy);
            ctx.save();
            requestAnimationFrame(draw);
        }
    }

}
start();
window.setInterval("timer()", 1);
for (;;) {
    ctx.clearRect(0, 0, 4000, 4000);
    draw();
    update();
}