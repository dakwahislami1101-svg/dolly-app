/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export function MobileFrame({ children }: MobileFrameProps) {
  return (
    <div className="w-full h-screen min-h-screen flex flex-col bg-slate-50 overflow-hidden selection:bg-rose-200">
      {/* Screen Content Viewport - Occupies 100% of the display for Android WebView compatibility */}
      <div className="flex-1 w-full h-full overflow-hidden flex flex-col bg-slate-50 relative">
        {children}
      </div>
    </div>
  );
}

