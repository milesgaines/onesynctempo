import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Sparkles, Zap, Target, Lightbulb } from "lucide-react";

interface InsightsModuleProps {
  insights: Array<{
    title: string;
    description: string;
    type: "positive" | "negative" | "neutral";
  }>;
  platformStats: Array<{ platform: string; percentage: number; color: string }>;
  geographicStats: Array<{ country: string; plays: number }>;
}

const InsightsModule: React.FC<InsightsModuleProps> = ({
  insights,
  platformStats,
  geographicStats,
}) => {
  return (
    <Card className="shadow-lg border-opacity-50 overflow-hidden bg-gradient-to-b from-card/95 to-card/90 backdrop-blur-sm transition-all duration-300 hover:shadow-xl border border-pink-500/10">
      <CardHeader className="bg-gradient-to-r from-pink-500/10 to-card/90 border-b border-pink-500/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
              <Sparkles className="h-5 w-5 mr-2 text-pink-500" />
              Analytics Insights
            </CardTitle>
            <CardDescription className="mt-1">
              AI-powered insights and recommendations based on your data
            </CardDescription>
          </div>
          <div className="bg-pink-500/10 rounded-full p-2 transition-transform duration-300 hover:scale-110 hover:shadow-glow hover:bg-pink-500/20">
            <Lightbulb className="h-6 w-6 text-pink-500 animate-pulse-subtle" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {insights?.map((insight, index) => (
            <div
              key={index}
              className={`p-4 border rounded-lg backdrop-blur-sm transition-all duration-300 hover:shadow-md ${insight.type === "positive" ? "border-green-500/30 bg-green-500/10" : insight.type === "negative" ? "border-red-500/30 bg-red-500/10" : "border-blue-500/30 bg-blue-500/10"}`}
            >
              <h3
                className={`font-semibold flex items-center ${insight.type === "positive" ? "text-green-400" : insight.type === "negative" ? "text-red-400" : "text-blue-400"}`}
              >
                {insight.type === "positive" && (
                  <Zap className="h-4 w-4 mr-2 animate-pulse" />
                )}
                {insight.type === "negative" && (
                  <Target className="h-4 w-4 mr-2" />
                )}
                {insight.type === "neutral" && (
                  <Lightbulb className="h-4 w-4 mr-2" />
                )}
                {insight.title}
              </h3>
              <p className="text-sm mt-1">{insight.description}</p>
            </div>
          ))}

          {/* Performance Summary */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-primary/80 to-purple-400/80 bg-clip-text text-transparent">
              Performance Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border border-primary/20 bg-gradient-to-br from-card/80 to-card/60 hover:shadow-glow transition-all duration-300">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2 text-primary/80">
                    Top Platform
                  </h4>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded shadow-glow"
                      style={{
                        backgroundColor: platformStats[0]?.color || "#8884d8",
                      }}
                    />
                    <span className="font-medium bg-gradient-to-r from-primary/90 to-purple-400/90 bg-clip-text text-transparent">
                      {platformStats[0]?.platform || "N/A"}
                    </span>
                    <span className="text-sm text-muted-foreground ml-auto font-bold">
                      {platformStats[0]?.percentage || 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-primary/20 bg-gradient-to-br from-card/80 to-card/60 hover:shadow-glow transition-all duration-300">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2 text-primary/80">
                    Top Country
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="font-medium bg-gradient-to-r from-primary/90 to-purple-400/90 bg-clip-text text-transparent">
                      {geographicStats[0]?.country || "N/A"}
                    </span>
                    <span className="text-sm text-muted-foreground font-bold">
                      {geographicStats[0]?.plays.toLocaleString() || 0} plays
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recommendations */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-primary/80 to-purple-400/80 bg-clip-text text-transparent">
              Recommendations
            </h3>
            <div className="space-y-3">
              <div className="p-4 border border-primary/20 rounded-lg bg-blue-500/5 backdrop-blur-sm hover:shadow-glow transition-all duration-300 hover:border-primary/30 group">
                <h4 className="font-medium text-blue-400 flex items-center">
                  <Target className="h-4 w-4 mr-2 group-hover:animate-pulse transition-all duration-300" />
                  Optimize Release Schedule
                </h4>
                <p className="text-sm mt-1">
                  Based on your performance data, consider releasing new music
                  on Fridays for maximum impact.
                </p>
              </div>
              <div className="p-4 border border-primary/20 rounded-lg bg-blue-500/5 backdrop-blur-sm hover:shadow-glow transition-all duration-300 hover:border-primary/30 group">
                <h4 className="font-medium text-blue-400 flex items-center">
                  <Zap className="h-4 w-4 mr-2 group-hover:animate-pulse transition-all duration-300" />
                  Expand Platform Presence
                </h4>
                <p className="text-sm mt-1">
                  Your presence on Amazon Music is growing. Consider creating
                  exclusive content for this platform.
                </p>
              </div>
              <div className="p-4 border border-primary/20 rounded-lg bg-blue-500/5 backdrop-blur-sm hover:shadow-glow transition-all duration-300 hover:border-primary/30 group">
                <h4 className="font-medium text-blue-400 flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2 group-hover:animate-pulse transition-all duration-300" />
                  Geographic Targeting
                </h4>
                <p className="text-sm mt-1">
                  Consider running targeted promotions in Germany where your
                  audience is growing rapidly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gradient-to-r from-card/90 to-card/70 border-t border-primary/20 p-4">
        <Button
          variant="web3"
          className="w-full transition-all duration-300 group"
          onClick={() => alert("Detailed insights report coming soon!")}
        >
          <LineChart className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
          Generate Detailed Insights Report
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InsightsModule;
