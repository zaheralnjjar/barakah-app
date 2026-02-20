import { TrackingDashboard } from "@/components/tracking/TrackingDashboard";

// This page will be routed to /tracking
export default function TrackingPage() {
    return (
        <div className="min-h-screen bg-background pb-20">
            <TrackingDashboard />
        </div>
    );
}
