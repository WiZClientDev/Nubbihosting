const SUPABASE_URL = "YOUR_URL";
const SUPABASE_ANON_KEY = "YOUR_KEY";

const client = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const params = new URLSearchParams(window.location.search);

const id = params.get("id");

const filenameText = document.getElementById("filename");
const downloadBtn = document.getElementById("downloadBtn");

async function loadFile() {

  const { data, error } = await client
    .from("files")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    filenameText.innerText = "File not found.";
    downloadBtn.style.display = "none";
    return;
  }

  filenameText.innerText = data.filename;

  downloadBtn.addEventListener("click", () => {

    const { data: publicUrlData } = client
      .storage
      .from("uploads")
      .getPublicUrl(data.filepath);

    window.location.href = publicUrlData.publicUrl;

  });

}

loadFile();
