const SUPABASE_URL =
  "https://vrranmkhmaycnhxnsgnn.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_kGGyyLx8B5E2n9KxQT4V-Q_5VdhiPc1";

const client = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const params =
  new URLSearchParams(window.location.search);

const id =
  params.get("id");

const filenameText =
  document.getElementById("filename");

const downloadBtn =
  document.getElementById("downloadBtn");

async function loadFile() {

  if (!id) {

    filenameText.innerText =
      "Invalid link.";

    downloadBtn.style.display =
      "none";

    return;
  }

  const { data, error } =
    await client
      .from("files")
      .select("*")
      .eq("id", id)
      .single();

  console.log(data);
  console.log(error);

  if (error || !data) {

    filenameText.innerText =
      "File not found.";

    downloadBtn.style.display =
      "none";

    return;
  }

  filenameText.innerText =
    data.filename;

  downloadBtn.onclick = () => {

    const { data: publicUrlData } =
      client.storage
        .from("uploads")
        .getPublicUrl(data.filepath);

    window.open(
      publicUrlData.publicUrl,
      "_blank"
    );

  };

}

loadFile();
