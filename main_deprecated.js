

// ——————————————白色圆点——————————————

// 定义关键时间变量
const FADE_IN_TIME = 500; // 0 - 0.5 秒，单位：毫秒
const BRIGHT_TIME = 2500; // 0.5 秒 - 3 秒，单位：毫秒
const FADE_OUT_TIME = 2000; // 3 秒 - 5 秒，单位：毫秒
const TOTAL_TIME = FADE_IN_TIME + BRIGHT_TIME + FADE_OUT_TIME; // 总时间 5 秒

// 监听页面的点击事件
document.addEventListener('click', function (event) {
    // 创建一个新的圆形元素
    const circle = document.createElement('div');
    circle.classList.add('circle');

    // 设置圆形的初始透明度为 0
    circle.style.opacity = 0;

    // 设置圆形的位置为点击位置
    circle.style.left = event.clientX - 10 + 'px';
    circle.style.top = event.clientY - 10 + 'px';

    // 将圆形元素添加到页面中
    document.body.appendChild(circle);

    // 0 - 0.5 秒内逐渐变亮
    const fadeInInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= FADE_IN_TIME) {
            circle.style.opacity = 1;
            clearInterval(fadeInInterval);
            // 0.5 秒 - 3 秒内保持最亮
            setTimeout(() => {
                // 3 秒 - 5 秒内逐渐变暗
                const fadeOutInterval = setInterval(() => {
                    const elapsedSinceBright = Date.now() - (startTime + FADE_IN_TIME + BRIGHT_TIME);
                    if (elapsedSinceBright >= FADE_OUT_TIME) {
                        circle.style.opacity = 0;
                        clearInterval(fadeOutInterval);
                        // 5 秒后移除圆形元素
                        if (circle.parentNode) {
                            circle.parentNode.removeChild(circle);
                        }
                    } else {
                        circle.style.opacity = 1 - (elapsedSinceBright / FADE_OUT_TIME);
                    }
                }, 10);
            }, BRIGHT_TIME);
        } else {
            circle.style.opacity = elapsed / FADE_IN_TIME;
        }
    }, 10);

    const startTime = Date.now();
});



// ——————————————全屏窗口——————————————
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');


// 初始化 canvas 大小
function setCanvasSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// 调用初始化函数
setCanvasSize();

// 监听窗口大小变化事件
window.addEventListener('resize', setCanvasSize);



// ——————————————贝塞尔曲线——————————————


// 存储鼠标点击的关键点
const points = [];
// 存储每一组 4 个点用于绘制曲线
const curveSets = [];

// 初始化 canvas 大小
function setCanvasSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// 调用初始化函数
setCanvasSize();

// 监听窗口大小变化事件
window.addEventListener('resize', setCanvasSize);

// 监听鼠标点击事件
canvas.addEventListener('click', function (event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 添加点击的点到关键点数组
    points.push({ x, y });

    // 如果有足够的点（至少 4 个），则复制 4 个点并开始绘制贝塞尔曲线动画
    if (points.length >= 4) {
        const currentSet = points.slice(points.length - 4);
        curveSets.push(currentSet);
        drawAnimatedBezierCurve(currentSet);
        points.splice(points.length - 4, 4)
    }
});

// 生成贝塞尔曲线上的所有点
function getBezierPoints(pointsSet) {
    const bezierPoints = [];
    const p0 = pointsSet[0];
    const p1 = pointsSet[1];
    const p2 = pointsSet[2];
    const p3 = pointsSet[3];

    const steps = 20; // 每个曲线段的步数
    for (let t = 0; t <= steps; t++) {
        const u = t / steps;
        const u2 = u * u;
        const u3 = u2 * u;
        const mu = 1 - u;
        const mu2 = mu * mu;
        const mu3 = mu2 * mu;

        const x = mu3 * p0.x + 3 * mu2 * u * p1.x + 3 * mu * u2 * p2.x + u3 * p3.x;
        const y = mu3 * p0.y + 3 * mu2 * u * p1.y + 3 * mu * u2 * p2.y + u3 * p3.y;

        bezierPoints.push({ x, y });
    }
    return bezierPoints;
}

// 绘制动画贝塞尔曲线
function drawAnimatedBezierCurve(pointsSet) {
    const bezierPoints = getBezierPoints(pointsSet);
    let currentPoint = 0;
    let fadeOut = false;
    let opacity = 0;

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 绘制所有曲线
        curveSets.forEach(set => {
            const points = getBezierPoints(set);
            let currentOpacity = 1;
            let isFadingOut = false;
            if (set === pointsSet) {
                currentOpacity = opacity;
                isFadingOut = fadeOut;
            }
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${currentOpacity})`;
            ctx.lineWidth = 2;
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();
        });

        if (!fadeOut) {
            if (currentPoint < bezierPoints.length) {
                currentPoint++;
                opacity = Math.min(1, currentPoint / bezierPoints.length);
            } else {
                fadeOut = true;
            }
        } else {
            if (opacity > 0) {
                opacity -= 0.02;
            } else {
                // 当曲线完全消失后，从 curveSets 中移除该组点
                const index = curveSets.indexOf(pointsSet);
                if (index > -1) {
                    curveSets.splice(index, 1);
                }
                return;
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
}