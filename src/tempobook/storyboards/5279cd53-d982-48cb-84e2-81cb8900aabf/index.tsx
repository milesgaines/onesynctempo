import { Button } from "@/components/ui/button";

export default function ThemeVerificationStoryboard() {
  return (
    <div className="bg-background p-8 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Theme Verification</h1>

      <div className="space-y-8">
        <div className="p-6 border border-primary/20 rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-4">Button Variants</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="web3">Web3</Button>
            <Button variant="glow">Glow</Button>
          </div>
        </div>

        <div className="p-6 border border-primary/20 rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-4">Color Samples</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-primary text-primary-foreground rounded-md">
              Primary
            </div>
            <div className="p-4 bg-secondary text-secondary-foreground rounded-md">
              Secondary
            </div>
            <div className="p-4 bg-muted text-muted-foreground rounded-md">
              Muted
            </div>
            <div className="p-4 bg-accent text-accent-foreground rounded-md">
              Accent
            </div>
          </div>
        </div>

        <div className="p-6 border border-primary/20 rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-4">Special Effects</h2>
          <div className="flex flex-wrap gap-4">
            <div className="p-4 bg-glass rounded-md w-40 h-24 flex items-center justify-center">
              Glass Effect
            </div>
            <div className="p-4 shadow-glow rounded-md w-40 h-24 flex items-center justify-center border border-primary/30">
              Glow Shadow
            </div>
            <div className="p-4 shadow-neon rounded-md w-40 h-24 flex items-center justify-center border border-primary/30">
              Neon Shadow
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
