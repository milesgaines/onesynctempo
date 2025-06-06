import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import IntegrationsTab from "./IntegrationsTab";
import BillingTab from "./BillingTab";
import ProfileSettings from "./ProfileSettings";
import ArtistManager from "../artists/ArtistManager";

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="w-full h-full p-3 sm:p-4 md:p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-lg mb-6 bg-muted/20">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all hover:bg-muted/50 cursor-pointer"
            onClick={() => {
              console.log("👤 [SETTINGS] Profile tab clicked");
              setActiveTab("profile");
            }}
          >
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="billing"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all hover:bg-muted/50 cursor-pointer"
            onClick={() => {
              console.log("💳 [SETTINGS] Billing tab clicked");
              setActiveTab("billing");
            }}
          >
            Billing
          </TabsTrigger>
          <TabsTrigger
            value="artists"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all hover:bg-muted/50 cursor-pointer"
            onClick={() => {
              console.log("🎤 [SETTINGS] Artists tab clicked");
              setActiveTab("artists");
            }}
          >
            Artists
          </TabsTrigger>
          <TabsTrigger
            value="integrations"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all hover:bg-muted/50 cursor-pointer"
            onClick={() => {
              console.log("🔗 [SETTINGS] Integrations tab clicked");
              setActiveTab("integrations");
            }}
          >
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="billing">
          <BillingTab />
        </TabsContent>

        <TabsContent value="artists">
          <ArtistManager />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
