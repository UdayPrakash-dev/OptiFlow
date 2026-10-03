# React Router & Backend Connection: Architecture Guide

This document explains exactly how we wired up React Router in the OptiFlow project, how users navigate between pages, and how those pages actually talk to the backend database.

---

## Part 1: How React Router is Set Up (The UI Paths)

In a traditional website, clicking a link asks the server for a completely new HTML file. In React, we use **React Router** to instantly swap out components on the screen without ever refreshing the page.

Here is the exact flow of how it works in our codebase:

### 1. The Centralized Paths (`paths.js`)
Instead of typing `"/compliance/dashboard"` directly into our links and route files, we created `paths.js`.
```javascript
export const PATHS = {
  COMPLIANCE: {
    DASHBOARD: '/compliance/dashboard',
    EVIDENCE: '/compliance/evidence',
  }
}
```
**Why?** If the backend or product team later decides the URL should be `/comp/home` instead of `/compliance/dashboard`, we only change it in *one single file*.

### 2. Defining the Feature Routes (`app/routes/compliance.jsx`)
For every major actor (Compliance, Executive, HR), we have a dedicated routing file. 
```javascript
const ComplianceDashboard = React.lazy(() => import('../../features/compliance/pages/Dashboard'));

export const complianceRoutes = [
  { path: PATHS.COMPLIANCE.DASHBOARD, element: <ComplianceDashboard /> },
  { path: PATHS.COMPLIANCE.EVIDENCE, element: <ComplianceEvidence /> }
];
```
* **React.lazy**: We use this so the user doesn't download the heavy Dashboard code until they actually try to visit the Dashboard URL.
* **The Array**: We just define a simple list: "When the URL matches this path, render this specific React component."

### 3. The Master Router (`app/router/index.jsx`)
This is the brain of the operation. It gathers all the small feature route arrays (`complianceRoutes`, `executiveRoutes`) and locks them inside **Guards** and **Layouts**.

```javascript
export const router = createBrowserRouter([
  {
    // The Guard: Checks if they are logged in and have the right role
    element: <ProtectedRoute allowedRoles={['company_owner', 'compliance_officer']} />,
    children: [
      {
        // The Layout: Wraps every page inside it with a Sidebar and Header
        element: <DashboardLayout />,
        children: [
          ...complianceRoutes, // Injects the array we made in step 2
          ...executiveRoutes
        ]
      }
    ]
  }
]);
```
Notice the nested `children`. Because `complianceRoutes` are *inside* `DashboardLayout`, which is *inside* `ProtectedRoute`, a user cannot see the compliance dashboard unless they pass the bouncer (the Guard) first. If they pass, the Layout uses a special component called `<Outlet />` to render the actual page content in the middle of the screen.

### 4. Injecting into React (`App.jsx`)
Finally, we hand this massive `router` configuration to React:
```javascript
<RouterProvider router={router} />
```

---

## Part 2: Connecting the Components to the Backend (The Data Paths)

It is crucial to understand that **UI Routes** (what the user sees in their browser address bar, like `/compliance/dashboard`) are completely separate from **Backend API Routes** (where the data lives, like `http://localhost:3000/api/evidence`).

Here is how we connected them:

### 1. The Global Fetcher (`services/api/client.js`)
We created `apiClient`. Every single request to the backend goes through this function. It automatically:
1. Grabs the user's `authToken` from the browser memory.
2. Attaches it to the request headers (`Authorization: Bearer <token>`).
3. Appends the base URL (e.g., `http://localhost:3000/api`).

### 2. The Resource Modules (`services/api/evidence.js`)
Instead of components doing the fetching themselves, we created specialized files for each backend resource.
```javascript
import { apiClient } from './client';

export const getEvidenceList = () => {
  return apiClient('/evidence'); // This actually hits http://localhost:3000/api/evidence
};
```

### 3. Putting it together in the Component
Now, how does the page actually get the data? By using the `useApi` custom hook we created.

Imagine we are building the `Evidence.jsx` page component:
```javascript
import React from 'react';
import { useApi } from '../../../hooks/useApi';
import { getEvidenceList } from '../../../services/api/evidence';
import { Loader } from '../../../shared/components/Loader';

export default function EvidencePage() {
  // 1. The component asks the hook to run our API function
  const { data, loading, error } = useApi(() => getEvidenceList());

  // 2. While the backend is thinking, we show our shared Loader component
  if (loading) return <Loader />;

  // 3. If it failed, we show the error
  if (error) return <div>Error: {error}</div>;

  // 4. If it succeeded, we render the data!
  return (
    <div>
      <h1>Evidence List</h1>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### The Full Lifecycle Summary
1. User clicks a button pointing to `PATHS.COMPLIANCE.EVIDENCE` (`/compliance/evidence`).
2. **React Router** intercepts the click, checks `ProtectedRoute`, sees the user is allowed, and renders `EvidencePage.jsx` inside the `DashboardLayout`.
3. `EvidencePage.jsx` instantly calls the `useApi` hook.
4. The hook calls `getEvidenceList()`.
5. `getEvidenceList()` calls `apiClient('/evidence')`.
6. `apiClient` slaps the auth token on the request and talks to the **Backend Server**.
7. The Backend Server verifies the token, gets the data from the database, and sends it back.
8. The component receives the `data` and displays it on the screen!
