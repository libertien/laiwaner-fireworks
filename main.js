// 引入 colorUtils.js 中的方法
import { generateRandomFireworkColor, hslToRgb, rgbAddAlpha } from './colorUtils.js';

// 关键参数提取
// 重力加速度，单位：m/s²
const GRAVITY = 9.8;
// 阻力系数
const DRAG_COEFFICIENT = 0.2;
// 时间间隔（毫秒）
const TIME_INTERVAL = 100;
// 最小初速度
const MIN_INITIAL_SPEED = 80;
// 初速度随机增量
const INITIAL_SPEED_INCREMENT = 20;
// 轨迹计算时长（秒）
const PATH_CALCULATE_DURATION = 6;
// 圆球到平面的投影角度，默认0度为垂直于观看角度的平面
const DEFAULT_THETA = 0;
// 各种烟花模式对应的角度集
const THETA_SETS = { 1: [0], 2: [0], 3: [85, 75, 60, 45, 25, 0] };
// 各种烟花模式对应的彩球数量集
const PARTICLE_SETS = { 1: [20], 2: [60], 3: [30] };

// 轨迹延迟时长（毫秒）
const VISIBLE_DURATION = 2000;
// 亮点持续时长（毫秒）
const HIGHLIGHT_DURATION = 2 * TIME_INTERVAL;
// 拖尾淡出持续时长（毫秒）
const TRAIL_DURATION = 2000;
// 尾痕最大宽度
const MAX_TRAIL_WIDTH = 4;
// 尾痕最小宽度
const MIN_TRAIL_WIDTH = 1;
// 粒子释放最大距离
const MAX_PARTICLE_DISTANCE = 5;
// 粒子释放尝试次数
const PARTICLE_ATTEMPTS = 5;
// 整体淡出速度，在总时长末尾1/x的时间里匀速淡出
const FADE_OUT_SPEED = 5;

// 初始化画布
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
// 定义一个函数来调整 canvas 的大小
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// 页面加载时初始化 canvas 大小
resizeCanvas();

// 监听窗口大小变化事件
window.addEventListener('resize', resizeCanvas);

// 存储所有碎片的轨迹信息
const particles = [];
// 获取显示时间的元素
const timeDisplay = document.getElementById('time-display');
// 记录上一次渲染的时间
let lastRenderTime = 0;
// 获取模式选择的 radio 按钮组
const modeSelection = document.querySelectorAll('input[name="mode"]');
// 当前选择的模式
let currentMode = 1;
// 彩球数量
let particleCount = 20;
// 圆球到平面的投影角度
let theta = DEFAULT_THETA;

// 监听模式选择的变化
modeSelection.forEach(radio => {
    radio.addEventListener('change', () => {
        currentMode = parseInt(radio.value);
        particleCount = PARTICLE_SETS[currentMode];
        console.log(currentMode, particleCount);
    });
});

function generatePathPoints(x0, y0, t0, angle, theta) {
    // 生成初速度
    const speed = MIN_INITIAL_SPEED * Math.cos(theta) + Math.random() * INITIAL_SPEED_INCREMENT;
    const vx0 = speed * Math.cos(angle);
    const vy0 = speed * Math.sin(angle);

    const pathPoints = [];
    let t = 0;
    // 模拟一段时间内的轨迹
    while (t < PATH_CALCULATE_DURATION) {
        const x = x0 + (vx0 / DRAG_COEFFICIENT) * (1 - Math.exp(-DRAG_COEFFICIENT * t));
        // 调整竖直方向的位移公式，因为 canvas 的 Y 轴方向与真实世界相反
        const y = y0 - (((vy0 * DRAG_COEFFICIENT + GRAVITY) / (DRAG_COEFFICIENT * DRAG_COEFFICIENT)) * (1 - Math.exp(-DRAG_COEFFICIENT * t)) - (GRAVITY / DRAG_COEFFICIENT) * t);
        pathPoints.push({ x, y, time: t0 + t * 1000 });
        t += TIME_INTERVAL / 1000;
    }
    return pathPoints;
}

// 监听鼠标点击事件
canvas.addEventListener('click', function (event) {
    const rect = canvas.getBoundingClientRect();
    const x0 = event.clientX - rect.left;
    const y0 = event.clientY - rect.top;
    const t0 = performance.now(); // 记录当前时间（毫秒）

    // 计算每个扇区的角度
    const sectorAngle = (2 * Math.PI) / particleCount;
    // 角度随机波动范围为 1/2 扇区角度
    const angleFluctuation = sectorAngle / 2;

    // 生成本次点击的随机颜色
    const hue = Math.round(Math.random() * 360);
    const randomTrailColorHsl = `hsl(${hue + 30}, 100%, 60%)`;
    const randomHaloColorHsl = `hsl(${hue}, 100%, 60%)`;
    const randomHighlightColorHsl = `hsl(${hue}, 100%, 80%)`;
    const randomTrailColorRgb = hslToRgb(randomTrailColorHsl);
    const randomHaloColorRgb = hslToRgb(randomHaloColorHsl);
    const randomHighlightColorRgb = hslToRgb(randomHighlightColorHsl);

    // 基于投影角度，计算彩球路径
    let thetaIndex = 0;
    const thetaSet = THETA_SETS[currentMode];
    while (thetaIndex < thetaSet.length) {
        theta = Math.PI / 180 * thetaSet[thetaIndex];
        // 生成每个彩球的路径
        for (let i = 0; i < particleCount; i++) {
            // 生成平面上的发射方位角angle
            const angle = i * sectorAngle / Math.cos(theta) + (Math.random() * 2 - 1) * angleFluctuation * 2;

            particles.push({
                pathPoints: generatePathPoints(x0, y0, t0, angle, theta),
                currentPointIndex: 0,
                startTime: t0,
                trailColor: randomTrailColorRgb,
                haloColor: randomHaloColorRgb,
                highlightColor: randomHighlightColorRgb
            });
        }
        thetaIndex++;
    }

    // 开始动画
    if (!window.animationRunning) {
        window.animationRunning = true;
        animate();
    }
});

function drawHighlight(x, y, highlightColor, fadeOutOpacity) {
    ctx.beginPath();
    const highlightRadius = 3 + Math.random() * 1;
    ctx.arc(x, y, highlightRadius, 0, 2 * Math.PI);
    ctx.fillStyle = rgbAddAlpha(highlightColor, fadeOutOpacity);
    ctx.fill();
}

function drawHalo(x, y, themeColor, fadeOutOpacity) {
    ctx.save();
    ctx.filter = 'blur(3px)';

    const radius = 25 + Math.sin(x / 100) * 2;
    const startOpacity = 0.4 + Math.random() * 0.2 + Math.sin(x / 100) * 0.1;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

    // 使用 rgbAddAlpha 方法生成颜色停止点，渲染一个由内到外、从亮到暗的光晕
    gradient.addColorStop(0, rgbAddAlpha(themeColor, 1 * fadeOutOpacity));
    gradient.addColorStop(0.3, rgbAddAlpha(themeColor, startOpacity * fadeOutOpacity));
    gradient.addColorStop(0.6, rgbAddAlpha(themeColor, startOpacity * 0.3 * fadeOutOpacity));
    gradient.addColorStop(1, rgbAddAlpha(themeColor, 0));

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore();
}

function drawTrail(pathPoints, currentPointIndex, currentTime, trailColor, fadeOutOpacity) {
    for (let j = 0; j < currentPointIndex; j++) {
        if (currentTime - pathPoints[j].time <= VISIBLE_DURATION && currentTime <= pathPoints[pathPoints.length - 1].time) {
            const point = pathPoints[j];
            const nextPoint = pathPoints[j + 1];
            const elapsedTime = currentTime - pathPoints[j].time;

            let color;
            if (elapsedTime < VISIBLE_DURATION) {
                // 拖尾颜色逐渐变淡
                const trailOpacity = 0.8 - elapsedTime / VISIBLE_DURATION;
                color = rgbAddAlpha(trailColor, trailOpacity * fadeOutOpacity);
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.moveTo(point.x, point.y);
                ctx.lineTo(nextPoint.x, nextPoint.y);
                ctx.stroke();
            }
        }
    }
}

function drawTrailNew(trailPoints, currentTime, trailfadeOutDuration, themeColor, fadeOutOpacity) {
    for (let j = 0; j < trailPoints.length; j++) {
        const point = trailPoints[j];
        const nextPoint = trailPoints[j + 1];
        if (nextPoint) {
            const elapsedTime = currentTime - trailPoints[j].time;
            let trailColor;
            // 拖尾颜色逐渐变淡并变深
            const trailOpacity = 1 - elapsedTime / trailfadeOutDuration * 0.8; // 颜色变深因子
            trailColor = rgbAddAlpha(themeColor, trailOpacity - 1 + fadeOutOpacity);

            // 尾痕宽度逐渐变细
            const width = MAX_TRAIL_WIDTH - (MAX_TRAIL_WIDTH - MIN_TRAIL_WIDTH) * elapsedTime / trailfadeOutDuration;

            // 引入随机抖动
            const randomX1 = (Math.random() - 0.5) * 2;
            const randomY1 = (Math.random() - 0.5) * 2;
            const randomX2 = (Math.random() - 0.5) * 2;
            const randomY2 = (Math.random() - 0.5) * 2;

            ctx.beginPath();
            ctx.strokeStyle = trailColor;
            ctx.lineWidth = width;
            ctx.moveTo(point.x + randomX1, point.y + randomY1);
            ctx.lineTo(nextPoint.x + randomX2, nextPoint.y + randomY2);
            ctx.stroke();

            // 粒子释放效果
            for (let k = 0; k < PARTICLE_ATTEMPTS; k++) {
                // 在连线周围随机生成一个点
                const randomOffsetX = (Math.random() - 0.5) * 2 * MAX_PARTICLE_DISTANCE;
                const randomOffsetY = (Math.random() - 0.5) * 2 * MAX_PARTICLE_DISTANCE;
                const randomX = point.x + (nextPoint.x - point.x) * Math.random() + randomOffsetX;
                const randomY = point.y + (nextPoint.y - point.y) * Math.random() + randomOffsetY;

                // 计算随机点到连线的距离
                const distance = pointToLineDistance(randomX, randomY, point.x + randomX1, point.y + randomY1, nextPoint.x + randomX2, nextPoint.y + randomY2);

                // 根据距离计算出现概率，距离越近概率越大
                const probability = 1 - (distance / MAX_PARTICLE_DISTANCE);

                // 根据概率决定是否绘制粒子
                if (Math.random() < probability) {
                    ctx.fillStyle = `rgba(255, 195, 50, ${0.8 * fadeOutOpacity - 0.2})`; // 亮橙色
                    ctx.beginPath();
                    ctx.arc(randomX, randomY, 1, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        }
    }
}

// 辅助函数：计算点到直线的距离
function pointToLineDistance(x0, y0, x1, y1, x2, y2) {
    const numerator = Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1);
    const denominator = Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);
    return numerator / denominator;
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const currentTime = performance.now();
    const elapsedTime = currentTime - lastRenderTime;

    let shouldRender = false;
    if (currentMode === 1 || currentMode === 3) {
        // 模式 1：不按 dt 帧率渲染，最快速度遍历所有点
        // 取决于电脑性能，实现快速放烟花

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        lastRenderTime = currentTime;

        // 更新显示的当前时间
        timeDisplay.textContent = `Current Time: ${currentTime.toFixed(2)} ms`;

        // 遍历所有彩球
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            const { pathPoints, currentPointIndex, startTime, trailColor, haloColor, highlightColor } = particle;
            // 计算全局透明度，实现整体淡出
            const fadeOutOpacity = Math.min(1, (1 - currentPointIndex / pathPoints.length) * FADE_OUT_SPEED);

            if (currentPointIndex < pathPoints.length) {
                const currentPoint = pathPoints[currentPointIndex];
                // 绘制拖尾
                drawTrail(pathPoints, currentPointIndex, currentTime, trailColor, fadeOutOpacity);
                // 绘制光晕
                drawHalo(currentPoint.x, currentPoint.y, haloColor, fadeOutOpacity);
                // 绘制亮点（最后绘制，图层靠前）
                drawHighlight(currentPoint.x, currentPoint.y, highlightColor, fadeOutOpacity);

                particle.currentPointIndex++;
            }

            // 移除不再需要的粒子
            if (currentPointIndex >= pathPoints.length && currentTime - pathPoints[pathPoints.length - 1].time > VISIBLE_DURATION) {
                particles.splice(i, 1);
            }
        }
    } else if (currentMode === 2) {
        // 模式 2：按指定帧率渲染画面，基于之前计算的坐标和时间，点亮对应位置的像素点，展示彩球
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        lastRenderTime = currentTime;

        // 更新显示的当前时间
        timeDisplay.textContent = `Current Time: ${currentTime.toFixed(2)} ms`;

        // 遍历所有彩球
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            const { pathPoints, currentPointIndex, startTime, trailColor, haloColor, highlightColor } = particle;
            // 计算全局透明度，实现整体淡出
            const fadeOutOpacity = Math.min(1, (1 - currentPointIndex / pathPoints.length) * FADE_OUT_SPEED);

            // 计算需要渲染的尾迹坐标的索引范围
            const expectedTrailIndexBegin = Math.max(0, Math.floor((currentTime - HIGHLIGHT_DURATION - TRAIL_DURATION - startTime) / TIME_INTERVAL));
            const expectedTrailIndexEnd = Math.max(0, Math.floor((currentTime - startTime) / TIME_INTERVAL));
            const trailPoints = pathPoints.slice(expectedTrailIndexBegin, expectedTrailIndexEnd);

            // 计算需要渲染的光点坐标的索引范围
            const expectedPointIndexBegin = Math.max(0, Math.floor((currentTime - HIGHLIGHT_DURATION - startTime) / TIME_INTERVAL));
            const expectedPointIndexEnd = Math.floor((currentTime - startTime) / TIME_INTERVAL);

            // 遍历已渲染到当前时间点之前的轨迹点，持续绘制
            for (let j = expectedPointIndexBegin; j < Math.min(expectedPointIndexEnd, pathPoints.length); j++) {
                const point = pathPoints[j];
                if (currentTime - point.time <= HIGHLIGHT_DURATION) {
                    drawTrailNew(trailPoints, currentTime, TRAIL_DURATION, trailColor, fadeOutOpacity);
                    drawHalo(point.x, point.y, haloColor, fadeOutOpacity);
                    drawHighlight(point.x, point.y, highlightColor, fadeOutOpacity);
                }
            }

            // 更新当前坐标点索引
            if (currentPointIndex < expectedPointIndexEnd && currentPointIndex < pathPoints.length) {
                particle.currentPointIndex++;
            }

            // 移除不再需要的粒子
            if (currentPointIndex >= pathPoints.length && currentTime - pathPoints[pathPoints.length - 1].time > VISIBLE_DURATION) {
                particles.splice(i, 1);
            }
        }
    }

    // 如果还有粒子需要处理，继续动画循环
    if (particles.length > 0) {
        requestAnimationFrame(animate);
    } else {
        window.animationRunning = false;
    }
}
// // ——————————————白色圆点——————————————

// // 定义关键时间变量
// const FADE_IN_TIME = 500; // 0 - 0.5 秒，单位：毫秒
// const BRIGHT_TIME = 2500; // 0.5 秒 - 3 秒，单位：毫秒
// const FADE_OUT_TIME = 2000; // 3 秒 - 5 秒，单位：毫秒
// const TOTAL_TIME = FADE_IN_TIME + BRIGHT_TIME + FADE_OUT_TIME; // 总时间 5 秒

// // 监听页面的点击事件
// document.addEventListener('click', function (event) {
//     // 创建一个新的圆形元素
//     const circle = document.createElement('div');
//     circle.classList.add('circle');

//     // 设置圆形的初始透明度为 0
//     circle.style.opacity = 0;

//     // 设置圆形的位置为点击位置
//     circle.style.left = event.clientX - 10 + 'px';
//     circle.style.top = event.clientY - 10 + 'px';

//     // 将圆形元素添加到页面中
//     document.body.appendChild(circle);

//     // 0 - 0.5 秒内逐渐变亮
//     const fadeInInterval = setInterval(() => {
//         const elapsed = Date.now() - startTime;
//         if (elapsed >= FADE_IN_TIME) {
//             circle.style.opacity = 1;
//             clearInterval(fadeInInterval);
//             // 0.5 秒 - 3 秒内保持最亮
//             setTimeout(() => {
//                 // 3 秒 - 5 秒内逐渐变暗
//                 const fadeOutInterval = setInterval(() => {
//                     const elapsedSinceBright = Date.now() - (startTime + FADE_IN_TIME + BRIGHT_TIME);
//                     if (elapsedSinceBright >= FADE_OUT_TIME) {
//                         circle.style.opacity = 0;
//                         clearInterval(fadeOutInterval);
//                         // 5 秒后移除圆形元素
//                         if (circle.parentNode) {
//                             circle.parentNode.removeChild(circle);
//                         }
//                     } else {
//                         circle.style.opacity = 1 - (elapsedSinceBright / FADE_OUT_TIME);
//                     }
//                 }, 10);
//             }, BRIGHT_TIME);
//         } else {
//             circle.style.opacity = elapsed / FADE_IN_TIME;
//         }
//     }, 10);

//     const startTime = Date.now();
// });