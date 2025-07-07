export interface MasteringSettings {
  style: "balanced" | "punchy" | "warm" | "bright";
  intensity: "light" | "medium" | "heavy";
  targetLoudness: number;
  enhanceBass: boolean;
  enhanceHighs: boolean;
  stereoWidth: number;
}

export interface ProcessingResult {
  success: boolean;
  processedAudioUrl?: string;
  originalAudioUrl: string;
  settings: MasteringSettings;
  processingTime: number;
  error?: string;
  metadata?: any;
}

const API_BASE_URL = "https://stoplight.io/mocks/roex/tonn-api/732507844";
const API_KEY = "AIzaSyBFZ8JzlOhwYE0HP1lIkZrGpMHW2YK6E3sl";

export class AIMasteringAPI {
  private static instance: AIMasteringAPI;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.apiKey = API_KEY;
  }

  static getInstance(): AIMasteringAPI {
    if (!AIMasteringAPI.instance) {
      AIMasteringAPI.instance = new AIMasteringAPI();
    }
    return AIMasteringAPI.instance;
  }

  public getConfigurationStatus(): { isConfigured: boolean; message: string } {
    console.log("Checking API configuration:", {
      baseUrl: this.baseUrl,
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey?.length || 0,
    });

    if (!this.baseUrl || !this.apiKey) {
      return {
        isConfigured: false,
        message:
          "API configuration is missing. Please check your API credentials.",
      };
    }
    return {
      isConfigured: true,
      message: "AI Mastering API is properly configured.",
    };
  }

  private async uploadAudio(audioFile: File): Promise<string> {
    console.log("Starting audio upload...", {
      fileName: audioFile.name,
      fileSize: audioFile.size,
      fileType: audioFile.type,
      apiUrl: `${this.baseUrl}/api/upload`,
    });

    const formData = new FormData();
    formData.append("audio", audioFile);
    formData.append("api_key", this.apiKey);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch(`${this.baseUrl}/api/upload`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(
        "Upload response status:",
        response.status,
        response.statusText,
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed - Response body:", errorText);
        throw new Error(
          `Upload failed (${response.status}): ${response.statusText}. Details: ${errorText}`,
        );
      }

      const result = await response.json();
      console.log("Upload successful - Response:", result);

      const uploadId = result.upload_id || result.id;
      if (!uploadId) {
        console.error("No upload ID found in response:", result);
        throw new Error("Upload response missing upload ID");
      }

      return uploadId;
    } catch (error) {
      console.error("Upload error:", error);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(
          "Upload timeout - please try again with a smaller file",
        );
      }
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Network error: Unable to connect to the mastering service. Please check your internet connection.",
        );
      }
      throw error;
    }
  }

  private async startProcessing(
    uploadId: string,
    settings: MasteringSettings,
  ): Promise<string> {
    const processingParams = {
      upload_id: uploadId,
      api_key: this.apiKey,
      style: settings.style,
      intensity: settings.intensity,
      target_loudness: settings.targetLoudness,
      enhance_bass: settings.enhanceBass,
      enhance_highs: settings.enhanceHighs,
      stereo_width: settings.stereoWidth / 100, // Convert percentage to decimal
      priority: "high", // Request high priority processing
    };

    console.log("Starting processing with params:", processingParams);
    console.log("Processing API URL:", `${this.baseUrl}/api/master`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${this.baseUrl}/api/master`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(processingParams),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(
        "Processing response status:",
        response.status,
        response.statusText,
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Processing failed - Response body:", errorText);
        throw new Error(
          `Processing failed (${response.status}): ${response.statusText}. Details: ${errorText}`,
        );
      }

      const result = await response.json();
      console.log("Processing started - Response:", result);

      const jobId = result.job_id || result.id;
      if (!jobId) {
        console.error("No job ID found in response:", result);
        throw new Error("Processing response missing job ID");
      }

      return jobId;
    } catch (error) {
      console.error("Processing start error:", error);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Processing request timeout - please try again");
      }
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Network error: Unable to connect to the mastering service. Please check your internet connection.",
        );
      }
      throw error;
    }
  }

  private async checkProcessingStatus(jobId: string): Promise<{
    status: "pending" | "processing" | "completed" | "failed";
    progress: number;
    result_url?: string;
    error?: string;
  }> {
    const statusUrl = `${this.baseUrl}/api/status/${jobId}?api_key=${this.apiKey}`;
    console.log("Checking status for job:", jobId);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(statusUrl, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Cache-Control": "no-cache",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Status check failed - Response body:", errorText);
        throw new Error(
          `Status check failed (${response.status}): ${response.statusText}. Details: ${errorText}`,
        );
      }

      const result = await response.json();
      console.log("Status check result:", result);
      return result;
    } catch (error) {
      console.error("Status check error:", error);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Status check timeout");
      }
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Network error: Unable to connect to the mastering service. Please check your internet connection.",
        );
      }
      throw error;
    }
  }

  private async pollForCompletion(
    jobId: string,
    onProgress?: (progress: number) => void,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let pollInterval = 1000; // Start with 1 second
      let attempts = 0;
      const maxAttempts = 150; // 5 minutes max with adaptive polling

      const poll = async () => {
        try {
          attempts++;
          const status = await this.checkProcessingStatus(jobId);

          if (onProgress) {
            onProgress(status.progress || 0);
          }

          if (status.status === "completed" && status.result_url) {
            resolve(status.result_url);
            return;
          } else if (status.status === "failed") {
            reject(new Error(status.error || "Processing failed"));
            return;
          }

          if (attempts >= maxAttempts) {
            reject(new Error("Processing timeout"));
            return;
          }

          // Adaptive polling - increase interval over time
          if (attempts > 10) pollInterval = 2000; // 2 seconds after 10 attempts
          if (attempts > 30) pollInterval = 3000; // 3 seconds after 30 attempts

          setTimeout(poll, pollInterval);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  async processAudio(
    audioFile: File,
    settings: MasteringSettings,
    onProgress?: (progress: number) => void,
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const originalAudioUrl = URL.createObjectURL(audioFile);

    try {
      // Validate file
      if (!audioFile.type.startsWith("audio/")) {
        throw new Error("Invalid audio file format");
      }

      if (audioFile.size > 100 * 1024 * 1024) {
        // 100MB limit
        throw new Error("Audio file is too large (max 100MB)");
      }

      // Step 1: Upload audio
      if (onProgress) onProgress(10);
      const uploadId = await this.uploadAudio(audioFile);

      // Step 2: Start processing
      if (onProgress) onProgress(20);
      const jobId = await this.startProcessing(uploadId, settings);

      // Step 3: Poll for completion
      const resultUrl = await this.pollForCompletion(jobId, (progress) => {
        // Map polling progress to 20-90% range
        const mappedProgress = 20 + progress * 0.7;
        if (onProgress) onProgress(mappedProgress);
      });

      // Step 4: Download result
      if (onProgress) onProgress(95);
      console.log("Downloading processed audio from:", resultUrl);

      const response = await fetch(resultUrl);
      console.log(
        "Download response status:",
        response.status,
        response.statusText,
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Download failed - Response body:", errorText);
        throw new Error(
          `Failed to download processed audio (${response.status}): ${response.statusText}`,
        );
      }

      const audioBlob = await response.blob();
      console.log(
        "Downloaded audio blob size:",
        audioBlob.size,
        "type:",
        audioBlob.type,
      );
      const processedAudioUrl = URL.createObjectURL(audioBlob);

      if (onProgress) onProgress(100);

      const processingTime = Math.round((Date.now() - startTime) / 1000);

      return {
        success: true,
        processedAudioUrl,
        originalAudioUrl,
        settings,
        processingTime,
        metadata: {
          originalSize: audioFile.size,
          originalName: audioFile.name,
          processedSize: audioBlob.size,
        },
      };
    } catch (error) {
      const processingTime = Math.round((Date.now() - startTime) / 1000);
      console.error("AI Mastering Error:", error);

      return {
        success: false,
        originalAudioUrl,
        settings,
        processingTime,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  getDefaultSettings(): MasteringSettings {
    return {
      style: "balanced",
      intensity: "medium",
      targetLoudness: -14,
      enhanceBass: false,
      enhanceHighs: false,
      stereoWidth: 100,
    };
  }

  // Utility method to validate audio file
  validateAudioFile(file: File): { valid: boolean; error?: string } {
    if (!file.type.startsWith("audio/")) {
      return { valid: false, error: "File must be an audio file" };
    }

    if (file.size > 100 * 1024 * 1024) {
      return { valid: false, error: "File size must be less than 100MB" };
    }

    const supportedFormats = [
      "audio/wav",
      "audio/mp3",
      "audio/flac",
      "audio/aac",
    ];
    if (!supportedFormats.includes(file.type)) {
      return { valid: false, error: "Supported formats: WAV, MP3, FLAC, AAC" };
    }

    return { valid: true };
  }

  // Method to get processing cost estimate
  getProcessingCostEstimate(
    durationMinutes: number,
    settings: MasteringSettings,
  ): number {
    let baseCost = durationMinutes * 0.1; // $0.10 per minute base

    // Adjust cost based on intensity
    const intensityMultiplier = {
      light: 1.0,
      medium: 1.2,
      heavy: 1.5,
    };

    baseCost *= intensityMultiplier[settings.intensity];

    // Additional processing features
    if (settings.enhanceBass) baseCost *= 1.1;
    if (settings.enhanceHighs) baseCost *= 1.1;
    if (settings.stereoWidth !== 100) baseCost *= 1.05;

    return Math.round(baseCost * 100) / 100; // Round to 2 decimal places
  }
}

export const aiMasteringAPI = AIMasteringAPI.getInstance();
