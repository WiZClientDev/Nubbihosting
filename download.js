const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const filenameText = document.getElementById("filename");
const downloadBtn = document.getElementById("downloadBtn");
const fileSizeEl = document.getElementById("fileSize");
const fileTypeEl = document.getElementById("fileType");
const fileUploadedEl = document.getElementById("fileUploaded");
const downloadsCountEl = document.getElementById("downloadsCount");
const fileIconEl = document.getElementById("fileIcon");
const fileExtEl = document.getElementById("fileExt");
const cardEl = document.getElementById("fileCard");
const spinner = document.getElementById("spinner");

function formatSize(bytes) {
  if (bytes === 0 || bytes == null) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function getExtension(filename) {
  const idx = filename.lastIndexOf(".");
  return idx > 0 ? filename.slice(idx + 1).toUpperCase() : "FILE";
}

function iconForType(mime, filename) {
  const ext = getExtension(filename).toLowerCase();
  if (mime && mime.startsWith("image/")) return "&#x1F5BC;";
  if (mime && mime.startsWith("video/")) return "&#x1F3AC;";
  if (mime && mime.startsWith("audio/")) return "&#x1F3B5;";
  if (["pdf"].includes(ext)) return "&#x1F4D1;";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "&#x1F4E6;";
  if (["doc", "docx", "txt", "md", "rtf"].includes(ext)) return "&#x1F4C4;";
  if (["xls", "xlsx", "csv"].includes(ext)) return "&#x1F4CA;";
  if (["ppt", "pptx"].includes(ext)) return "&#x1F4C8;";
  if (["js", "ts", "py", "java", "c", "cpp", "html", "css", "json", "xml"].includes(ext)) return "&#x1F4BB;";
  return "&#x1F4C1;";
}

async function loadFile() {
  if (!id) {
    showError("Invalid link", "This download link is missing a file ID.");
    return;
  }

  let { data, error } = await client
    .from("files")
    .select("*")
    .eq("link_id", id)
    .maybeSingle();

  if (!data && !error) {
    ({ data, error } = await client
      .from("files")
      .select("*")
      .eq("id", id)
      .maybeSingle());
  }

  // If link_id query errored (stale schema cache), fall back to id lookup
  if (error) {
    ({ data, error } = await client
      .from("files")
      .select("*")
      .eq("id", id)
      .maybeSingle());
  }

  if (spinner) spinner.style.display = "none";

  if (error || !data) {
    showError("File not found", "This file may have been deleted or the link is incorrect.");
    return;
  }

  const ext = getExtension(data.filename);
  if (fileIconEl) fileIconEl.innerHTML = iconForType(data.mime_type, data.filename);
  if (fileExtEl) fileExtEl.textContent = ext;

  filenameText.innerText = data.filename;
  if (fileSizeEl) fileSizeEl.textContent = formatSize(data.file_size);
  if (fileTypeEl) fileTypeEl.textContent = data.mime_type || "Unknown";
  if (fileUploadedEl) fileUploadedEl.textContent = formatDate(data.created_at);
  if (downloadsCountEl) downloadsCountEl.textContent = data.downloads || 0;

  if (cardEl) cardEl.classList.add("visible");

  downloadBtn.style.display = "block";
  downloadBtn.onclick = async () => {
    downloadBtn.disabled = true;
    const originalText = downloadBtn.textContent;
    downloadBtn.textContent = "Starting download...";

    const { data: publicUrlData } = client.storage
      .from("uploads")
      .getPublicUrl(data.filepath);

    const a = document.createElement("a");
    a.href = publicUrlData.publicUrl;
    a.download = data.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    await client
      .from("files")
      .update({ downloads: (data.downloads || 0) + 1 })
      .eq("id", id);

    if (downloadsCountEl) downloadsCountEl.textContent = (data.downloads || 0) + 1;

    setTimeout(() => {
      downloadBtn.disabled = false;
      downloadBtn.textContent = originalText;
    }, 1500);
  };
}

function showError(title, message) {
  if (spinner) spinner.style.display = "none";
  if (cardEl) cardEl.style.display = "none";
  downloadBtn.style.display = "none";
  filenameText.parentElement.innerHTML = `
    <div class="error-block">
      <div class="error-icon">&#x26A0;</div>
      <h2>${title}</h2>
      <p>${message}</p>
    </div>
  `;
}

loadFile();
