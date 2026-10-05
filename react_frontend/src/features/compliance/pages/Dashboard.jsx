 import React, { useState, useEffect } from 'react';                                                                                                             
    import { apiClient } from '../../../services/api/client';                                                                                                       
    import { useAuth } from '../../../context/AuthContext';                                                                                                         
                                                                                                                                                                    
    export default function ComplianceDashboard() {                                                                                                                 
      const { user } = useAuth();                                                                                                                                   
                                                                                                                                                                    
      // State for our UI metrics                                                                                                                                   
      const [metrics, setMetrics] = useState({                                                                                                                      
        totalRules: 0,                                                                                                                                              
        activeViolations: 0,                                                                                                                                        
        resolvedViolations: 0                                                                                                                                       
      });                                                                                                                                                           
                                                                                                                                                                    
      const [loading, setLoading] = useState(true);                                                                                                                 
      const [isScanning, setIsScanning] = useState(false);                                                                                                          
                                                                                                                                                                    
      useEffect(() => {                                                                                                                                             
        // TODO: Write an async function to fetch data from '/compliance/metrics'                                                                                   
        // (If the backend doesn't have a /metrics route yet, you can fetch from /compliance-rules and /compliance-violations and do the math!)                     
        // 1. Use apiClient to fetch the data                                                                                                                       
        // 2. setMetrics with the lengths of the arrays                                                                                                             
        // 3. setLoading to false                                                                                                                                   
      }, []);                                                                                                                                                       
                                                                                                                                                                    
      // Here is where we hook into the backend engine I just built!                                                                                                
      const triggerScan = async () => {                                                                                                                             
        setIsScanning(true);                                                                                                                                        
        try {                                                                                                                                                       
          // TODO: Use apiClient to POST to '/compliance-rules/run-engine'                                                                                          
          // 1. Await the response                                                                                                                                  
          // 2. Show an alert() with response.message (e.g. "Found 3 new violations!")                                                                              
          // 3. Re-fetch your metrics so the dashboard updates                                                                                                      
        } catch (error) {                                                                                                                                           
          alert("Scan failed: " + error.message);                                                                                                                   
        } finally {                                                                                                                                                 
          setIsScanning(false);                                                                                                                                     
        }                                                                                                                                                           
      };                                                                                                                                                            
                                                                                                                                                                    
      if (loading) {                                                                                                                                                
        // TODO: Style this loading state to look professional                                                                                                      
        return <div>Loading compliance engine...</div>;                                                                                                             
      }                                                                                                                                                             
                                                                                                                                                                    
      return (                                                                                                                                                      
        <div className="p-6">                                                                                                                                       
          <div className="flex justify-between items-center mb-8">                                                                                                  
            <div>                                                                                                                                                   
              {/* TODO: Style this heading to match the app (e.g., text-2xl font-bold text-slate-800) */}                                                           
              <h1>Compliance Command Center</h1>                                                                                                                    
              <p className="text-gray-500">Automated engine status and active flags.</p>                                                                            
            </div>                                                                                                                                                  
                                                                                                                                                                    
            {/* Manual Trigger Button */}                                                                                                                           
            <button                                                                                                                                                 
              onClick={triggerScan}                                                                                                                                 
              disabled={isScanning}                                                                                                                                 
              className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:bg-blue-300"                                                    
            >                                                                                                                                                       
              {isScanning ? 'Running Engine...' : 'Run Automated Scan'}                                                                                             
            </button>                                                                                                                                               
          </div>                                                                                                                                                    
                                                                                                                                                                    
          {/* TODO: Create a CSS Grid here with 3 columns (grid-cols-1 md:grid-cols-3) */}                                                                          
          <div className="grid gap-6">                                                                                                                              
                                                                                                                                                                    
            {/* Metric Card 1 */}                                                                                                                                   
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">                                                                                 
              <h3 className="text-sm font-medium text-gray-500">Active Rules Monitored</h3>                                                                         
              {/* TODO: Display metrics.totalRules here in a large, bold font */}                                                                                   
              <div className="text-3xl font-bold mt-2">{metrics.totalRules}</div>                                                                                   
            </div>                                                                                                                                                  
  
            {/* Metric Card 2 */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 border-l-4 border-l-red-500">
              <h3 className="text-sm font-medium text-gray-500">Automated Flags (Open)</h3>
              {/* TODO: Display metrics.activeViolations here. */}
              <div className="text-3xl font-bold mt-2 text-red-600">{metrics.activeViolations}</div>
            </div>
  
            {/* Metric Card 3 */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 border-l-4 border-l-green-500">
              <h3 className="text-sm font-medium text-gray-500">Resolved Violations</h3>
              {/* TODO: Display metrics.resolvedViolations here */}
              <div className="text-3xl font-bold mt-2 text-green-600">{metrics.resolvedViolations}</div>
            </div>
  
          </div>
        </div>
      );
    }