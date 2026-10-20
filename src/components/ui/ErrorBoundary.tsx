import { Component, type ReactNode } from 'react'
import { Link } from 'react-router'

type Props = { children: ReactNode }
type State = { failed: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="grid min-h-dvh place-items-center bg-[#F4F0FF] px-4 text-center text-[#1A2340]">
        <div className="grid max-w-md gap-4">
          <h1 className="font-display text-4xl">Let's try that again</h1>
          <p className="text-lg">Something unexpected happened. Your saved mission is still on this device.</p>
          <button type="button" className="min-h-12 rounded-2xl bg-[#3C3489] px-5 font-bold text-white" onClick={() => window.location.reload()}>
            Try again
          </button>
          <Link to="/" className="font-bold">
            Back to Adventures
          </Link>
        </div>
      </div>
    )
  }
}
