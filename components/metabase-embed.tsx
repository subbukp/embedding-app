"use client"

import { useState } from "react"
import { AlertCircle, Maximize2, Minimize2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InteractiveDashboard } from "@metabase/embedding-sdk-react/nextjs"

interface MetabaseEmbedProps {
  dashboardId: string
  metabaseDashboardId: string
  jwtToken?: string
}

export function MetabaseEmbed({ dashboardId, metabaseDashboardId, jwtToken }: MetabaseEmbedProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleRefresh = () => {
    // Refresh the page to reload the dashboard
    window.location.reload()
  }

  const containerClass = isFullscreen
    ? "fixed inset-0 z-50 bg-background"
    : "relative w-full h-[calc(100vh-4rem)] overflow-hidden rounded-lg"

  return (
    <div className={containerClass}>
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleRefresh}
          className="h-8 w-8 bg-background/80 backdrop-blur-sm"
          title="Refresh dashboard"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="h-8 w-8 bg-background/80 backdrop-blur-sm"
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      <InteractiveDashboard
        dashboardId={parseInt(metabaseDashboardId)}
        withDownloads
        withTitle
        className="w-full h-full"
      />
    </div>
  )
}
