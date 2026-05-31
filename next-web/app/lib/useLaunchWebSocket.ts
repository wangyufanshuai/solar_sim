"use client";

/**
 * React hook managing WebSocket connection to the launch telemetry server.
 *
 * Connects to ws://127.0.0.1:8766/ws/launch, decodes binary frames,
 * accumulates trajectory points in a Float32Array ring buffer, and provides
 * a state interface for UI and rendering components.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AU_METERS } from "./physicalConstants";
import { decodeLaunchFrame, encodeLaunchConfig } from "./launchBinaryProtocol";
import { runtimeWsUrl } from "./runtimeUrls";
import type {
  LaunchConfig,
  LaunchEvent,
  LaunchSimState,
  INITIAL_LAUNCH_STATE,
} from "./launchTelemetryTypes";

/** Max trajectory points in the ring buffer (500k = ~500s at 1ms). */
const MAX_TRAJ_POINTS = 500_000;
/** Re-render tick interval (ms). */
const RENDER_TICK_MS = 16; // ~60fps

export type LaunchWebSocketActions = {
  launchState: LaunchSimState;
  startLaunch: (config?: LaunchConfig) => void;
  pauseLaunch: () => void;
  resumeLaunch: () => void;
  setTimeScale: (scale: number) => void;
  seekTo: (timeS: number) => void;
};

function defaultLaunchWsUrl(): string {
  return runtimeWsUrl(
    "/ws/launch",
    process.env.NEXT_PUBLIC_LAUNCH_WS_URL
  );
}

export default function useLaunchWebSocket(
  url: string = defaultLaunchWsUrl(),
  enabled: boolean = true
): LaunchWebSocketActions {
  const wsRef = useRef<WebSocket | null>(null);
  const trajBufferRef = useRef<Float32Array>(
    new Float32Array(MAX_TRAJ_POINTS * 3)
  );
  const trajCountRef = useRef(0);
  const latestSampleRef = useRef<LaunchSimState["currentSample"]>(null);
  const eventsRef = useRef<LaunchEvent[]>([]);
  const maxQRef = useRef({ pa: 0, alt: 0, t: 0 });
  const durationRef = useRef(0);
  const pausedRef = useRef(false);
  const timeScaleRef = useRef(10);
  const phaseRef = useRef<string>("idle");
  const isConnectedRef = useRef(false);
  const isStreamingRef = useRef(false);

  // Tick counter to trigger re-renders at 60fps
  const [tick, setTick] = useState(0);

  // Allocate state once
  const [launchState] = useState<LaunchSimState>(() => ({
    phase: "idle",
    currentSample: null,
    maxQPa: 0,
    maxQAltitudeM: 0,
    maxQTimeS: 0,
    trajectoryPoints: new Float32Array(0),
    trajectoryCount: 0,
    events: [],
    isConnected: false,
    isStreaming: false,
    isPaused: false,
    timeScale: 10,
    simDurationS: 0,
  }));

  // Re-render ticker
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, RENDER_TICK_MS);
    return () => clearInterval(interval);
  }, [enabled]);

  // Connect WebSocket
  useEffect(() => {
    if (!enabled) {
      isConnectedRef.current = false;
      isStreamingRef.current = false;
      return;
    }
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
      ws.binaryType = "arraybuffer";
    } catch {
      return;
    }

    ws.onopen = () => {
      isConnectedRef.current = true;
    };

    ws.onclose = () => {
      isConnectedRef.current = false;
      isStreamingRef.current = false;
    };

    ws.onerror = () => {
      isConnectedRef.current = false;
    };

    ws.onmessage = (event: MessageEvent) => {
      if (typeof event.data === "string") {
        // JSON control message
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "ready") {
            isStreamingRef.current = true;
            durationRef.current = msg.duration_s || 0;
            maxQRef.current = {
              pa: msg.max_q_pa || 0,
              alt: msg.max_q_altitude_m || 0,
              t: msg.max_q_time_s || 0,
            };
            eventsRef.current = (msg.events || []).map(
              (e: Record<string, unknown>) => ({
                type: e.type as string,
                t: e.t as number,
                altitudeM: e.altitude_m as number,
                velocityMs: e.velocity_m_s as number,
                data: e as Record<string, number>,
              })
            );
          } else if (msg.type === "paused") {
            pausedRef.current = true;
          } else if (msg.type === "resumed") {
            pausedRef.current = false;
          } else if (msg.type === "timeScale") {
            timeScaleRef.current = msg.value;
          } else if (msg.type === "complete") {
            isStreamingRef.current = false;
            phaseRef.current = "landed";
          }
        } catch {
          // ignore malformed JSON
        }
        return;
      }

      // Binary frame
      if (event.data instanceof ArrayBuffer) {
        const decoded = decodeLaunchFrame(event.data);
        if (!decoded) return;

        const { sample } = decoded;
        latestSampleRef.current = sample;

        // Append to trajectory ring buffer (x, y, z in scene units)
        const AU_TO_SCENE = 52;
        const idx = trajCountRef.current;
        if (idx < MAX_TRAJ_POINTS) {
          const buf = trajBufferRef.current;
          const base = idx * 3;
          buf[base] = sample.x / AU_METERS * AU_TO_SCENE;
          buf[base + 1] = sample.y / AU_METERS * AU_TO_SCENE;
          buf[base + 2] = sample.z / AU_METERS * AU_TO_SCENE;
          trajCountRef.current = idx + 1;
        }

        // Determine phase from altitude and time
        if (sample.t < 10) {
          phaseRef.current = "verticalRise";
        } else if (sample.altitudeM < 150_000) {
          phaseRef.current = "gravityTurn";
        } else if (sample.altitudeM < 200_000) {
          phaseRef.current = "circularization";
        } else if (sample.altitudeM < 35_786_000) {
          phaseRef.current = "coast";
        } else {
          phaseRef.current = "deepSpace";
        }
      }
    };

    wsRef.current = ws;

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [enabled, url]);

  // Actions
  const startLaunch = useCallback(
    (config?: LaunchConfig) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      // Reset buffers
      trajCountRef.current = 0;
      latestSampleRef.current = null;
      eventsRef.current = [];
      maxQRef.current = { pa: 0, alt: 0, t: 0 };
      phaseRef.current = "prelaunch";

      ws.send(encodeLaunchConfig("start", config));
    },
    []
  );

  const pauseLaunch = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(encodeLaunchConfig("pause"));
  }, []);

  const resumeLaunch = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(encodeLaunchConfig("resume"));
  }, []);

  const setTimeScale = useCallback((scale: number) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(encodeLaunchConfig("setTimeScale", { value: scale }));
    timeScaleRef.current = scale;
  }, []);

  const seekTo = useCallback((timeS: number) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(encodeLaunchConfig("seek", { time_s: timeS }));
  }, []);

  // Build state object from refs (avoids re-allocating)
  launchState.currentSample = latestSampleRef.current;
  launchState.trajectoryPoints = trajBufferRef.current;
  launchState.trajectoryCount = trajCountRef.current;
  launchState.events = eventsRef.current;
  launchState.maxQPa = maxQRef.current.pa;
  launchState.maxQAltitudeM = maxQRef.current.alt;
  launchState.maxQTimeS = maxQRef.current.t;
  launchState.phase = phaseRef.current as LaunchSimState["phase"];
  launchState.isConnected = isConnectedRef.current;
  launchState.isStreaming = isStreamingRef.current;
  launchState.isPaused = pausedRef.current;
  launchState.timeScale = timeScaleRef.current;
  launchState.simDurationS = durationRef.current;

  return {
    launchState,
    startLaunch,
    pauseLaunch,
    resumeLaunch,
    setTimeScale,
    seekTo,
  };
}
