import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Upload, Download, Play, Pause, Volume2, Zap } from "lucide-react";
import { aiMasteringAPI, MasteringSettings } from "@/lib/aiMastering";
import { toast } from "react-hot-toast";

const AIMasteringInterface = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedAudioUrl, setProcessedAudioUrl] = useState<string | null>(
    null,
  );
  const [originalAudioUrl, setOriginalAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState({
    original: false,
    processed: false,
  });
  const [settings, setSettings] = useState<MasteringSettings>(
    aiMasteringAPI.getDefaultSettings(),
  );

  const originalAudioRef = useRef<HTMLAudioElement>(null);
  const processedAudioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("File selected:", {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    });

    // Validate the file using the API's validation method
    const validation = aiMasteringAPI.validateAudioFile(file);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid audio file");
      return;
    }

    setAudioFile(file);
    setOriginalAudioUrl(URL.createObjectURL(file));
    setProcessedAudioUrl(null);
    toast.success(
      `Audio file loaded: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
    );
  };

  const handleProcess = async () => {
    if (!audioFile) {
      toast.error("Please select an audio file first");
      return;
    }

    // Check API configuration first
    const configStatus = aiMasteringAPI.getConfigurationStatus();
    if (!configStatus.isConfigured) {
      toast.error(configStatus.message);
      return;
    }

    // Validate audio file
    const validation = aiMasteringAPI.validateAudioFile(audioFile);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid audio file");
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    console.log("Starting AI mastering process...", {
      fileName: audioFile.name,
      fileSize: audioFile.size,
      fileType: audioFile.type,
      settings,
    });

    try {
      const result = await aiMasteringAPI.processAudio(
        audioFile,
        settings,
        (progressValue) => {
          console.log("Progress update:", progressValue);
          setProgress(progressValue);
        },
      );

      console.log("Processing result:", result);

      if (result.success && result.processedAudioUrl) {
        setProcessedAudioUrl(result.processedAudioUrl);
        toast.success(
          `Audio mastered successfully in ${result.processingTime}s!`,
        );
      } else {
        const errorMessage = result.error || "Processing failed";
        console.error("Processing failed:", errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      console.error("Processing error:", error);
      toast.error(`Processing failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const togglePlayback = (type: "original" | "processed") => {
    const audioRef = type === "original" ? originalAudioRef : processedAudioRef;
    const audioElement = audioRef.current;

    if (!audioElement) return;

    if (isPlaying[type]) {
      audioElement.pause();
      setIsPlaying((prev) => ({ ...prev, [type]: false }));
    } else {
      audioElement.play();
      setIsPlaying((prev) => ({ ...prev, [type]: true }));
    }
  };

  const handleDownload = () => {
    if (processedAudioUrl) {
      const link = document.createElement("a");
      link.href = processedAudioUrl;
      link.download = `mastered_${audioFile?.name || "audio"}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const updateSettings = (key: keyof MasteringSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="relative">
      {/* Faded Background Interface */}
      <div className="opacity-60 pointer-events-none space-y-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Upload Audio</CardTitle>
              <CardDescription>
                Select an audio file to master with AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload */}
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {audioFile ? audioFile.name : "Drop your audio file here"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {audioFile
                      ? `${(audioFile.size / 1024 / 1024).toFixed(2)} MB`
                      : "Supports WAV, MP3, FLAC, AAC (max 100MB)"}
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="mt-4"
                  >
                    Choose File
                  </Button>
                </div>
              </div>

              {/* Processing Progress */}
              {isProcessing && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Processing...</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {/* Process Button */}
              <Button
                onClick={handleProcess}
                disabled={!audioFile || isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Zap className="w-4 h-4 mr-2 animate-pulse" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Master Audio
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Settings Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Mastering Settings</CardTitle>
              <CardDescription>
                Customize your mastering preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Style Selection */}
              <div className="space-y-2">
                <Label>Mastering Style</Label>
                <Select
                  value={settings.style}
                  onValueChange={(value: any) => updateSettings("style", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="punchy">Punchy</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="bright">Bright</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Intensity */}
              <div className="space-y-2">
                <Label>Processing Intensity</Label>
                <Select
                  value={settings.intensity}
                  onValueChange={(value: any) =>
                    updateSettings("intensity", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="heavy">Heavy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target Loudness */}
              <div className="space-y-3">
                <Label>Target Loudness (LUFS)</Label>
                <Slider
                  value={[settings.targetLoudness]}
                  onValueChange={([value]) =>
                    updateSettings("targetLoudness", value)
                  }
                  min={-23}
                  max={-6}
                  step={1}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground text-center">
                  {settings.targetLoudness} LUFS
                </div>
              </div>

              {/* Enhancement Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enhance-bass">Enhance Bass</Label>
                  <Switch
                    id="enhance-bass"
                    checked={settings.enhanceBass}
                    onCheckedChange={(checked) =>
                      updateSettings("enhanceBass", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="enhance-highs">Enhance Highs</Label>
                  <Switch
                    id="enhance-highs"
                    checked={settings.enhanceHighs}
                    onCheckedChange={(checked) =>
                      updateSettings("enhanceHighs", checked)
                    }
                  />
                </div>
              </div>

              {/* Stereo Width */}
              <div className="space-y-3">
                <Label>Stereo Width</Label>
                <Slider
                  value={[settings.stereoWidth]}
                  onValueChange={([value]) =>
                    updateSettings("stereoWidth", value)
                  }
                  min={50}
                  max={150}
                  step={5}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground text-center">
                  {settings.stereoWidth}%
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        {(originalAudioUrl || processedAudioUrl) && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Audio Comparison</CardTitle>
                <CardDescription>
                  Compare your original and mastered audio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Original Audio */}
                  {originalAudioUrl && (
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Volume2 className="w-4 h-4" />
                        Original
                      </h4>
                      <div className="bg-muted rounded-lg p-4">
                        <audio
                          ref={originalAudioRef}
                          src={originalAudioUrl}
                          onEnded={() =>
                            setIsPlaying((prev) => ({
                              ...prev,
                              original: false,
                            }))
                          }
                          className="hidden"
                        />
                        <Button
                          onClick={() => togglePlayback("original")}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          {isPlaying.original ? (
                            <Pause className="w-4 h-4 mr-2" />
                          ) : (
                            <Play className="w-4 h-4 mr-2" />
                          )}
                          {isPlaying.original ? "Pause" : "Play"} Original
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Processed Audio */}
                  {processedAudioUrl && (
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        Mastered
                      </h4>
                      <div className="bg-muted rounded-lg p-4">
                        <audio
                          ref={processedAudioRef}
                          src={processedAudioUrl}
                          onEnded={() =>
                            setIsPlaying((prev) => ({
                              ...prev,
                              processed: false,
                            }))
                          }
                          className="hidden"
                        />
                        <div className="space-y-3">
                          <Button
                            onClick={() => togglePlayback("processed")}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            {isPlaying.processed ? (
                              <Pause className="w-4 h-4 mr-2" />
                            ) : (
                              <Play className="w-4 h-4 mr-2" />
                            )}
                            {isPlaying.processed ? "Pause" : "Play"} Mastered
                          </Button>
                          <Button
                            onClick={handleDownload}
                            className="w-full"
                            size="sm"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
        <h1 className="text-6xl font-bold text-foreground">COMING SOON</h1>
      </div>
    </div>
  );
};

export default AIMasteringInterface;
