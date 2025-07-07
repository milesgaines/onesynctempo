import { saveAs } from "file-saver";
import { supabase } from "./supabaseClient";

export function generateReleaseCSV(releaseInfo: any, tracks: any[]) {
  const headers = [
    "ReleaseNo",
    "Primary Artist (Required)",
    "Display Artist (Optional)",
    "Featured Artist (Optional)",
    "Release Title (Required)",
    "Label (Optional)",
    "Art Work Name (Required)",
    "Cat Number (Required)",
    "Main Genre (Required)",
    "Sub Genre (Required)",
    "Original Release Date (Optional)",
    "Pre Order Date (Optional)",
    "Release Version (Optional)",
    "Track Title (Required)",
    "Version Title (Optional)",
    "Remixer (Optional)",
    "Track No. (Required)",
    "Track Audio Name (Required)",
    "Track Genre (Optional)",
    "Track SubGenre (Optional)",
    "Track ISRC (Optional)",
    "Track Artist (Optional)",
    "Track Explicit (Optional)",
    "Track Album Only (Optional)",
    "Track Price Tiers (Optional)",
    "Track Preview Start Time (Optional)",
    "Track Lyrics Language (Optional)",
    "Track Language (Optional)",
    "Track Composer (Optional)",
    "Track Producer (Optional)",
    "Track Publisher (Optional)",
    "ISRC  (Optional)",
    "Album Only (Optional)",
    "Explicit (Optional)",
    "Track Price Tiers (Optional)",
    "Audio File (Required)",
    "Release Notes (Optional)",
    "Retailers (Optional)",
    "Exclusive on Shop (Optional)",
    "Exclusive For (Optional)",
    "Allow Pre-Order on iTunes (Optional)",
  ];

  const rows = tracks.map((track, index) => [
    900 + index,
    releaseInfo.artist,
    releaseInfo.displayArtist || "",
    "",
    releaseInfo.title,
    releaseInfo.label,
    releaseInfo.artwork.name,
    "CAT" + (900 + index),
    releaseInfo.genre,
    releaseInfo.subgenre,
    releaseInfo.releaseDate,
    "",
    "",
    track.title,
    "",
    "",
    index + 1,
    track.audioFile.name,
    releaseInfo.subgenre,
    releaseInfo.subgenre,
    track.isrc || "",
    releaseInfo.artist,
    track.explicit ? 1 : 0,
    track.albumOnly ? 1 : 0,
    track.price,
    "",
    "en",
    "en",
    "",
    "",
    "",
    "",
    track.albumOnly ? 1 : 0,
    track.explicit ? 1 : 0,
    track.price,
    track.audioFile.name,
    "",
    releaseInfo.selectedRetailers.join(", "),
    "",
    "",
    1,
  ]);

  const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, "release.csv");

  return csvContent; // Return CSV content for potential FTP upload
}

// New function to upload CSV to FTP via Supabase Edge Function
export async function uploadCSVToFTP(
  csvContent: string,
  filename: string = "release.csv",
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    console.log("🚀 [CSV-FTP] Uploading CSV to FTP server...");

    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-upload-csv-to-ftp",
      {
        body: {
          csvContent,
          filename,
        },
      },
    );

    if (error) {
      console.error("❌ [CSV-FTP] Supabase function error:", error);
      throw new Error(error.message || "Failed to invoke FTP upload function");
    }

    if (!data.success) {
      console.error("❌ [CSV-FTP] FTP upload failed:", data.error);
      throw new Error(data.error || "FTP upload failed");
    }

    console.log("✅ [CSV-FTP] CSV uploaded successfully:", data.message);
    return {
      success: true,
      message: data.message,
    };
  } catch (error) {
    console.error("❌ [CSV-FTP] Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Combined function to generate CSV and optionally upload to FTP
export async function generateAndUploadReleaseCSV(
  releaseInfo: any,
  tracks: any[],
  uploadToFTP: boolean = false,
  filename: string = "release.csv",
): Promise<{
  csvContent: string;
  ftpResult?: { success: boolean; message?: string; error?: string };
}> {
  // Define headers and rows for this function
  const headers = [
    "ReleaseNo",
    "Primary Artist (Required)",
    "Display Artist (Optional)",
    "Featured Artist (Optional)",
    "Release Title (Required)",
    "Label (Optional)",
    "Art Work Name (Required)",
    "Cat Number (Required)",
    "Main Genre (Required)",
    "Sub Genre (Required)",
    "Original Release Date (Optional)",
    "Pre Order Date (Optional)",
    "Release Version (Optional)",
    "Track Title (Required)",
    "Version Title (Optional)",
    "Remixer (Optional)",
    "Track No. (Required)",
    "Track Audio Name (Required)",
    "Track Genre (Optional)",
    "Track SubGenre (Optional)",
    "Track ISRC (Optional)",
    "Track Artist (Optional)",
    "Track Explicit (Optional)",
    "Track Album Only (Optional)",
    "Track Price Tiers (Optional)",
    "Track Preview Start Time (Optional)",
    "Track Lyrics Language (Optional)",
    "Track Language (Optional)",
    "Track Composer (Optional)",
    "Track Producer (Optional)",
    "Track Publisher (Optional)",
    "ISRC  (Optional)",
    "Album Only (Optional)",
    "Explicit (Optional)",
    "Track Price Tiers (Optional)",
    "Audio File (Required)",
    "Release Notes (Optional)",
    "Retailers (Optional)",
    "Exclusive on Shop (Optional)",
    "Exclusive For (Optional)",
    "Allow Pre-Order on iTunes (Optional)",
  ];

  const rows = tracks.map((track, index) => [
    900 + index,
    releaseInfo.artist,
    releaseInfo.displayArtist || "",
    "",
    releaseInfo.title,
    releaseInfo.label,
    releaseInfo.artwork.name,
    "CAT" + (900 + index),
    releaseInfo.genre,
    releaseInfo.subgenre,
    releaseInfo.releaseDate,
    "",
    "",
    track.title,
    "",
    "",
    index + 1,
    track.audioFile.name,
    releaseInfo.subgenre,
    releaseInfo.subgenre,
    track.isrc || "",
    releaseInfo.artist,
    track.explicit ? 1 : 0,
    track.albumOnly ? 1 : 0,
    track.price,
    "",
    "en",
    "en",
    "",
    "",
    "",
    "",
    track.albumOnly ? 1 : 0,
    track.explicit ? 1 : 0,
    track.price,
    track.audioFile.name,
    "",
    releaseInfo.selectedRetailers.join(", "),
    "",
    "",
    1,
  ]);

  // Generate CSV content
  const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");

  // Always download locally
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, filename);

  const result: any = { csvContent };

  // Optionally upload to FTP
  if (uploadToFTP) {
    result.ftpResult = await uploadCSVToFTP(csvContent, filename);
  }

  return result;
}
