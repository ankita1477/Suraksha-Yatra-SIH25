interface AIStatusState {
  lastSuccess?: string;
  lastError?: string;
  lastErrorMessage?: string;
  consecutiveFailures: number;
}

const state: AIStatusState = {
  consecutiveFailures: 0,
};

export function recordAISuccess() {
  state.lastSuccess = new Date().toISOString();
  state.consecutiveFailures = 0;
  state.lastErrorMessage = undefined;
}

export function recordAIFailure(message: string) {
  state.lastError = new Date().toISOString();
  state.lastErrorMessage = message;
  state.consecutiveFailures += 1;
}

export function getAIStatus() {
  return {
    ...state,
    status: state.consecutiveFailures >= 3 ? 'degraded' : 'ok'
  };
}

export default { recordAISuccess, recordAIFailure, getAIStatus };