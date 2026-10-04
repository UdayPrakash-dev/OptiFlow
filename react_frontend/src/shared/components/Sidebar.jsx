import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const NavIcon = ({ name, className = "w-5 h-5" }) => {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
        </svg>
    );
};

//Retractable Sidebar Component
export const Sidebar = ({ navItems = [], title = "OptiFlow" }) => {

    const [expanded, setExpanded] = useState(true);

    return (
        <aside className="h-screen sticky top-0">
            <nav
                className={`h-full flex flex-col bg-white border-r border-slate-200 shadow-xs transition-all duration-300 dark:bg-slate-900 dark:border-slate-800 ${expanded ? 'w-64' : 'w-20'
                    }`}
            >
                {/* Header with Logo and Collapse Toggle */}
                <div className="p-4 pb-2 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                    <div className={`flex items-center gap-2 overflow-hidden transition-all ${expanded ? 'w-36' : 'w-0'}`}>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">
                            OF
                        </div>
                        <span className="font-bold text-slate-800 dark:text-white truncate">{title}</span>
                    </div>
                    {/* Toggle Button */}
                    <button
                        onClick={() => setExpanded((curr) => !curr)}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                        title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d={expanded ? 'M11 19l-7-7 7-7m8 14l-7-7 7-7' : 'M13 5l7 7-7 7M5 5l7 7-7 7'}
                            />
                        </svg>
                    </button>
                </div>
                {/* Navigation Items */}
                <ul className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map((item) => (
                        <li key={item.path} className="relative group">
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center py-2.5 px-3 my-1 font-medium rounded-lg cursor-pointer transition-colors ${isActive
                                        ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-950/60 dark:text-indigo-400'
                                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                                    }`
                                }
                            >
                                {/* Generic icon placeholder or custom SVG */}
                                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                                    <span className="text-xs font-bold uppercase">{item.label.slice(0, 2)}</span>
                                </div>
                                <span
                                    className={`overflow-hidden transition-all truncate ${expanded ? 'w-44 ml-3' : 'w-0'
                                        }`}
                                >
                                    {item.label}
                                </span>
                                {/* Floating tooltip when sidebar is collapsed (hover effect) */}
                                {!expanded && (
                                    <div className="absolute left-full rounded-md px-2 py-1 ml-6 bg-slate-900 text-white text-xs font-medium invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 z-50 whitespace-nowrap shadow-md dark:bg-slate-100 dark:text-slate-900">
                                        {item.label}
                                    </div>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>


        </aside>
    )
}