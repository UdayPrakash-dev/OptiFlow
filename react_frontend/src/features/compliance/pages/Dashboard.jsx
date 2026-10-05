import React, { useState, useEffect } from "react";
import { apiClient } from "../../../services/api/client";
import { useAuth } from "../../../context/AuthContext";

export default function ComplianceDashboard() {
  const { user } = useAuth();

  // State to hold our dashboard numbers
  const [metrics, setMetrics] = useState({
    totalRules: 0,
    activeViolations: 0,
    resolvedViolations: 0,
  });

  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  // 1. FETCH DATA ON LOAD
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // TODO: We don't have a specific /metrics endpoint yet.
        // Instead, make TWO calls using apiClient():
        // call 1: '/compliance-rules'
        // call 2: '/compliance-violations'
        // TODO: Count them!
        // activeViolations = filter the violations array where status === 'Open'
        // resolvedViolations = filter the violations array where status === 'Resolved'
        // TODO: Update setMetrics(...) with your counts.
      } catch (error) {
        console.error("Failed to load metrics", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // 2. RUN THE AUTOMATED ENGINE
  const triggerScan = async () => {
    setIsScanning(true);
    try {
      // TODO: Use apiClient to make a POST request to '/compliance-rules/run-engine'
      // TODO: Alert the user with the result (e.g. alert("Engine finished!"))
      // TODO: (Bonus) Re-run the logic from fetchDashboardData() here so the numbers update instantly!
    } catch (error) {
      alert("Scan failed: " + error.message);
    } finally {
      setIsScanning(false);
    }
  };

  // 3. UI RENDERING
  if (loading) {
    // TODO: Add a nice Tailwind spinner or skeleton loader here
    return <div>Loading compliance engine...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          {/* TODO: Add Tailwind classes to make this look like a solid page header */}
          <h1>Compliance Command Center</h1>
          <p>Automated engine status and active flags.</p>
        </div>

        {/* TODO: Add Tailwind classes to make this look like a primary action button */}
        <button onClick={triggerScan} disabled={isScanning}>
          {isScanning ? "Running Engine..." : "Run Automated Scan"}
        </button>
      </div>

      {/* TODO: Convert this to a CSS Grid (e.g. grid grid-cols-1 md:grid-cols-3 gap-6) */}
      <div>
        {/* Metric Card 1: Total Rules */}
        <div>
          <h3>Active Rules Monitored</h3>
          <div>{metrics.totalRules}</div>
        </div>

        {/* Metric Card 2: Active Violations */}
        {/* TODO: Make the border/text RED to signify danger if activeViolations > 0 */}
        <div>
          <h3>Automated Flags (Open)</h3>
          <div>{metrics.activeViolations}</div>
        </div>

        {/* Metric Card 3: Resolved Violations */}
        {/* TODO: Make the border/text GREEN to signify safety */}
        <div>
          <h3>Resolved Violations</h3>
          <div>{metrics.resolvedViolations}</div>
        </div>
      </div>
    </div>
  );
}
