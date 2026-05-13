const SUPABASE_URL = "https://vrranmkhmaycnhxnsgnn.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_kGGyyLx8B5E2n9KxQT4V-Q_5VdhiPc1";

const client = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const statusText = document.getElementById("status");
const fileList = document.getElementById("fileList");

async function loadFiles() {

  fileList.innerHTML = "Loading...";

  const { data, error } = await client
    .storage
    .from("uploads")
    .list();

  if (error) {
    console.error(error);
    fileList.innerHTML = "Failed to load files.";
    return;
  }

  fileList.innerHTML = "";

  if (data.length === 0) {
    fileList.innerHTML = "No files uploaded yet.";
    return;
  }

  data.forEach(file => {

    const { data: publicUrlData } = client
      .storage
      .from("uploads")
      .getPublicUrl(file.name);

    const div = document.createElement("div");

    div.className = "file-item";

    div.innerHTML = `
      <a href="${publicUrlData.publicUrl}" target="_blank">
        ${file.name}
      </a>
    `;

    fileList.appendChild(div);

  });

}

uploadBtn.addEventListener("click", async () => {

  const file = fileInput.files[0];

  if (!file) {
    statusText.innerText = "Please choose a file.";
    return;
  }

  statusText.innerText = "Uploading...";

  // create unique ID
  const id = Math.random()
    .toString(36)
    .substring(2, 10);

  // file path in storage
  const storagePath = `${id}_${file.name}`;

  // upload file
  const { error: uploadError } = await client
    .storage
    .from("uploads")
    .upload(storagePath, file);

  if (uploadError) {
    console.error(uploadError);
    statusText.innerText = "Upload failed.";
    return;
  }

  // save in database
  const { error: dbError } = await client
    .from("files")
    .insert([
      {
        id: id,
        filename: file.name,
        filepath: storagePath
      }
    ]);

  if (dbError) {
    console.error(dbError);
    statusText.innerText = "Database save failed.";
    return;
  }

  // create share link
  const shareLink =
    `${window.location.origin}/download.html?id=${id}`;

  statusText.innerHTML = `
    Upload successful!<br><br>

    Share Link:<br>

    <a href="${shareLink}" target="_blank">
      ${shareLink}
    </a>
  `;

  fileInput.value = "";

  loadFiles();

});

loadFiles();
