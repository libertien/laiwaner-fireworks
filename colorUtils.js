// 生成随机 HSL 颜色
function generateRandomFireworkColor() {
    const hue = Math.round(Math.random() * 360);
    return `hsl(${hue}, 100%, 60%)`;
}


// 将 HSL 颜色转换为 RGB 颜色
function hslToRgb(hsl) {
    const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!match) return null;
    let h = parseInt(match[1], 10) / 360;
    let s = parseInt(match[2], 10) / 100;
    let l = parseInt(match[3], 10) / 100;

    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

// 为RGB颜色增加指定的透明度
function rgbAddAlpha(rgb, opacity) {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        const b = parseInt(match[3], 10);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return `rgba(${r}, ${g}, ${b}, 1)`;
}

export { generateRandomFireworkColor, hslToRgb, rgbAddAlpha };