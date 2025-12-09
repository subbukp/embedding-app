"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Loader2, AlertCircle, RefreshCw, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase/client"

interface PowerBIEmbedProps {
  dashboardId: string
  workspaceId: string
  reportId: string
  title?: string
}

interface EmbedConfig {
  reportId: string
  embedUrl: string
  accessToken: string
  tokenExpiry: string
}

// Declare global powerbi variable
declare global {
  interface Window {
    powerbi: any
  }
}

export function PowerBIEmbed({ dashboardId, workspaceId, reportId, title }: PowerBIEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [embedConfig, setEmbedConfig] = useState<EmbedConfig | null>(null)
  const [sdkLoaded, setSdkLoaded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = useCallback(async () => {
    if (!wrapperRef.current) return

    try {
      if (!document.fullscreenElement) {
        await wrapperRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error("[v0] Fullscreen error:", err)
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Load Power BI SDK dynamically
  useEffect(() => {
    if (window.powerbi) {
      console.log("[v0] PowerBIEmbed: SDK already loaded")
      setSdkLoaded(true)
      return
    }

    console.log("[v0] PowerBIEmbed: Loading Power BI SDK...")

    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/powerbi-client@2.22.0/dist/powerbi.min.js"
    script.async = true

    script.onload = () => {
      console.log("[v0] PowerBIEmbed: SDK loaded successfully")
      setSdkLoaded(true)
    }

    script.onerror = (err) => {
      console.error("[v0] PowerBIEmbed: Failed to load SDK:", err)
      setError("Failed to load Power BI SDK")
      setLoading(false)
    }

    document.body.appendChild(script)

    return () => {
      // Don't remove script on cleanup as it might be needed elsewhere
    }
  }, [])

  const fetchEmbedToken = useCallback(async () => {
    console.log("[v0] PowerBIEmbed: Fetching embed token...")
    console.log("[v0] PowerBIEmbed: Params:", { dashboardId, workspaceId, reportId })
    setLoading(true)
    setError(null)

    try {
      const supabase = createBrowserClient()
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.error("[v0] PowerBIEmbed: No session found:", sessionError)
        throw new Error("Please log in to view this dashboard")
      }

      console.log("[v0] PowerBIEmbed: Session found, fetching embed token...")

      const response = await fetch("/api/powerbi/embed-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          dashboardId,
          workspaceId,
          reportId,
        }),
      })

      console.log("[v0] PowerBIEmbed: API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] PowerBIEmbed: API error:", errorData)
        throw new Error(errorData.error || "Failed to get embed token")
      }

      const config: EmbedConfig = await response.json()
      console.log("[v0] PowerBIEmbed: Embed config received:", {
        reportId: config.reportId,
        embedUrl: config.embedUrl?.substring(0, 80) + "...",
        hasToken: !!config.accessToken,
        tokenLength: config.accessToken?.length,
        tokenExpiry: config.tokenExpiry,
      })

      setEmbedConfig(config)
    } catch (err) {
      console.error("[v0] PowerBIEmbed: Error:", err)
      setError(err instanceof Error ? err.message : "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }, [dashboardId, workspaceId, reportId])

  useEffect(() => {
    fetchEmbedToken()
  }, [fetchEmbedToken])

  // Embed the report when SDK and config are ready
  useEffect(() => {
    if (!sdkLoaded || !embedConfig || !containerRef.current || !window.powerbi) {
      console.log("[v0] PowerBIEmbed: Waiting for dependencies...", {
        sdkLoaded,
        hasConfig: !!embedConfig,
        hasContainer: !!containerRef.current,
        hasPowerBI: !!window.powerbi,
      })
      return
    }

    console.log("[v0] PowerBIEmbed: Embedding report...")

    // Clear any existing embed
    window.powerbi.reset(containerRef.current)

    const config = {
      type: "report",
      tokenType: 1, // Embed token = 1, AAD token = 0
      accessToken: embedConfig.accessToken,
      embedUrl: embedConfig.embedUrl,
      id: embedConfig.reportId,
      permissions: 0, // Read = 0
      settings: {
        panes: {
          filters: {
            visible: false,
          },
          pageNavigation: {
            visible: true,
          },
        },
        background: 0, // Default (uses original Power BI report background)
      },
    }

    console.log("[v0] PowerBIEmbed: Config prepared:", {
      type: config.type,
      tokenType: config.tokenType,
      id: config.id,
      embedUrlLength: config.embedUrl?.length,
      tokenLength: config.accessToken?.length,
    })

    try {
      const report = window.powerbi.embed(containerRef.current, config)

      report.on("loaded", () => {
        console.log("[v0] PowerBIEmbed: Report loaded event fired")
      })

      report.on("rendered", () => {
        console.log("[v0] PowerBIEmbed: Report rendered event fired")
      })

      report.on("error", (event: any) => {
        console.error("[v0] PowerBIEmbed: Error event:", event.detail)
        if (event.detail?.message) {
          setError(`Power BI Error: ${event.detail.message}`)
        }
      })

      console.log("[v0] PowerBIEmbed: Embed initiated successfully")
    } catch (err) {
      console.error("[v0] PowerBIEmbed: Embed failed:", err)
      setError(err instanceof Error ? err.message : "Failed to embed report")
    }
  }, [sdkLoaded, embedConfig])

  // Token refresh logic
  useEffect(() => {
    if (!embedConfig?.tokenExpiry) return

    const expiryTime = new Date(embedConfig.tokenExpiry).getTime()
    const now = Date.now()
    const refreshTime = expiryTime - now - 5 * 60 * 1000 // Refresh 5 minutes before expiry

    if (refreshTime > 0) {
      console.log("[v0] PowerBIEmbed: Token refresh scheduled in", Math.round(refreshTime / 1000 / 60), "minutes")
      const timer = setTimeout(async () => {
        console.log("[v0] PowerBIEmbed: Refreshing token...")
        await fetchEmbedToken()
      }, refreshTime)

      return () => clearTimeout(timer)
    }
  }, [embedConfig, fetchEmbedToken])

  if (loading || !sdkLoaded) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {!sdkLoaded ? "Loading Power BI SDK..." : "Loading Power BI report..."}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-destructive font-medium">Error Loading Dashboard</p>
          <p className="text-sm text-muted-foreground text-center max-w-md">{error}</p>
          <Button variant="outline" onClick={fetchEmbedToken}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!embedConfig) {
    return null
  }

  return (
    <div ref={wrapperRef} className={`relative ${isFullscreen ? "bg-background" : "p-4 md:p-6"}`}>
      {/* Fullscreen toggle button */}
      <Button
        variant="outline"
        size="sm"
        onClick={toggleFullscreen}
        className="absolute top-6 right-6 md:top-8 md:right-8 z-10 bg-card/90 backdrop-blur-sm hover:bg-card border-border/50"
      >
        {isFullscreen ? (
          <>
            <Minimize2 className="mr-2 h-4 w-4" />
            Exit Fullscreen
          </>
        ) : (
          <>
            <Maximize2 className="mr-2 h-4 w-4" />
            Fullscreen
          </>
        )}
      </Button>

      {/* Scrollable embed container with rounded border */}
      <div className="rounded-lg border border-border/30 bg-card/20 overflow-auto">
        <div
          ref={containerRef}
          style={{
            width: "100%",
            minWidth: "1200px", // Ensures horizontal scroll if viewport is smaller
            height: isFullscreen ? "100vh" : "calc(100vh - 8rem)",
          }}
        />
      </div>
    </div>
  )
}
