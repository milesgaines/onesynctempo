import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, CheckCircle, AlertCircle } from "lucide-react";

interface DeploymentStatus {
  status: "idle" | "deploying" | "success" | "error";
  message?: string;
  url?: string;
}

export default function VercelDeployer() {
  const [projectName, setProjectName] = useState("");
  const [deployment, setDeployment] = useState<DeploymentStatus>({
    status: "idle",
  });

  const handleDeploy = async () => {
    if (!projectName.trim()) {
      setDeployment({
        status: "error",
        message: "Please enter a project name",
      });
      return;
    }

    setDeployment({ status: "deploying" });

    // Simulate deployment process
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% success rate for demo
      if (success) {
        setDeployment({
          status: "success",
          message: "Deployment successful!",
          url: `https://${projectName.toLowerCase().replace(/\s+/g, "-")}.vercel.app`,
        });
      } else {
        setDeployment({
          status: "error",
          message: "Deployment failed. Please try again.",
        });
      }
    }, 3000);
  };

  const resetDeployment = () => {
    setDeployment({ status: "idle" });
    setProjectName("");
  };

  return (
    <div className="bg-white p-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Vercel Deployer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {deployment.status === "idle" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                />
              </div>
              <Button onClick={handleDeploy} className="w-full">
                Deploy to Vercel
              </Button>
            </>
          )}

          {deployment.status === "deploying" && (
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">
                Deploying your project...
              </p>
            </div>
          )}

          {deployment.status === "success" && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{deployment.message}</AlertDescription>
              </Alert>
              {deployment.url && (
                <div className="space-y-2">
                  <Label>Deployment URL:</Label>
                  <div className="p-2 bg-gray-100 rounded text-sm font-mono break-all">
                    {deployment.url}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => window.open(deployment.url, "_blank")}
                    className="w-full"
                  >
                    Visit Site
                  </Button>
                </div>
              )}
              <Button
                onClick={resetDeployment}
                variant="outline"
                className="w-full"
              >
                Deploy Another Project
              </Button>
            </div>
          )}

          {deployment.status === "error" && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{deployment.message}</AlertDescription>
              </Alert>
              <Button
                onClick={resetDeployment}
                variant="outline"
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
