const SUPABASE_URL = "https://vrranmkhmaycnhxnsgnn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_kGGyyLx8B5E2n9KxQT4V-Q_5VdhiPc1";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function formatSize(bytes) {
  if (bytes === 0 || bytes == null) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const statusText = document.getElementById("status");
const fileSelected = document.getElementById("fileSelected");
const dropZone = document.getElementById("dropZone");
const progressWrap = document.getElementById("progressWrap");
const progressBar = document.getElementById("progressBar");

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  fileSelected.textContent = file ? file.name : "";
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  if (e.dataTransfer.files.length) {
    fileInput.files = e.dataTransfer.files;
    fileSelected.textContent = e.dataTransfer.files[0].name;
  }
});

function animateProgress(target, duration) {
  const start = performance.now();
  const from = parseFloat(progressBar.style.width) || 0;
  const progressText = document.getElementById("progressText");
  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    const width = from + (target - from) * t;
    progressBar.style.width = width + "%";
    progressText.textContent = Math.round(width) + "%";
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];

  if (!file) {
    statusText.innerHTML = '<span class="error-text">Please choose a file first.</span>';
    return;
  }

  uploadBtn.disabled = true;
  statusText.textContent = "Uploading...";
  progressWrap.classList.add("visible");
  progressBar.style.width = "0%";
  animateProgress(40, 400);

  const id = crypto.randomUUID().split("-")[0];
  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const storagePath = `${id}${ext}`;

  const { error: uploadError } = await client.storage
    .from("uploads")
    .upload(storagePath, file, { upsert: false });

  if (uploadError) {
    statusText.innerHTML = '<span class="error-text">Upload failed: ' + uploadError.message + '</span>';
    progressWrap.classList.remove("visible");
    uploadBtn.disabled = false;
    return;
  }

  animateProgress(80, 300);

  const { error: dbError } = await client
    .from("files")
    .insert([{ id, filename: file.name, filepath: storagePath, file_size: file.size, mime_type: file.type }]);

  if (dbError) {
    statusText.innerHTML = '<span class="error-text">Save failed: ' + dbError.message + '</span>';
    progressWrap.classList.remove("visible");
    uploadBtn.disabled = false;
    return;
  }

  animateProgress(100, 200);

  const shareLink = `${window.location.origin}/download.html?id=${id}`;

  setTimeout(() => {
    progressWrap.classList.remove("visible");
    const sizeLabel = formatSize(file.size);
    statusText.innerHTML = `
      <div class="result-box">
        <div class="result-success">
          <span class="success-check">&#x2713;</span>
          <span>Uploaded successfully</span>
        </div>
        <div class="result-file">
          <span class="result-file-name">${file.name}</span>
          <span class="result-file-size">${sizeLabel}</span>
        </div>
        <div class="result-label">Your share link</div>
        <div class="result-link-row">
          <a class="result-link" href="${shareLink}" target="_blank" title="${shareLink}">${shareLink}</a>
          <button class="copy-btn" id="copyBtn">Copy</button>
        </div>
      </div>
    `;

    document.getElementById("copyBtn").addEventListener("click", () => {
      navigator.clipboard.writeText(shareLink).then(() => {
        const btn = document.getElementById("copyBtn");
        btn.textContent = "Copied!";
        btn.classList.add("copied");
        setTimeout(() => {
          btn.textContent = "Copy";
          btn.classList.remove("copied");
        }, 2000);
      });
    });

    fileInput.value = "";
    fileSelected.textContent = "";
    uploadBtn.disabled = false;
  }, 300);
});
