import React, { useState } from 'react';
import { AppNavbar } from './AppNavbar';
import { PageHeader } from './PageHeader';
import { MetricCard } from './MetricCard';
import { CompactBarChart } from './CompactBarChart';
import { CircularTimerChart } from './CircularTimerChart';
import { SegmentedProgressBar } from './SegmentedProgressBar';
import { TaskList, type TaskItemData } from './TaskList';
import { TimelineSchedule } from './TimelineSchedule';
import { UserProfileCard } from './UserProfileCard';
import { AccordionGroup } from './AccordionGroup';
import type { BrandConfig } from '../../types/auth';
import { Sparkles, Layers, Sliders, CheckSquare, Clock, BarChart3, Users } from 'lucide-react';

interface DesignSystemShowcaseProps {
  brandConfig: BrandConfig;
  onNavigateToAuth?: () => void;
}

const SAMPLE_TASKS: TaskItemData[] = [
  { id: '1', title: 'Interview', dateStr: 'Sep 13, 08:30', completed: true },
  { id: '2', title: 'Team Meeting', dateStr: 'Sep 13, 10:30', completed: true },
  { id: '3', title: 'Project Update', dateStr: 'Sep 13, 15:00', completed: false },
  { id: '4', title: 'Discuss Q3 Goals', dateStr: 'Sep 13, 16:45', completed: false },
  { id: '5', title: 'HR Policy Review', dateStr: 'Sep 13, 16:30', completed: false },
];

const ACCORDION_ITEMS = [
  { id: 'pension', title: 'Pension contributions', previewText: 'Tier 1 Defined Benefit contribution: 6.5% employee / 9.5% employer matched.' },
  {
    id: 'devices',
    title: 'Devices',
    devicePreview: {
      model: 'MacBook Air',
      version: 'Version M1 (Internal Asset #4829)',
    },
  },
  { id: 'compensation', title: 'Compensation Summary', previewText: 'Base bi-weekly allocation: $1,200.00 with health allowance.' },
  { id: 'benefits', title: 'Employee Benefits', previewText: 'Comprehensive Medical, Vision, Dental & 24/7 Employee Assistance Program.' },
];

export const DesignSystemShowcase: React.FC<DesignSystemShowcaseProps> = ({
  brandConfig,
  onNavigateToAuth,
}) => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [tasks, setTasks] = useState<TaskItemData[]>(SAMPLE_TASKS);
  const [viewMode, setViewMode] = useState<'composite' | 'tokens'>('composite');

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Top Banner with view switcher & return to Auth Portal */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D9B66F]" />
            <span className="font-semibold text-[var(--text-primary)]">
              Design System Preview
            </span>
            <span className="text-[var(--text-muted)]">·</span>
            <span className="text-[var(--text-secondary)]">
              Enterprise Work Management Foundation (Inspired by Crextio layout)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Tabs */}
            <div className="flex items-center p-0.5 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setViewMode('composite')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'composite'
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Composite Dashboard
              </button>
              <button
                type="button"
                onClick={() => setViewMode('tokens')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'tokens'
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Design Tokens & Specs
              </button>
            </div>

            {onNavigateToAuth && (
              <button
                type="button"
                onClick={onNavigateToAuth}
                className="px-3 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] font-medium hover:border-[var(--accent-gold)] transition-colors cursor-pointer"
              >
                Return to Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Container with subtle reference ambient warm gradient */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ambient-glow">
        
        {viewMode === 'composite' ? (
          <div className="space-y-6">
            {/* 1. Application Navbar */}
            <AppNavbar
              brandConfig={brandConfig}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              userName="Nixtio"
            />

            {/* 2. Page Header with Greeting & Stats */}
            <PageHeader
              greeting="Welcome in"
              userName="Nixtio"
            />

            {/* 3. Metric Progress Sub-Bar (from reference left: Interviews, Hired, Project time, Output) */}
            <div className="flex flex-wrap items-center gap-3 py-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--text-muted)] font-medium">Interviews</span>
                <span className="px-2.5 py-1 rounded-full bg-[#222222] dark:bg-[#33353D] text-white font-semibold text-[11px]">
                  15%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--text-muted)] font-medium">Hired</span>
                <span className="px-2.5 py-1 rounded-full bg-[#F8E7A1] text-[#222222] font-semibold text-[11px]">
                  15%
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[11px] text-[var(--text-muted)] font-medium">Project time</span>
                <span className="text-[11px] font-mono text-[var(--text-secondary)] font-semibold">
                  60%
                </span>
              </div>

              <div className="hidden md:flex items-center gap-2 ml-auto">
                <span className="text-[11px] text-[var(--text-muted)] font-medium">Output</span>
                <span className="px-2.5 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] font-semibold text-[11px]">
                  10%
                </span>
              </div>
            </div>

            {/* 4. Modular Dashboard Composition Grid (Matching Reference Layout) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
              
              {/* Column 1 (lg: 3 cols): Profile Card + Collapsible Details */}
              <div className="lg:col-span-3 space-y-4">
                <UserProfileCard
                  name="Lora Piterson"
                  role="UX/UI Designer"
                  compensationChip="$1,200"
                  statusText="Full-time · Product Design"
                />

                <AccordionGroup
                  items={ACCORDION_ITEMS}
                  defaultOpenId="devices"
                />
              </div>

              {/* Column 2 (lg: 6 cols): Progress Bar Chart + Weekly Schedule */}
              <div className="lg:col-span-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Progress Weekly Bar Chart */}
                  <CompactBarChart
                    title="Progress"
                    totalTime="6.1 h"
                    subtitle="Work Time this week"
                    onOpenDetails={() => {}}
                  />

                  {/* Circular Time Tracker */}
                  <CircularTimerChart
                    title="Time tracker"
                    initialTime="02:35"
                    subtitle="Work Time"
                    progressPercent={65}
                    onOpenDetails={() => {}}
                  />
                </div>

                {/* Team Schedule & Timeline */}
                <TimelineSchedule
                  currentMonth="September 2024"
                />
              </div>

              {/* Column 3 (lg: 3 cols): Onboarding Progress & Task Checklist Widget */}
              <div className="lg:col-span-3 space-y-4">
                {/* Onboarding Segmented Progress Card */}
                <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
                  <SegmentedProgressBar
                    title="Onboarding"
                    totalPercent="18%"
                    segments={[
                      { label: 'Task', percentage: 30, color: 'yellow' },
                      { percentage: 25, color: 'charcoal' },
                      { percentage: 0, color: 'muted' },
                    ]}
                  />
                </div>

                {/* Dark Charcoal Task Checklist (Onboarding Task 2/8) */}
                <TaskList
                  title="Onboarding Task"
                  completedCount={completedCount}
                  totalCount={tasks.length}
                  tasks={tasks}
                  onToggleTask={handleToggleTask}
                  darkVariant={true}
                />
              </div>

            </div>
          </div>
        ) : (
          /* Design System Tokens & Component Specifications */
          <div className="space-y-8 animate-fadeIn">
            {/* Color Palette Tokens */}
            <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)] mb-2">
                1. Core Color Palette Tokens
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mb-6">
                Specified neutral tones with warm champagne-gold and pale-yellow accents.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
                <div className="p-3 rounded-2xl border border-[var(--border-subtle)] bg-[#F7F5EF] text-[#222222]">
                  <div className="h-12 rounded-xl bg-[#F7F5EF] border border-black/10 mb-2" />
                  <p className="text-xs font-bold">Warm Cream</p>
                  <p className="text-[11px] font-mono text-[#777777]">#F7F5EF</p>
                </div>

                <div className="p-3 rounded-2xl border border-[var(--border-subtle)] bg-[#FFFFFF] text-[#222222]">
                  <div className="h-12 rounded-xl bg-[#FFFFFF] border border-black/10 mb-2" />
                  <p className="text-xs font-bold">Soft White</p>
                  <p className="text-[11px] font-mono text-[#777777]">#FFFFFF</p>
                </div>

                <div className="p-3 rounded-2xl border border-[var(--border-subtle)] bg-[#F8E7A1] text-[#222222]">
                  <div className="h-12 rounded-xl bg-[#F8E7A1] mb-2" />
                  <p className="text-xs font-bold">Pale Yellow</p>
                  <p className="text-[11px] font-mono text-[#222222]/70">#F8E7A1</p>
                </div>

                <div className="p-3 rounded-2xl border border-[var(--border-subtle)] bg-[#D9B66F] text-white">
                  <div className="h-12 rounded-xl bg-[#D9B66F] mb-2" />
                  <p className="text-xs font-bold">Champagne Gold</p>
                  <p className="text-[11px] font-mono text-white/80">#D9B66F</p>
                </div>

                <div className="p-3 rounded-2xl border border-[var(--border-subtle)] bg-[#222222] text-white">
                  <div className="h-12 rounded-xl bg-[#222222] mb-2" />
                  <p className="text-xs font-bold">Charcoal</p>
                  <p className="text-[11px] font-mono text-white/70">#222222</p>
                </div>

                <div className="p-3 rounded-2xl border border-[var(--border-subtle)] bg-[#777777] text-white">
                  <div className="h-12 rounded-xl bg-[#777777] mb-2" />
                  <p className="text-xs font-bold">Muted Grey</p>
                  <p className="text-[11px] font-mono text-white/70">#777777</p>
                </div>

                <div className="p-3 rounded-2xl border border-[var(--border-subtle)] bg-[#E8E5DD] text-[#222222]">
                  <div className="h-12 rounded-xl bg-[#E8E5DD] mb-2" />
                  <p className="text-xs font-bold">Light Border</p>
                  <p className="text-[11px] font-mono text-[#777777]">#E8E5DD</p>
                </div>
              </div>
            </div>

            {/* Typography & Radii Specifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  2. Corner Radii & Geometry
                </h3>
                <ul className="text-xs text-[var(--text-secondary)] space-y-2 list-disc pl-4">
                  <li><strong>Card containers</strong>: <code>rounded-3xl (24px)</code> for primary dashboard widgets.</li>
                  <li><strong>Inner widgets & items</strong>: <code>rounded-2xl (16px)</code> for nested items.</li>
                  <li><strong>Pills & capsules</strong>: <code>rounded-full (9999px)</code> for navbar, badges, tags, and progress bars.</li>
                  <li><strong>Buttons & inputs</strong>: <code>rounded-lg / rounded-xl (8-12px)</code> for tactile precision.</li>
                </ul>
              </div>

              <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  3. Modular Dashboard Support Structure
                </h3>
                <ul className="text-xs text-[var(--text-secondary)] space-y-2 list-disc pl-4">
                  <li><strong>Attendance Overview</strong>: Tracked via timeline & schedule components.</li>
                  <li><strong>Working Hours</strong>: Circular timer gauge with pause/resume controls.</li>
                  <li><strong>Performance & Progress</strong>: Weekly 7-day pill bar chart.</li>
                  <li><strong>Task Completion</strong>: Dark charcoal high-contrast checklist.</li>
                  <li><strong>Role Permission Isolation</strong>: Prepared for Employee, Manager, and Admin dashboards.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
