const SUPABASE_URL =
  "https://vrranmkhmaycnhxnsgnn.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_kGGyyLx8B5E2n9KxQT4V-Q_5VdhiPc1";

const client = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const uploadBtn =
  document.getElementById("uploadBtn");

const fileInput =
  document.getElementById("fileInput");

const statusText =
  document.getElementById("status");

uploadBtn.addEventListener("click", async () => {

  const file = fileInput.files[0];

  if (!file) {

    statusText.innerText =
      "Please choose a file.";

    return;
  }

  statusText.innerText =
    "Uploading...";

  // random share ID
  const id = Math.random()
    .toString(36)
    .substring(2, 10);

  // storage filename
  const storagePath =
    `${id}_${file.name}`;

  // upload to storage
  const { error: uploadError } =
    await client.storage
      .from("uploads")
      .upload(storagePath, file);

  if (uploadError) {

    console.error(uploadError);

    statusText.innerText =
      "Upload failed: " +
      uploadError.message;

    return;
  }

  // save metadata
  const { error: dbError } =
    await client
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

    statusText.innerText =
      "Database failed: " +
      dbError.message;

    return;
  }

  // generate share link
  const shareLink =
    `${window.location.origin}/download.html?id=${id}`;

  statusText.innerHTML = `
    Upload successful!
    <br><br>

    <a href="${shareLink}" target="_blank">
      ${shareLink}
    </a>
  `;

  fileInput.value = "";

});
