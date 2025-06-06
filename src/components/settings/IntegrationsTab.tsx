import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SpotifyIntegration from "../integrations/SpotifyIntegration";

const IntegrationsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Integrations</h2>
        <p className="text-muted-foreground">
          Connect your external services and platforms
        </p>
      </div>

      <Tabs defaultValue="spotify" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="spotify">Spotify</TabsTrigger>
        </TabsList>

        <TabsContent value="spotify" className="mt-6">
          <SpotifyIntegration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationsTab;
