import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Home,
  ArrowLeft,
  Music,
  BarChart2,
  DollarSign,
  Upload,
  Headphones,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        <Card className="text-center border-2 shadow-2xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="pb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mx-auto mb-6 relative"
            >
              <div className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                404
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-4 -right-4 text-primary/30"
              >
                <Music className="h-8 w-8" />
              </motion.div>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-2 -left-4 text-primary/20"
              >
                <Headphones className="h-6 w-6" />
              </motion.div>
            </motion.div>
            <CardTitle className="text-3xl md:text-4xl mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Page Not Found
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground max-w-md mx-auto">
              Looks like this page hit a wrong note. Let's get you back to your
              music journey.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pb-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Button
                onClick={() => navigate("/")}
                size="lg"
                className="flex items-center gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
              >
                <Home className="h-5 w-5" />
                Back to Dashboard
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 border-2"
              >
                <ArrowLeft className="h-5 w-5" />
                Go Back
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="space-y-4"
            >
              <p className="text-sm font-medium text-muted-foreground">
                🎵 Popular destinations:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center gap-2 p-4 h-auto flex-col hover:bg-primary/10 border border-transparent hover:border-primary/20 rounded-lg transition-all"
                >
                  <BarChart2 className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Analytics</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/upload")}
                  className="flex items-center gap-2 p-4 h-auto flex-col hover:bg-primary/10 border border-transparent hover:border-primary/20 rounded-lg transition-all"
                >
                  <Upload className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Upload Music</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/earnings")}
                  className="flex items-center gap-2 p-4 h-auto flex-col hover:bg-primary/10 border border-transparent hover:border-primary/20 rounded-lg transition-all"
                >
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Earnings</span>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-xs text-muted-foreground border-t pt-4"
            >
              Need help? Our support team is here to assist you with your music
              distribution journey.
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default NotFound;
