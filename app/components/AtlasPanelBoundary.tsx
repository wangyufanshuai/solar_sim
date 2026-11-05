"use client";

import { Component, Suspense, type ErrorInfo, type ReactNode } from "react";
import type { AtlasPanelId } from "../lib/atlasRuntimeStore";

export type AtlasPanelErrorFallback = (
  panelId: AtlasPanelId,
  error: Error,
  retry: () => void,
) => ReactNode;

type AtlasPanelBoundaryProps = {
  panelId: AtlasPanelId;
  revision: number;
  pending: ReactNode;
  renderError?: AtlasPanelErrorFallback;
  children: ReactNode;
};

type AtlasPanelBoundaryState = { error: Error | null; failedRevision: number };

export default class AtlasPanelBoundary extends Component<
  AtlasPanelBoundaryProps,
  AtlasPanelBoundaryState
> {
  state: AtlasPanelBoundaryState = { error: null, failedRevision: -1 };

  static getDerivedStateFromError(error: Error): Partial<AtlasPanelBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[atlas-panel:${this.props.panelId}]`, error, info.componentStack);
    this.setState({ failedRevision: this.props.revision });
  }

  componentDidUpdate(previous: AtlasPanelBoundaryProps): void {
    if (
      this.state.error &&
      previous.revision !== this.props.revision &&
      this.state.failedRevision !== this.props.revision
    ) {
      this.setState({ error: null, failedRevision: -1 });
    }
  }

  private retry = () => this.setState({ error: null, failedRevision: -1 });

  render(): ReactNode {
    if (this.state.error) {
      return this.props.renderError?.(this.props.panelId, this.state.error, this.retry) ?? (
        <div role="alert" data-atlas-panel-error={this.props.panelId}>
          <p>Panel unavailable.</p>
          <button type="button" onClick={this.retry}>Retry</button>
        </div>
      );
    }
    return <Suspense fallback={this.props.pending}>{this.props.children}</Suspense>;
  }
}
