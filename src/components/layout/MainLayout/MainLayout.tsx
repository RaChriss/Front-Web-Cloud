import { useState, type ReactNode } from 'react';
import { Sidebar } from '../Sidebar/Sidebar';
import '../../../assets/styles/components/MainLayout.css';

interface MainLayoutProps {
    children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className={`main-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
