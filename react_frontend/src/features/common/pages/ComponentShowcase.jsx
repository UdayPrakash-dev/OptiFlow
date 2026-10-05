import React, { useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';
import { StatCard } from '../../../shared/components/StatCard';
import { Loader } from '../../../shared/components/Loader';
import { EmptyState } from '../../../shared/components/EmptyState';
import { FileUpload } from '../../../shared/components/FileUpload';
import { FormField, Input, Select, Textarea } from '../../../shared/components/FormField';
import { Modal } from '../../../shared/components/Modal';
import { Toast } from '../../../shared/components/Toast';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';

// WHY: A centralized showcase allows developers and designers to see all available 
// UI components in one place, ensuring consistency and preventing duplicate work.
export default function ComponentShowcase() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState('success');

  const triggerToast = (type) => {
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 bg-white min-h-screen">
      
      <div>
        <h1 className="text-3xl font-bold text-gray-900">OptiFlow UI Kit</h1>
        <p className="text-gray-500 mt-2">Shared components to be used across the application.</p>
      </div>

      {/* Buttons Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Buttons</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="danger">Danger Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="primary" disabled>Disabled Button</Button>
        </div>
      </section>

      {/* Badges Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Badges</h2>
        <div className="flex gap-4 items-center">
          <Badge status="default">Default</Badge>
          <Badge status="info">Info / In Progress</Badge>
          <Badge status="success">Success / Approved</Badge>
          <Badge status="warning">Warning / Pending</Badge>
          <Badge status="danger">Danger / Rejected</Badge>
        </div>
      </section>

      {/* Stat Cards Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Stat Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-lg">
          <StatCard title="Active Projects" value="42" trend="+12%" icon="💼" />
          <StatCard title="Open Violations" value="5" trend="-2%" icon="🚨" />
          <StatCard title="Team Members" value="128" icon="👥" />
        </div>
      </section>

      {/* Form Fields Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Form Fields</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg">
          <FormField label="First Name" required hint="Enter your legal first name">
            <Input placeholder="e.g. John" />
          </FormField>
          <FormField label="Email Address" required error="Invalid email format">
            <Input type="email" placeholder="john@example.com" error />
          </FormField>
          <FormField label="Role">
            <Select options={[{value: 'admin', label: 'Admin'}, {value: 'user', label: 'User'}]} placeholder="Select a role" />
          </FormField>
          <FormField label="Bio">
            <Textarea placeholder="Tell us about yourself..." />
          </FormField>
        </div>
      </section>

      {/* File Upload Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">File Upload</h2>
        <div className="bg-gray-50 p-6 rounded-lg w-full md:w-1/2">
          <FileUpload onFileSelect={(file) => alert(`Selected: ${file.name}`)} />
        </div>
      </section>

      {/* Empty State Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Empty State</h2>
        <div className="bg-gray-50 p-6 rounded-lg">
          <EmptyState 
            title="No violations found" 
            description="You are 100% compliant! There are no open flags that require your attention."
            action={<Button variant="primary">Run New Scan</Button>}
          />
        </div>
      </section>

      {/* Overlays Section (Modals & Toasts) */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Overlays (Modals & Toasts)</h2>
        <div className="flex flex-wrap gap-4 items-center bg-gray-50 p-6 rounded-lg">
          <Button variant="secondary" onClick={() => setIsModalOpen(true)}>Open Standard Modal</Button>
          <Button variant="danger" onClick={() => setIsConfirmOpen(true)}>Open Confirm Dialog</Button>
          
          <Button variant="outline" onClick={() => triggerToast('success')}>Show Success Toast</Button>
          <Button variant="outline" onClick={() => triggerToast('error')}>Show Error Toast</Button>
        </div>

        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title="Create New Rule"
          footer={<Button variant="primary" onClick={() => setIsModalOpen(false)}>Save Rule</Button>}
        >
          <p>This is the standard modal component. You can put forms, text, or anything else inside here!</p>
        </Modal>

        <ConfirmDialog 
          isOpen={isConfirmOpen}
          title="Delete Project"
          message="Are you sure you want to delete this project? This action cannot be undone."
          confirmText="Yes, Delete"
          onConfirm={() => setIsConfirmOpen(false)}
          onCancel={() => setIsConfirmOpen(false)}
        />

        {showToast && <Toast type={toastType} message={`This is a ${toastType} toast message!`} onClose={() => setShowToast(false)} />}
      </section>

      {/* Loaders Section */}
      <section className="space-y-4 pb-20">
        <h2 className="text-xl font-semibold border-b pb-2">Loaders & Feedback</h2>
        <div className="p-6 bg-gray-50 rounded-lg flex flex-col justify-center items-center">
          <p className="text-sm text-gray-500 mb-4 text-center">Standard Loader</p>
          <Loader />
        </div>
      </section>

    </div>
  );
}
