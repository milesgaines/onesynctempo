import { useState, useEffect } from "react";
import WelcomeBanner from "./welcome-banner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  TooltipContentEnhanced,
} from "@/components/ui/tooltip-enhanced";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AreaChart, BarChart, LineChart } from "recharts";
import {
  Area,
  Bar,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Tooltip as RechartsTooltip } from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  ChevronDown,
  Bell,
  Settings,
  User,
  LogOut,
  Music,
  BarChart2,
  DollarSign,
  Home,
  Menu,
  FileText,
  Users,
  Globe,
  Zap,
  Layers,
  Share2,
  ArrowUpRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import NotificationCenter from "./notifications/NotificationCenter";
import DashboardOverview from "./dashboard/DashboardOverview";
import AnalyticsCharts from "./dashboard/AnalyticsCharts";
import MusicUploader from "./upload/MusicUploader";
import ReleasesManager from "./music/ReleasesManager";
import EarningsManager from "./earnings/EarningsManager";
import SettingsPage from "./settings/SettingsPage";
import ArtistManager from "./artists/ArtistManager";
import { useAuth } from "./auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { Toaster } from "@/components/ui/toaster";
import Intercom from "@intercom/messenger-js-sdk";
import AIMasteringInterface from "./ai-mastering/AIMasteringInterface";

const HomePage = () => {
  const { user: authUser, userProfile: authUserProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<
    { id: string; title: string; message: string; read: boolean }[]
  >([]);
  const [intercomUnreadCount, setIntercomUnreadCount] = useState(0);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  // Use userProfile from AuthProvider instead of local state

  // User data from auth and profile
  const user = {
    name: authUserProfile?.name || authUser?.user_metadata?.name || "User",
    email: authUser?.email || "user@example.com",
    avatar:
      authUserProfile?.avatar_url ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser?.id}`,
    role: authUserProfile?.role || "Artist",
  };

  // Load Intercom unread count function
  const loadIntercomUnreadCount = async () => {
    if (!authUser) return;

    try {
      const { data: intercomData, error: intercomError } =
        await supabase.functions.invoke(
          "supabase-functions-get-intercom-unread-count",
          {
            body: { user_id: authUser.id },
          },
        );

      if (intercomError) {
        console.error(
          "❌ [HOME] Error loading Intercom unread count:",
          intercomError,
        );
        setIntercomUnreadCount(0);
      } else if (intercomData && intercomData.success) {
        setIntercomUnreadCount(intercomData.unread_count || 0);
        console.log(
          "📬 [HOME] Intercom unread count:",
          intercomData.unread_count,
        );
      } else {
        setIntercomUnreadCount(0);
      }
    } catch (error) {
      console.error("❌ [HOME] Error fetching Intercom unread count:", error);
      setIntercomUnreadCount(0);
    }
  };

  // Calculate total unread count
  const totalUnreadCount =
    notifications.filter((n) => !n.read).length + intercomUnreadCount;

  // Refresh Intercom unread count periodically
  useEffect(() => {
    if (!authUser) return;

    const interval = setInterval(() => {
      loadIntercomUnreadCount();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [authUser]);

  // Scroll to top when tab changes
  useEffect(() => {
    console.log("📱 [HOME] Tab changed to:", activeTab);
    // Scroll main content area to top
    const mainContent = document.querySelector("main.overflow-y-auto");
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeTab]);

  // Initialize Intercom
  useEffect(() => {
    if (authUser && authUserProfile) {
      try {
        const createdAtTimestamp = authUser.created_at
          ? Math.floor(new Date(authUser.created_at).getTime() / 1000)
          : Math.floor(Date.now() / 1000);

        Intercom({
          app_id: "jqxuhc70",
          user_id: authUser.id,
          name: authUserProfile.name || authUser.user_metadata?.name || "User",
          email: authUser.email,
          created_at: createdAtTimestamp,
        });

        console.log(
          "✅ [INTERCOM] Initialized successfully for user:",
          authUser.email,
        );
      } catch (error) {
        console.error("❌ [INTERCOM] Failed to initialize:", error);
      }
    }
  }, [authUser, authUserProfile]);

  // Listen for upload dialog events
  useEffect(() => {
    const handleOpenUploadDialog = () => {
      console.log("📡 [HOME] Received open-upload-dialog event");
      setIsUploadDialogOpen(true);
    };

    window.addEventListener("open-upload-dialog", handleOpenUploadDialog);

    return () => {
      window.removeEventListener("open-upload-dialog", handleOpenUploadDialog);
    };
  }, []);

  // Load user profile and notifications
  useEffect(() => {
    let mounted = true;
    console.log(
      "🏠 [HOME] Loading initial data for user:",
      authUser?.email || "None",
    );

    const loadInitialData = async () => {
      if (!authUser || !mounted) {
        console.log(
          "⚠️ [HOME] No auth user or component unmounted, skipping data load",
        );
        return;
      }

      console.log("📊 [HOME] Starting data load for user:", authUser.id);
      setIsLoading(true);
      try {
        // Profile is now managed by AuthProvider
        console.log(
          "👤 [HOME] Using profile from AuthProvider:",
          authUserProfile?.name || "None",
        );

        // Show welcome banner only for new users (onboarding not completed)
        if (authUserProfile && !authUserProfile.onboarding_completed) {
          setShowWelcomeBanner(true);
          console.log("🎉 [HOME] Showing welcome banner for new user");
        } else {
          setShowWelcomeBanner(false);
          console.log("✅ [HOME] Welcome banner hidden for returning user");
        }

        // Load recent tracks for notifications
        console.log("🎵 [HOME] Loading recent tracks");
        const { data: tracks, error: tracksError } = await supabase
          .from("tracks")
          .select("*")
          .eq("user_id", authUser.id)
          .order("created_at", { ascending: false })
          .limit(3);

        if (tracksError) {
          console.error("❌ [HOME] Error loading tracks:", tracksError);
        } else {
          console.log(
            "✅ [HOME] Tracks loaded:",
            tracks?.length || 0,
            "tracks",
          );
        }

        // Generate notifications based on real data
        const realNotifications = [];

        if (tracks && tracks.length > 0) {
          tracks.forEach((track, index) => {
            if (track.status === "live") {
              realNotifications.push({
                id: `track-${track.id}`,
                title: "Track Live",
                message: `Your track '${track.title}' is now live on all platforms!`,
                read: index > 0,
              });
            }
          });
        }

        // Add some default notifications if none exist
        if (realNotifications.length === 0) {
          realNotifications.push(
            {
              id: "welcome-1",
              title: "Welcome to OneSync!",
              message:
                "Start by uploading your first track to begin your music distribution journey.",
              read: false,
            },
            {
              id: "welcome-2",
              title: "Complete Your Profile",
              message:
                "Add your artist information and payment details to get started.",
              read: false,
            },
          );
        }

        if (mounted) {
          setNotifications(realNotifications);
          console.log(
            "🔔 [HOME] Notifications set:",
            realNotifications.length,
            "notifications",
          );

          // Load Intercom unread count
          await loadIntercomUnreadCount();
        }
      } catch (error) {
        console.error("❌ [HOME] Error loading initial data:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
          console.log("✅ [HOME] Data loading complete");
        }
      }
    };

    loadInitialData();

    return () => {
      mounted = false;
    };
  }, [authUser]);

  return (
    <>
      <Toaster />
      <div className="flex h-screen w-full overflow-hidden bg-background relative particles">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-glow"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse-glow"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse-glow"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>
        {/* Sidebar - hidden on mobile */}
        <div className="hidden md:flex flex-col w-64 border-r bg-glass border-glow shadow-neon z-20 relative overflow-hidden">
          {/* Sidebar gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
          <div className="p-4 border-b border-primary/20 relative z-10">
            <div className="flex items-center space-x-2">
              <img
                src="/onesync-logo-white.png"
                alt="OneSync Logo"
                className="h-8 w-auto mr-2 drop-shadow-lg"
                onError={(e) => {
                  console.error("❌ [LOGO] Failed to load logo:", e);
                  console.error("❌ [LOGO] Image src:", e.currentTarget.src);
                  console.error("❌ [LOGO] Current URL:", window.location.href);
                  console.error(
                    "❌ [LOGO] Base URL:",
                    import.meta.env.BASE_URL,
                  );
                  console.error("❌ [LOGO] Trying alternative path...");
                  // Try alternative paths
                  const altPaths = [
                    `${import.meta.env.BASE_URL}onesync-logo-white.png`,
                    `./onesync-logo-white.png`,
                    `${window.location.origin}/onesync-logo-white.png`,
                  ];
                  let pathIndex = 0;
                  const tryNextPath = () => {
                    if (pathIndex < altPaths.length) {
                      console.log(
                        `❌ [LOGO] Trying path ${pathIndex + 1}:`,
                        altPaths[pathIndex],
                      );
                      e.currentTarget.src = altPaths[pathIndex];
                      pathIndex++;
                    } else {
                      console.error("❌ [LOGO] All paths failed, hiding logo");
                      e.currentTarget.style.display = "none";
                    }
                  };
                  e.currentTarget.onerror = tryNextPath;
                  tryNextPath();
                }}
                onLoad={() =>
                  console.log(
                    "✅ [LOGO] Logo loaded successfully from:",
                    (
                      document.querySelector(
                        'img[alt="OneSync Logo"]',
                      ) as HTMLImageElement | null
                    )?.src,
                  )
                }
              />
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-6 relative z-10">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                OVERVIEW
              </p>
              <div className="space-y-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={
                          activeTab === "dashboard" ? "default" : "ghost"
                        }
                        className="w-full justify-start hover-lift transition-all duration-300 hover:shadow-glow hover:bg-primary/10"
                        onClick={() => {
                          setActiveTab("dashboard");
                          // Scroll to top immediately
                          setTimeout(() => {
                            const mainContent = document.querySelector(
                              "main.overflow-y-auto",
                            );
                            if (mainContent) {
                              mainContent.scrollTo({
                                top: 0,
                                behavior: "smooth",
                              });
                            }
                          }, 50);
                        }}
                      >
                        <Home className="mr-2 h-4 w-4" />
                        Dashboard
                      </Button>
                    </TooltipTrigger>
                    <TooltipContentEnhanced side="right">
                      View your music performance metrics
                    </TooltipContentEnhanced>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={
                          activeTab === "analytics" ? "default" : "ghost"
                        }
                        className="w-full justify-start hover-lift transition-all duration-300 hover:shadow-glow hover:bg-primary/10"
                        onClick={() => {
                          setActiveTab("analytics");
                          // Scroll to top immediately
                          setTimeout(() => {
                            const mainContent = document.querySelector(
                              "main.overflow-y-auto",
                            );
                            if (mainContent) {
                              mainContent.scrollTo({
                                top: 0,
                                behavior: "smooth",
                              });
                            }
                          }, 50);
                        }}
                      >
                        <BarChart2 className="mr-2 h-4 w-4" />
                        Analytics
                      </Button>
                    </TooltipTrigger>
                    <TooltipContentEnhanced side="right">
                      Detailed performance insights
                    </TooltipContentEnhanced>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                CONTENT
              </p>
              <div className="space-y-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={activeTab === "music" ? "default" : "ghost"}
                        className="w-full justify-start hover-lift transition-all duration-300 hover:shadow-glow hover:bg-primary/10"
                        onClick={() => {
                          setActiveTab("music");
                          // Scroll to top immediately
                          setTimeout(() => {
                            const mainContent = document.querySelector(
                              "main.overflow-y-auto",
                            );
                            if (mainContent) {
                              mainContent.scrollTo({
                                top: 0,
                                behavior: "smooth",
                              });
                            }
                          }, 50);
                        }}
                      >
                        <Music className="mr-2 h-4 w-4" />
                        My Releases
                      </Button>
                    </TooltipTrigger>
                    <TooltipContentEnhanced side="right">
                      Manage your music catalog
                    </TooltipContentEnhanced>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={activeTab === "beats" ? "default" : "ghost"}
                        className="w-full justify-start hover-lift transition-all duration-300 hover:shadow-glow hover:bg-primary/10"
                        onClick={() => {
                          setActiveTab("beats");
                          // Scroll to top immediately
                          setTimeout(() => {
                            const mainContent = document.querySelector(
                              "main.overflow-y-auto",
                            );
                            if (mainContent) {
                              mainContent.scrollTo({
                                top: 0,
                                behavior: "smooth",
                              });
                            }
                          }, 50);
                        }}
                      >
                        <Layers className="mr-2 h-4 w-4" />
                        Beat Store
                      </Button>
                    </TooltipTrigger>
                    <TooltipContentEnhanced side="right">
                      Browse and purchase beats
                    </TooltipContentEnhanced>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={
                          activeTab === "ai-mastering" ? "web3" : "ghost"
                        }
                        className={`w-full justify-start relative overflow-hidden group transition-all duration-300 hover-lift ${
                          activeTab === "ai-mastering"
                            ? "shadow-neon border-primary/50 bg-gradient-web3"
                            : "hover:shadow-cyber hover:border-primary/30 hover:bg-primary/10"
                        }`}
                        onClick={() => {
                          setActiveTab("ai-mastering");
                          // Scroll to top immediately
                          setTimeout(() => {
                            const mainContent = document.querySelector(
                              "main.overflow-y-auto",
                            );
                            if (mainContent) {
                              mainContent.scrollTo({
                                top: 0,
                                behavior: "smooth",
                              });
                            }
                          }, 50);
                        }}
                      >
                        <Zap className="mr-2 h-4 w-4 text-primary group-hover:animate-pulse" />
                        AI Mastering
                        <span className="ml-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full px-2 py-0.5 font-bold shadow-glow animate-pulse">
                          NEW
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContentEnhanced side="right">
                      AI-powered audio mastering and enhancement
                    </TooltipContentEnhanced>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                BUSINESS
              </p>
              <div className="space-y-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={activeTab === "earnings" ? "default" : "ghost"}
                        className="w-full justify-start hover-lift transition-all duration-300 hover:shadow-glow hover:bg-primary/10"
                        onClick={() => {
                          setActiveTab("earnings");
                          // Scroll to top immediately
                          setTimeout(() => {
                            const mainContent = document.querySelector(
                              "main.overflow-y-auto",
                            );
                            if (mainContent) {
                              mainContent.scrollTo({
                                top: 0,
                                behavior: "smooth",
                              });
                            }
                          }, 50);
                        }}
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Earnings
                      </Button>
                    </TooltipTrigger>
                    <TooltipContentEnhanced side="right">
                      Manage your revenue and payments
                    </TooltipContentEnhanced>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={
                          activeTab === "contracts" ? "default" : "ghost"
                        }
                        className="w-full justify-start hover-lift transition-all duration-300 hover:shadow-glow hover:bg-primary/10"
                        onClick={() => {
                          setActiveTab("contracts");
                          // Scroll to top immediately
                          setTimeout(() => {
                            const mainContent = document.querySelector(
                              "main.overflow-y-auto",
                            );
                            if (mainContent) {
                              mainContent.scrollTo({
                                top: 0,
                                behavior: "smooth",
                              });
                            }
                          }, 50);
                        }}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Contracts
                      </Button>
                    </TooltipTrigger>
                    <TooltipContentEnhanced side="right">
                      View and manage your agreements
                    </TooltipContentEnhanced>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={activeTab === "artists" ? "default" : "ghost"}
                        className="w-full justify-start hover-lift transition-all duration-300 hover:shadow-glow hover:bg-primary/10"
                        onClick={() => {
                          setActiveTab("artists");
                          // Scroll to top immediately
                          setTimeout(() => {
                            const mainContent = document.querySelector(
                              "main.overflow-y-auto",
                            );
                            if (mainContent) {
                              mainContent.scrollTo({
                                top: 0,
                                behavior: "smooth",
                              });
                            }
                          }, 50);
                        }}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Artists List
                      </Button>
                    </TooltipTrigger>
                    <TooltipContentEnhanced side="right">
                      Manage your artist database
                    </TooltipContentEnhanced>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={activeTab === "settings" ? "default" : "ghost"}
                        className="w-full justify-start hover-lift transition-all duration-300 hover:shadow-glow hover:bg-primary/10"
                        onClick={() => {
                          setActiveTab("settings");
                          // Scroll to top immediately
                          setTimeout(() => {
                            const mainContent = document.querySelector(
                              "main.overflow-y-auto",
                            );
                            if (mainContent) {
                              mainContent.scrollTo({
                                top: 0,
                                behavior: "smooth",
                              });
                            }
                          }, 50);
                        }}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Button>
                    </TooltipTrigger>
                    <TooltipContentEnhanced side="right">
                      Configure your account preferences
                    </TooltipContentEnhanced>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </nav>

          <div className="p-4 border-t border-primary/20 mt-auto relative z-10">
            <div className="flex items-center bg-glass-light rounded-lg p-3 hover-lift">
              <Avatar className="h-9 w-9 ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40 text-primary-foreground font-bold">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium text-gradient-static">
                  {user.name}
                </p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile sidebar */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="text-2xl font-bold text-primary flex items-center">
                <img
                  src="/onesync-logo-white.png"
                  alt="OneSync Logo"
                  className="h-5 w-auto mr-2"
                  onError={(e) => {
                    console.error(
                      "❌ [MOBILE LOGO] Failed to load mobile logo:",
                      e,
                    );
                    console.error(
                      "❌ [MOBILE LOGO] Image src:",
                      e.currentTarget.src,
                    );
                    console.error(
                      "❌ [MOBILE LOGO] Current URL:",
                      window.location.href,
                    );
                    console.error(
                      "❌ [MOBILE LOGO] Base URL:",
                      import.meta.env.BASE_URL,
                    );
                    console.error(
                      "❌ [MOBILE LOGO] Trying alternative path...",
                    );
                    // Try alternative paths
                    const altPaths = [
                      `${import.meta.env.BASE_URL}onesync-logo-white.png`,
                      `./onesync-logo-white.png`,
                      `${window.location.origin}/onesync-logo-white.png`,
                    ];
                    let pathIndex = 0;
                    const tryNextPath = () => {
                      if (pathIndex < altPaths.length) {
                        console.log(
                          `❌ [MOBILE LOGO] Trying path ${pathIndex + 1}:`,
                          altPaths[pathIndex],
                        );
                        e.currentTarget.src = altPaths[pathIndex];
                        pathIndex++;
                      } else {
                        console.error(
                          "❌ [MOBILE LOGO] All paths failed, hiding logo",
                        );
                        e.currentTarget.style.display = "none";
                      }
                    };
                    e.currentTarget.onerror = tryNextPath;
                    tryNextPath();
                  }}
                  onLoad={() =>
                    console.log(
                      "✅ [MOBILE LOGO] Mobile logo loaded successfully from:",
                      (
                        document.querySelector(
                          'img[alt="OneSync Logo"]',
                        ) as HTMLImageElement | null
                      )?.src,
                    )
                  }
                />
              </SheetTitle>
            </SheetHeader>

            <nav className="flex-1 p-4 space-y-6">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                  OVERVIEW
                </p>
                <div className="space-y-1">
                  <Button
                    variant={activeTab === "dashboard" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("dashboard");
                      setIsMobileMenuOpen(false);
                      // Scroll to top immediately
                      setTimeout(() => {
                        const mainContent = document.querySelector(
                          "main.overflow-y-auto",
                        );
                        if (mainContent) {
                          mainContent.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }, 50);
                    }}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                  <Button
                    variant={activeTab === "analytics" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("analytics");
                      setIsMobileMenuOpen(false);
                      // Scroll to top immediately
                      setTimeout(() => {
                        const mainContent = document.querySelector(
                          "main.overflow-y-auto",
                        );
                        if (mainContent) {
                          mainContent.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }, 50);
                    }}
                  >
                    <BarChart2 className="mr-2 h-4 w-4" />
                    Analytics
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                  CONTENT
                </p>
                <div className="space-y-1">
                  <Button
                    variant={activeTab === "music" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("music");
                      setIsMobileMenuOpen(false);
                      // Scroll to top immediately
                      setTimeout(() => {
                        const mainContent = document.querySelector(
                          "main.overflow-y-auto",
                        );
                        if (mainContent) {
                          mainContent.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }, 50);
                    }}
                  >
                    <Music className="mr-2 h-4 w-4" />
                    My Releases
                  </Button>
                  <Button
                    variant={activeTab === "beats" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("beats");
                      setIsMobileMenuOpen(false);
                      // Scroll to top immediately
                      setTimeout(() => {
                        const mainContent = document.querySelector(
                          "main.overflow-y-auto",
                        );
                        if (mainContent) {
                          mainContent.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }, 50);
                    }}
                  >
                    <Layers className="mr-2 h-4 w-4" />
                    Beat Store
                    <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5">
                      New
                    </span>
                  </Button>
                  <Button
                    variant={activeTab === "ai-mastering" ? "web3" : "ghost"}
                    className={`w-full justify-start relative overflow-hidden group transition-all duration-300 ${
                      activeTab === "ai-mastering"
                        ? "shadow-neon border-primary/50 bg-gradient-web3"
                        : "hover:shadow-cyber hover:border-primary/30"
                    }`}
                    onClick={() => {
                      setActiveTab("ai-mastering");
                      setIsMobileMenuOpen(false);
                      // Scroll to top immediately
                      setTimeout(() => {
                        const mainContent = document.querySelector(
                          "main.overflow-y-auto",
                        );
                        if (mainContent) {
                          mainContent.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }, 50);
                    }}
                  >
                    <Zap className="mr-2 h-4 w-4 text-primary group-hover:animate-pulse" />
                    AI Mastering
                    <span className="ml-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full px-2 py-0.5 font-bold shadow-glow animate-pulse">
                      NEW
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                  BUSINESS
                </p>
                <div className="space-y-1">
                  <Button
                    variant={activeTab === "earnings" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("earnings");
                      setIsMobileMenuOpen(false);
                      // Scroll to top immediately
                      setTimeout(() => {
                        const mainContent = document.querySelector(
                          "main.overflow-y-auto",
                        );
                        if (mainContent) {
                          mainContent.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }, 50);
                    }}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Earnings
                  </Button>
                  <Button
                    variant={activeTab === "contracts" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("contracts");
                      setIsMobileMenuOpen(false);
                      // Scroll to top immediately
                      setTimeout(() => {
                        const mainContent = document.querySelector(
                          "main.overflow-y-auto",
                        );
                        if (mainContent) {
                          mainContent.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }, 50);
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Contracts
                  </Button>
                  <Button
                    variant={activeTab === "artists" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("artists");
                      setIsMobileMenuOpen(false);
                      // Scroll to top immediately
                      setTimeout(() => {
                        const mainContent = document.querySelector(
                          "main.overflow-y-auto",
                        );
                        if (mainContent) {
                          mainContent.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }, 50);
                    }}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Artists List
                  </Button>

                  <Button
                    variant={activeTab === "settings" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("settings");
                      setIsMobileMenuOpen(false);
                      // Scroll to top immediately
                      setTimeout(() => {
                        const mainContent = document.querySelector(
                          "main.overflow-y-auto",
                        );
                        if (mainContent) {
                          mainContent.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }, 50);
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </div>
              </div>
            </nav>

            <div className="p-4 border-t mt-auto">
              <div className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="border-b border-primary/20 bg-glass shadow-neon sticky top-0 z-30 backdrop-blur-xl">
            {/* Header gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
            <div className="flex h-16 items-center px-4 relative z-10">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>

              <div className="hidden md:flex items-center ml-2 lg:ml-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="h-9 w-40 lg:w-64 rounded-md border border-primary/30 bg-glass px-3 py-1 text-sm shadow-glow transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:shadow-neon pl-8 hover:border-primary/50"
                  />
                  <svg
                    className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </div>
              </div>

              <div className="ml-auto flex items-center space-x-2 sm:space-x-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative hover:bg-primary/10 hover:shadow-glow transition-all duration-300 z-50"
                    >
                      <Bell className="h-5 w-5" />
                      {totalUnreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs flex items-center justify-center font-medium pointer-events-none animate-pulse shadow-glow">
                          {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="w-[90vw] sm:w-80 md:w-96 p-0 z-50"
                    sideOffset={8}
                  >
                    <div className="space-y-2">
                      {intercomUnreadCount > 0 && (
                        <div className="p-4 border-b bg-muted/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Bell className="w-4 h-4 text-blue-500" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  Support Messages
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {intercomUnreadCount} unread message
                                  {intercomUnreadCount !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log("Intercom View button clicked");
                                try {
                                  if (
                                    typeof window !== "undefined" &&
                                    window.Intercom
                                  ) {
                                    window.Intercom("show");
                                  } else {
                                    (Intercom as any)("show");
                                  }
                                  // Refresh unread count after opening
                                  setTimeout(() => {
                                    setIntercomUnreadCount(0);
                                  }, 1000);
                                } catch (error) {
                                  console.error(
                                    "Failed to open Intercom:",
                                    error,
                                  );
                                }
                              }}
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      )}
                      <NotificationCenter
                        onNotificationUpdate={(newNotifications) => {
                          setNotifications(newNotifications);
                        }}
                        onNavigate={(tab) => {
                          setActiveTab(tab);
                          // Close the popover by clicking outside
                          const popoverTrigger = document.querySelector(
                            '[data-state="open"]',
                          );
                          if (popoverTrigger) {
                            (popoverTrigger as HTMLElement).click();
                          }
                          // Scroll to top after navigation
                          setTimeout(() => {
                            const mainContent = document.querySelector(
                              "main.overflow-y-auto",
                            );
                            if (mainContent) {
                              mainContent.scrollTo({
                                top: 0,
                                behavior: "smooth",
                              });
                            }
                          }, 100);
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-primary/10 hover:shadow-glow transition-all duration-300"
                >
                  <Share2 className="h-5 w-5" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full hover:shadow-glow transition-all duration-300"
                    >
                      <Avatar className="h-8 w-8 ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40 text-primary-foreground font-bold">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <div className="flex items-center px-2 py-2">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setActiveTab("settings")}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab("settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main content area */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-40 min-h-0 relative">
            {/* Content background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/2 to-transparent pointer-events-none"></div>
            {/* Breadcrumb */}
            <div className="flex items-center justify-between mb-4 bg-glass p-4 rounded-xl border-glow shadow-neon animate-slide-up relative z-10">
              <div className="flex items-center">
                <span className="text-lg font-bold text-gradient">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </span>
              </div>
              <Dialog
                open={isUploadDialogOpen}
                onOpenChange={setIsUploadDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="web3"
                    className="flex items-center gap-2 hover-lift shadow-glow hover:shadow-neon transition-all duration-300"
                    data-upload-trigger
                  >
                    <Plus className="h-4 w-4" />
                    Upload a Release
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Upload New Music</DialogTitle>
                    <DialogDescription>
                      Upload your tracks and set up distribution details.
                    </DialogDescription>
                  </DialogHeader>
                  <MusicUploader
                    onComplete={() => {
                      console.log("🎵 [HOME] Upload completed, closing dialog");
                      setIsUploadDialogOpen(false);
                      setActiveTab("music");
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center animate-fade-in">
                  <div className="relative">
                    <img
                      src="/spinning-loader.png"
                      alt="Loading"
                      className="h-16 w-16 animate-spin brightness-150 mb-6 drop-shadow-lg"
                    />
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                  </div>
                  <p className="text-muted-foreground text-lg font-medium">
                    Loading your dashboard...
                  </p>
                  <div className="mt-4 flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {showWelcomeBanner && (
                  <WelcomeBanner
                    onDismiss={() => setShowWelcomeBanner(false)}
                  />
                )}
                <div className="w-full overflow-hidden animate-fade-in relative z-10">
                  {activeTab === "dashboard" && <DashboardOverview />}
                  {activeTab === "analytics" && <AnalyticsCharts />}

                  {activeTab === "music" && <ReleasesManager />}
                  {activeTab === "beats" && (
                    <div className="space-y-8 max-w-4xl mx-auto">
                      {/* Header Section */}
                      <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                          <Music className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                          Beat Store
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                          A curated marketplace for premium beats and
                          instrumentals
                        </p>
                      </div>

                      {/* Status Card */}
                      <Card className="border-2 border-dashed border-border/50">
                        <CardContent className="p-8 text-center">
                          <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm font-medium">
                              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                              In Development
                            </div>

                            <div className="space-y-2">
                              <h3 className="text-2xl font-semibold">
                                Coming Soon
                              </h3>
                              <p className="text-muted-foreground max-w-md mx-auto">
                                We're building something special. A professional
                                beat marketplace that connects artists with
                                top-tier producers.
                              </p>
                            </div>

                            <div className="flex justify-center">
                              <Button
                                size="lg"
                                className="gap-2"
                                onClick={() => {
                                  try {
                                    if (
                                      typeof window !== "undefined" &&
                                      window.Intercom
                                      ) {
                                        window.Intercom(
                                          "showNewMessage",
                                          "Hi! I'd like to be notified when the Beat Store launches. Please add me to the notification list.",
                                        );
                                      } else {
                                        (Intercom as any)(
                                          "showNewMessage",
                                          "Hi! I'd like to be notified when the Beat Store launches. Please add me to the notification list.",
                                        );
                                    }
                                  } catch (error) {
                                    console.error(
                                      "Failed to open Intercom:",
                                      error,
                                    );
                                    // Fallback to alert if Intercom fails
                                    alert(
                                      "Thanks for your interest! We'll notify you when the Beat Store launches.",
                                    );
                                  }
                                }}
                              >
                                <Bell className="w-4 h-4" />
                                Get Notified
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Features Grid */}
                      <div className="grid md:grid-cols-3 gap-6">
                        <Card>
                          <CardContent className="p-6">
                            <div className="space-y-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-primary" />
                              </div>
                              <h4 className="font-semibold">Instant Preview</h4>
                              <p className="text-sm text-muted-foreground">
                                High-quality audio previews with waveform
                                visualization
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-6">
                            <div className="space-y-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Layers className="w-5 h-5 text-primary" />
                              </div>
                              <h4 className="font-semibold">Stem Downloads</h4>
                              <p className="text-sm text-muted-foreground">
                                Individual track stems for complete creative
                                control
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-6">
                            <div className="space-y-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Globe className="w-5 h-5 text-primary" />
                              </div>
                              <h4 className="font-semibold">Global Network</h4>
                              <p className="text-sm text-muted-foreground">
                                Connect with producers and artists worldwide
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Progress Section */}
                      <Card>
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">
                                Development Progress
                              </h4>
                              <span className="text-sm text-muted-foreground">
                                75%
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all duration-1000"
                                style={{ width: "75%" }}
                              ></div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-muted-foreground">
                                  UI Design
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-muted-foreground">
                                  Audio Engine
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                <span className="text-muted-foreground">
                                  Payments
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-muted"></div>
                                <span className="text-muted-foreground">
                                  Launch
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  {activeTab === "ai-mastering" && (
                    <div className="w-full">
                      <AIMasteringInterface />
                    </div>
                  )}
                  {activeTab === "earnings" && <EarningsManager />}
                  {activeTab === "contracts" && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Contracts</h1>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          New Contract
                        </Button>
                      </div>
                      <Tabs defaultValue="active">
                        <TabsList>
                          <TabsTrigger value="active">Active</TabsTrigger>
                          <TabsTrigger value="pending">Pending</TabsTrigger>
                          <TabsTrigger value="archived">Archived</TabsTrigger>
                        </TabsList>
                        <TabsContent value="active" className="mt-4">
                          <div className="text-center py-12">
                            <p className="text-muted-foreground mb-4">
                              No active contracts
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Active contracts will appear here when available
                            </p>
                          </div>
                        </TabsContent>
                        <TabsContent value="pending" className="mt-4">
                          <div className="text-center py-12">
                            <p className="text-muted-foreground mb-4">
                              No pending contracts
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Pending contracts will appear here when available
                            </p>
                          </div>
                        </TabsContent>
                        <TabsContent value="archived" className="mt-4">
                          <div className="text-center py-12">
                            <p className="text-muted-foreground mb-4">
                              No archived contracts
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Archived contracts will appear here when available
                            </p>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                  {activeTab === "artists" && <ArtistManager />}

                  {activeTab === "settings" && <SettingsPage />}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default HomePage;
