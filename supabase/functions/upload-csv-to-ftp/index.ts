import { corsHeaders } from "@shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { csvContent, filename } = await req.json();

    if (!csvContent) {
      throw new Error("CSV content is required");
    }

    // FTP connection details
    const ftpConfig = {
      host: "207.244.67.71",
      port: 106,
      user: "OneSync",
      pass: "p3gKwzhBp",
    };

    // Create a temporary file
    const tempFilename = `/tmp/${filename || "release.csv"}`;
    await Deno.writeTextFile(tempFilename, csvContent);

    // Use curl to upload via FTP (more reliable in Deno environment)
    const ftpUrl = `ftp://${ftpConfig.user}:${ftpConfig.pass}@${ftpConfig.host}:${ftpConfig.port}/${filename || "release.csv"}`;

    const command = new Deno.Command("curl", {
      args: [
        "-T",
        tempFilename,
        ftpUrl,
        "--ftp-create-dirs",
        "--connect-timeout",
        "30",
        "--max-time",
        "60",
      ],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout, stderr } = await command.output();

    // Clean up temp file
    try {
      await Deno.remove(tempFilename);
    } catch {
      // Ignore cleanup errors
    }

    if (code !== 0) {
      const errorOutput = new TextDecoder().decode(stderr);
      console.error("FTP upload failed:", errorOutput);
      throw new Error(`FTP upload failed: ${errorOutput}`);
    }

    const successOutput = new TextDecoder().decode(stdout);
    console.log("FTP upload successful:", successOutput);

    return new Response(
      JSON.stringify({
        success: true,
        message: "CSV uploaded to FTP successfully",
        filename: filename || "release.csv",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error uploading CSV to FTP:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
