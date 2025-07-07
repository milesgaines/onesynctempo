import EarningsManager from "@/components/earnings/EarningsManager";

export default function TrolleyVisualizationStoryboard() {
  return (
    <div className="bg-background p-4">
      <h2 className="text-2xl font-bold mb-4">
        Trolley Integration Visualization
      </h2>
      <p className="mb-6 text-muted-foreground">
        This storyboard shows the Trolley (Route1964) integration in the
        Earnings Manager
      </p>
      <EarningsManager />
    </div>
  );
}
