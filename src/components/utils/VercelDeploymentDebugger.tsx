import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Terminal,
} from "lucide-react";

interface DeploymentLog {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
}

interface DeploymentInfo {
  id: string;
  status: "building" | "ready" | "error" | "canceled";
  url?: string;
  createdAt: string;
  buildTime?: number;
  logs: DeploymentLog[];
}

const mockDeployment: DeploymentInfo = {
  id: "dpl_abc123",
  status: "ready",
  url: "https://my-app-xyz.vercel.app",
  createdAt: "2024-01-15T10:30:00Z",
  buildTime: 45,
  logs: [
    { id: "1", timestamp: "10:30:01", level: "info", message: "Build started" },
    {
      id: "2",
      timestamp: "10:30:15",
      level: "info",
      message: "Installing dependencies...",
    },
    {
      id: "3",
      timestamp: "10:30:25",
      level: "warn",
      message: "Deprecated package found: @types/node@14.x",
    },
    {
      id: "4",
      timestamp: "10:30:35",
      level: "info",
      message: "Building application...",
    },
    {
      id: "5",
      timestamp: "10:30:45",
      level: "info",
      message: "Build completed successfully",
    },
    {
      id: "6",
      timestamp: "10:30:46",
      level: "info",
      message: "Deployment ready",
    },
  ],
};

export default function VercelDeploymentDebugger() {
  const [deployment, setDeployment] = useState<DeploymentInfo>(mockDeployment);
  const [loading, setLoading] = useState(false);

  const refreshDeployment = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setDeployment({ ...mockDeployment });
      setLoading(false);
    }, 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "building":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-100 text-green-800";
      case "building":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "text-red-600";
      case "warn":
        return "text-yellow-600";
      case "info":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="bg-white p-6 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Deployment Debugger</h1>
            <p className="text-muted-foreground">
              Monitor and debug your Vercel deployments
            </p>
          </div>
          <Button onClick={refreshDeployment} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Deployment Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(deployment.status)}
              Deployment Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Deployment ID
                </p>
                <p className="font-mono text-sm">{deployment.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Status
                </p>
                <Badge className={getStatusColor(deployment.status)}>
                  {deployment.status.toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Created
                </p>
                <p className="text-sm">
                  {new Date(deployment.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Build Time
                </p>
                <p className="text-sm">{deployment.buildTime}s</p>
              </div>
            </div>
            {deployment.url && (
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Deployment URL
                </p>
                <div className="flex items-center gap-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                    {deployment.url}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(deployment.url, "_blank")}
                  >
                    Visit
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deployment Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Build Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 w-full border rounded p-4">
              <div className="space-y-1">
                {deployment.logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 text-sm font-mono"
                  >
                    <span className="text-gray-500 min-w-[60px]">
                      {log.timestamp}
                    </span>
                    <span
                      className={`min-w-[50px] font-semibold ${getLogLevelColor(log.level)}`}
                    >
                      [{log.level.toUpperCase()}]
                    </span>
                    <span className="flex-1">{log.message}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Debug Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                Download Logs
              </Button>
              <Button variant="outline" size="sm">
                View Source
              </Button>
              <Button variant="outline" size="sm">
                Redeploy
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                Cancel Deployment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
