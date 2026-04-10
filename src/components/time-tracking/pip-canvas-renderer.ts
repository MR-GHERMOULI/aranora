/**
 * Canvas renderer for the Standard PiP fallback (Tier 2).
 * Draws the timer UI onto a <canvas> which is then streamed to a <video>
 * element for use with the standard Picture-in-Picture API.
 * Used for Firefox/Safari which don't support Document PiP.
 */

export interface CanvasTimerData {
    projectName?: string;
    taskName?: string;
    description?: string;
    elapsedSeconds: number;
}

const PIP_WIDTH = 340;
const PIP_HEIGHT = 180;

function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s]
        .map((v) => (v < 10 ? "0" + v : String(v)))
        .filter((v, i) => v !== "00" || i > 0)
        .join(":");
}

/**
 * Renders the timer UI onto a canvas element.
 * Must be called every frame via requestAnimationFrame for live updates.
 */
export function renderTimerToCanvas(
    canvas: HTMLCanvasElement,
    data: CanvasTimerData
): void {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = 2; // Higher res for crisp text
    canvas.width = PIP_WIDTH * dpr;
    canvas.height = PIP_HEIGHT * dpr;
    canvas.style.width = `${PIP_WIDTH}px`;
    canvas.style.height = `${PIP_HEIGHT}px`;
    ctx.scale(dpr, dpr);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, PIP_WIDTH, PIP_HEIGHT);
    bgGrad.addColorStop(0, "#0f172a");
    bgGrad.addColorStop(1, "#1e293b");
    ctx.fillStyle = bgGrad;
    roundRect(ctx, 0, 0, PIP_WIDTH, PIP_HEIGHT, 0);
    ctx.fill();

    // Subtle radial glow (top-right amber)
    const glowGrad = ctx.createRadialGradient(
        PIP_WIDTH * 0.85, PIP_HEIGHT * 0.15, 0,
        PIP_WIDTH * 0.85, PIP_HEIGHT * 0.15, PIP_WIDTH * 0.5
    );
    glowGrad.addColorStop(0, "rgba(245, 158, 11, 0.06)");
    glowGrad.addColorStop(1, "transparent");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, PIP_WIDTH, PIP_HEIGHT);

    // Header — Brand
    ctx.font = "600 9px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "left";
    ctx.fillText("ARANORA", 16, 24);

    // Header — Recording indicator
    const now = Date.now();
    const pulseAlpha = 0.5 + 0.5 * Math.sin(now / 750 * Math.PI);

    ctx.beginPath();
    ctx.arc(PIP_WIDTH - 70, 20, 4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(245, 158, 11, ${pulseAlpha})`;
    ctx.fill();

    // Recording shadow glow
    ctx.beginPath();
    ctx.arc(PIP_WIDTH - 70, 20, 6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(245, 158, 11, ${pulseAlpha * 0.3})`;
    ctx.fill();

    ctx.font = "600 9px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = "#f59e0b";
    ctx.textAlign = "left";
    ctx.fillText("REC", PIP_WIDTH - 58, 24);

    // Timer display
    const timeStr = formatTime(data.elapsedSeconds);
    ctx.font = "700 40px 'Courier New', monospace";
    ctx.textAlign = "center";

    // Text gradient effect (simulated with solid white)
    ctx.fillStyle = "#f1f5f9";
    ctx.fillText(timeStr, PIP_WIDTH / 2, PIP_HEIGHT / 2 + 8);

    // Subtle text shadow
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "#000";
    ctx.fillText(timeStr, PIP_WIDTH / 2 + 1, PIP_HEIGHT / 2 + 9);
    ctx.globalAlpha = 1;

    // Info row
    const infoY = PIP_HEIGHT - 42;
    ctx.font = "500 11px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";

    let infoText = "";
    if (data.projectName && data.taskName) {
        infoText = `${data.projectName}  ·  ${data.taskName}`;
    } else if (data.projectName) {
        infoText = data.projectName;
    } else if (data.taskName) {
        infoText = data.taskName;
    } else if (data.description) {
        infoText = data.description;
    }

    if (infoText.length > 40) {
        infoText = infoText.substring(0, 37) + "...";
    }

    ctx.fillText(infoText, PIP_WIDTH / 2, infoY);

    // Stop hint at bottom
    ctx.font = "500 9px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = "#475569";
    ctx.textAlign = "center";
    ctx.fillText("Use media controls to stop", PIP_WIDTH / 2, PIP_HEIGHT - 14);
}

/**
 * Creates a canvas and video element pair for Standard PiP.
 * Returns the canvas, video, and control functions.
 */
export function createCanvasPiPElements() {
    const canvas = document.createElement("canvas");
    canvas.width = PIP_WIDTH * 2;
    canvas.height = PIP_HEIGHT * 2;
    canvas.style.position = "fixed";
    canvas.style.top = "-9999px";
    canvas.style.left = "-9999px";
    canvas.style.pointerEvents = "none";

    const video = document.createElement("video");
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.style.position = "fixed";
    video.style.top = "-9999px";
    video.style.left = "-9999px";
    video.style.width = `${PIP_WIDTH}px`;
    video.style.height = `${PIP_HEIGHT}px`;
    video.style.pointerEvents = "none";

    // Stream canvas to video
    const stream = canvas.captureStream(30);
    video.srcObject = stream;

    // Append to DOM (hidden)
    document.body.appendChild(canvas);
    document.body.appendChild(video);

    const cleanup = () => {
        stream.getTracks().forEach((t) => t.stop());
        canvas.remove();
        video.remove();
    };

    return { canvas, video, cleanup };
}

// Helper: draw rounded rectangle
function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}
