import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  Check,
  CheckCheck,
  Music,
  DollarSign,
  AlertCircle,
  Info,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "../auth/AuthProvider";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  created_at: string;
  action_url?: string;
}

interface NotificationCenterProps {
  className?: string;
  onNotificationUpdate?: (notifications: Notification[]) => void;
  onNavigate?: (tab: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className = "",
  onNotificationUpdate,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Load real notifications from tracks and earnings
      const { data: tracks } = await supabase
        .from("tracks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      const { data: payments } = await supabase
        .from("payment_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      const generatedNotifications: Notification[] = [];

      // Generate notifications from tracks
      if (tracks) {
        tracks.forEach((track, index) => {
          if (track.status === "live") {
            generatedNotifications.push({
              id: `track-live-${track.id}`,
              title: "Track Now Live",
              message: `Your track "${track.title}" is now available on all selected platforms!`,
              type: "success",
              read: false, // Always show as unread initially
              created_at: track.updated_at || track.created_at,
              action_url: "music", // Navigate to music tab
            });
          } else if (track.status === "processing") {
            generatedNotifications.push({
              id: `track-processing-${track.id}`,
              title: "Track Processing",
              message: `Your track "${track.title}" is being processed for distribution.`,
              type: "info",
              read: false, // Always show as unread initially
              created_at: track.created_at,
              action_url: "music", // Navigate to music tab
            });
          } else if (track.status === "failed") {
            generatedNotifications.push({
              id: `track-failed-${track.id}`,
              title: "Distribution Failed",
              message: `There was an issue distributing "${track.title}". Please check your track details.`,
              type: "error",
              read: false,
              created_at: track.updated_at || track.created_at,
              action_url: "music", // Navigate to music tab
            });
          }
        });
      }

      // Generate notifications from payments
      if (payments) {
        payments.forEach((payment, index) => {
          if (payment.status === "completed") {
            generatedNotifications.push({
              id: `payment-${payment.id}`,
              title: "Payment Received",
              message: `You received ${payment.amount.toFixed(2)} from ${payment.platform}.`,
              type: "success",
              read: false, // Always show as unread initially
              created_at: payment.created_at,
              action_url: "earnings", // Navigate to earnings tab
            });
          }
        });
      }

      // Add welcome notifications if no real notifications
      if (generatedNotifications.length === 0) {
        generatedNotifications.push(
          {
            id: "welcome-1",
            title: "Welcome to OneSync!",
            message:
              "Start by uploading your first track to begin your music distribution journey.",
            type: "info",
            read: false,
            created_at: new Date().toISOString(),
            action_url: "dashboard", // Navigate to dashboard
          },
          {
            id: "welcome-2",
            title: "Complete Your Profile",
            message:
              "Add your artist information and payment details to get started earning.",
            type: "warning",
            read: false,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            action_url: "settings", // Navigate to settings
          },
          {
            id: "welcome-3",
            title: "Explore Analytics",
            message:
              "Check out the analytics section to track your music performance.",
            type: "info",
            read: true,
            created_at: new Date(Date.now() - 7200000).toISOString(),
            action_url: "analytics", // Navigate to analytics
          },
        );
      }

      // Sort by date
      generatedNotifications.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      console.log(
        "🔔 [NOTIFICATIONS] Generated notifications:",
        generatedNotifications.length,
      );
      setNotifications(generatedNotifications);

      // Notify parent component of notification updates
      if (onNotificationUpdate) {
        onNotificationUpdate(generatedNotifications);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = (notificationId: string) => {
    console.log(
      "🔔 [NOTIFICATIONS] Marking notification as read:",
      notificationId,
    );
    setNotifications((prev) => {
      const updated = prev.filter(
        (notification) => notification.id !== notificationId,
      );

      console.log(
        "🔔 [NOTIFICATIONS] Updated notifications count:",
        updated.length,
      );

      // Notify parent component of notification updates
      if (onNotificationUpdate) {
        onNotificationUpdate(updated);
      }

      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated: Notification[] = [];

      // Notify parent component of notification updates
      if (onNotificationUpdate) {
        onNotificationUpdate(updated);
      }

      return updated;
    });
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications((prev) => {
      const updated = prev.filter(
        (notification) => notification.id !== notificationId,
      );

      // Notify parent component of notification updates
      if (onNotificationUpdate) {
        onNotificationUpdate(updated);
      }

      return updated;
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <Check className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const filteredNotifications = notifications.filter((notification) =>
    filter === "all" ? true : !notification.read,
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Card
      className={`w-full max-w-md bg-background shadow-lg hover:shadow-xl transition-shadow ${className}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <CardTitle className="text-lg">Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <div className="flex space-x-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className="text-xs"
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
            className="text-xs"
          >
            Unread ({unreadCount})
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          App notifications only • Support messages in Intercom
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {filter === "unread"
                ? "No unread notifications"
                : "No notifications"}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredNotifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer group ${
                      !notification.read ? "bg-muted/30" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log(
                        "🔔 [NOTIFICATIONS] Notification clicked:",
                        notification.title,
                        "Action URL:",
                        notification.action_url,
                      );

                      // Always remove the notification when clicked
                      markAsRead(notification.id);

                      // Handle notification action if it has an action_url
                      if (notification.action_url && onNavigate) {
                        console.log(
                          "🔔 [NOTIFICATIONS] Navigating to:",
                          notification.action_url,
                        );
                        // Check if it's a tab navigation or external URL
                        if (notification.action_url.startsWith("http")) {
                          window.open(notification.action_url, "_blank");
                        } else {
                          // Navigate to the specified tab
                          onNavigate(notification.action_url);
                        }
                      } else {
                        console.log(
                          "🔔 [NOTIFICATIONS] No action URL or onNavigate callback",
                        );
                      }
                    }}
                  >
                    <div className="flex items-start justify-between space-x-3">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="mt-0.5">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">
                              {notification.title}
                            </p>
                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 ml-2"></div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(
                              notification.created_at,
                            ).toLocaleDateString()}{" "}
                            {new Date(
                              notification.created_at,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {index < filteredNotifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;
