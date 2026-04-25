/**
 * Builds the HTML content for the Document Picture-in-Picture window (Tier 1).
 * This creates a self-contained HTML document with inline styles that matches
 * the Aranora platform's design language.
 */

export interface PiPDocumentData {
    projectName?: string;
    taskName?: string;
    description?: string;
    elapsedSeconds: number;
    logoUrl?: string;
}

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
 * Builds and injects the timer UI into a Document PiP window.
 * Returns cleanup/update functions.
 */
export function buildPiPDocument(
    pipWindow: Window,
    data: PiPDocumentData,
    onStop: () => void
) {
    const doc = pipWindow.document;

    // Write the base document
    doc.open();
    doc.write(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aranora Timer</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #0f172a;
            color: #f8fafc;
            overflow: hidden;
            user-select: none;
            -webkit-user-select: none;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .pip-container {
            width: 100%;
            height: 100%;
            padding: 16px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            position: relative;
        }

        .pip-container::before {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(ellipse at top right, rgba(245, 158, 11, 0.08) 0%, transparent 60%);
            pointer-events: none;
        }

        /* Header row */
        .pip-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            z-index: 1;
        }

        .pip-brand {
            display: flex;
            align-items: center;
            gap: 6px;
            opacity: 0.6;
        }

        .pip-brand svg, .pip-brand img {
            width: 14px;
            height: 14px;
            color: #4ade80;
            object-fit: contain;
            border-radius: 2px;
        }

        .pip-brand span {
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: #94a3b8;
        }

        .pip-recording {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .pip-recording-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #f59e0b;
            animation: pulse-dot 1.5s ease-in-out infinite;
            box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
        }

        .pip-recording-label {
            font-size: 10px;
            font-weight: 600;
            color: #f59e0b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        @keyframes pulse-dot {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.85); }
        }

        /* Timer display */
        .pip-timer-section {
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1;
            position: relative;
            z-index: 1;
        }

        .pip-time {
            font-family: 'JetBrains Mono', monospace;
            font-size: 42px;
            font-weight: 700;
            letter-spacing: 2px;
            background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: none;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }

        /* Info row */
        .pip-info {
            display: flex;
            align-items: center;
            gap: 8px;
            overflow: hidden;
            position: relative;
            z-index: 1;
            min-height: 18px;
        }

        .pip-info-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            color: #94a3b8;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .pip-info-item svg {
            width: 12px;
            height: 12px;
            flex-shrink: 0;
            color: #64748b;
        }

        .pip-info-divider {
            width: 1px;
            height: 12px;
            background: #334155;
            flex-shrink: 0;
        }

        /* Footer with controls */
        .pip-footer {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding-top: 8px;
            position: relative;
            z-index: 1;
        }

        .pip-stop-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: #fff;
            border: none;
            border-radius: 10px;
            padding: 8px 20px;
            font-size: 12px;
            font-weight: 600;
            font-family: 'Inter', sans-serif;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }

        .pip-stop-btn:hover {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);
        }

        .pip-stop-btn:active {
            transform: translateY(0);
            box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
        }

        .pip-stop-btn svg {
            width: 14px;
            height: 14px;
        }

        /* Drag handle area (top of window) */
        .pip-drag-hint {
            position: absolute;
            top: 6px;
            left: 50%;
            transform: translateX(-50%);
            width: 32px;
            height: 3px;
            border-radius: 99px;
            background: #334155;
            opacity: 0.6;
        }

        /* Entrance animation */
        @keyframes fade-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }

        .pip-container {
            animation: fade-in 0.3s ease-out;
        }
    </style>
</head>
<body>
    <div class="pip-container">
        <div class="pip-drag-hint"></div>
        
        <div class="pip-header">
            <div class="pip-brand">
                ${data.logoUrl 
                    ? `<img src="${escapeHtml(data.logoUrl)}" alt="Logo" />`
                    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                       </svg>`
                }
                <span>Aranora</span>
            </div>
            <div class="pip-recording">
                <div class="pip-recording-dot"></div>
                <span class="pip-recording-label">Recording</span>
            </div>
        </div>

        <div class="pip-timer-section">
            <div class="pip-time" id="pip-time">${formatTime(data.elapsedSeconds)}</div>
        </div>

        <div class="pip-info" id="pip-info">
            ${data.projectName ? `
                <div class="pip-info-item">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                        <rect width="20" height="14" x="2" y="6" rx="2"/>
                    </svg>
                    <span>${escapeHtml(data.projectName)}</span>
                </div>
            ` : ''}
            ${data.projectName && data.taskName ? '<div class="pip-info-divider"></div>' : ''}
            ${data.taskName ? `
                <div class="pip-info-item">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="5" width="6" height="6" rx="1"/><path d="m3 17 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>
                    </svg>
                    <span>${escapeHtml(data.taskName)}</span>
                </div>
            ` : ''}
            ${!data.projectName && !data.taskName && data.description ? `
                <div class="pip-info-item">
                    <span>${escapeHtml(data.description)}</span>
                </div>
            ` : ''}
        </div>

        <div class="pip-footer">
            <button class="pip-stop-btn" id="pip-stop-btn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <rect x="6" y="6" width="12" height="12" rx="1"/>
                </svg>
                Stop Timer
            </button>
        </div>
    </div>
</body>
</html>
    `);
    doc.close();

    // Attach stop button handler
    const stopBtn = doc.getElementById("pip-stop-btn");
    if (stopBtn) {
        stopBtn.addEventListener("click", () => {
            onStop();
        });
    }

    // Return an update function for the elapsed time
    const timeEl = doc.getElementById("pip-time");
    const updateTime = (seconds: number) => {
        if (timeEl) {
            timeEl.textContent = formatTime(seconds);
        }
    };

    return { updateTime };
}

function escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
