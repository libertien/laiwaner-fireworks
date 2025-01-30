// 引入 colorUtils.js 中的方法
import { generateRandomFireworkColor, hslToRgb, rgbAddAlpha } from './colorUtils.js';

const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 重力加速度，单位：m/s²
const g = 9.8;
// 阻力系数
const k = 0.5;
// 碎片数量
const particleCount = 25;
// 时间间隔
const dt = 0.1;
// 最小初速度
const minInitialSpeed = 120;
// 初速度随机增量
const initialSpeedIncrement = 20;
// 只显示最近的轨迹时间范围（毫秒）
const visibleDuration = 2000;
// 亮点持续时间（毫秒）
const highlightDuration = 1000;
// 存储所有碎片的轨迹信息
const particles = [];
// 获取显示时间的元素
const timeDisplay = document.getElementById('time-display');


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
    const hue = Math.round(Math.random() * 360)
    const randomHaloColorHsl = `hsl(${hue}, 100%, 60%)`
    const randomHighlightColorHsl = `hsl(${hue}, 100%, 80%)`
    const randomHaloColorRgb = hslToRgb(randomHaloColorHsl);
    const randomHighlightColorRgb = hslToRgb(randomHighlightColorHsl);
    

    // 生成每个碎片的初始速度
    for (let i = 0; i < particleCount; i++) {
        // 生成初始角度
        const angle = i * sectorAngle + (Math.random() * 2 - 1) * angleFluctuation;
        // 生成初速度
        const speed = minInitialSpeed + Math.random() * initialSpeedIncrement;
        const vx0 = speed * Math.cos(angle);
        const vy0 = speed * Math.sin(angle);

        const pathPoints = [];
        let t = 0;
        // 模拟一段时间内的轨迹
        while (t < 10) {
            const x = x0 + (vx0 / k) * (1 - Math.exp(-k * t));
            // 调整竖直方向的位移公式，因为 canvas 的 Y 轴方向与真实世界相反
            const y = y0 - (((vy0 * k + g) / (k * k)) * (1 - Math.exp(-k * t)) - (g / k) * t);
            pathPoints.push({ x, y, time: t0 + t * 1000 });
            t += dt;
        }

        particles.push({
            pathPoints,
            currentPointIndex: 0,
            startTime: t0,
            haloColor: randomHaloColorRgb,
            highlightColor: randomHighlightColorRgb
        });
    }

    // 开始动画
    if (!window.animationRunning) {
        window.animationRunning = true;
        animate();
    }
});

function drawHalo(x, y, themeColor, startTime) {
    ctx.save();
    ctx.filter = 'blur(3px)';

    const randomRadius = 25 ;
    // const elapsedTime = performance.now() - startTime;
    const radius = randomRadius + Math.sin(x / 100) * 2;

    const startOpacity = 0.4 + Math.random() * 0.2 + Math.sin(x / 100) * 0.1;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

    // 使用 rgbAddAlpha 方法生成颜色停止点
    gradient.addColorStop(0, rgbAddAlpha(themeColor, 1));
    gradient.addColorStop(0.3 , rgbAddAlpha(themeColor, startOpacity));
    gradient.addColorStop(0.6, rgbAddAlpha(themeColor, startOpacity * 0.3));
    gradient.addColorStop(1, rgbAddAlpha(themeColor, 0));

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore();
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const currentTime = performance.now();

    // 更新显示的当前时间
    timeDisplay.textContent = `Current Time: ${currentTime.toFixed(2)} ms`;

    // 遍历所有碎片
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        const { pathPoints, currentPointIndex, startTime, haloColor, highlightColor } = particle;

        if (currentPointIndex < pathPoints.length) {
            const currentPoint = pathPoints[currentPointIndex];

            // 绘制拖尾，动态调整透明度
            for (let j = 0; j < currentPointIndex; j++) {
                if (currentTime - pathPoints[j].time <= visibleDuration) {
                    const point = pathPoints[j];
                    const nextPoint = pathPoints[j + 1];
                    if (nextPoint && currentTime - nextPoint.time <= visibleDuration) {
                        const elapsedTime = currentTime - pathPoints[j].time;
                        const opacity = 0.8 * (1 - elapsedTime / (visibleDuration)); // 动态计算透明度

                        let color;
                        if (elapsedTime < highlightDuration) {
                            // 在亮点持续时间内，使用亮点颜色并逐渐变淡
                            const tailOpacity = 0.8 - elapsedTime / highlightDuration;
                            color = rgbAddAlpha(haloColor, tailOpacity)
                        } else {
                            // 超过亮点持续时间，使用拖尾颜色并逐渐变淡
                            color = `rgba(255, 255, 255, 0)`;
                        }

                        ctx.beginPath();
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 2;
                        ctx.moveTo(point.x, point.y);
                        ctx.lineTo(nextPoint.x, nextPoint.y);
                        ctx.stroke();
                    }
                }
            }

            // 绘制亮点和光晕
            if (currentTime - currentPoint.time < highlightDuration) {
                // 绘制光晕
                drawHalo(currentPoint.x, currentPoint.y, haloColor, startTime)


                // 绘制亮点
                ctx.beginPath();
                const highlightRadius = 3 + Math.random() * 1
                ctx.arc(currentPoint.x, currentPoint.y, highlightRadius, 0, 2 * Math.PI);
                ctx.fillStyle = highlightColor;
                ctx.fill();
            }

            particle.currentPointIndex++;
        }

        // 移除不再需要的粒子
        if (currentPointIndex >= pathPoints.length && currentTime - pathPoints[pathPoints.length - 1].time > visibleDuration) {
            particles.splice(i, 1);
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