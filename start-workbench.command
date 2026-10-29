#!/bin/zsh -l
# Finder starts outside the checkout; preserve the user's PATH and add Homebrew fallbacks.
export PATH="$PATH:/opt/homebrew/bin:/usr/local/bin"
workbench_root="$(cd -- "$(dirname "$0")" && pwd -P)" || exit 1
if ! command -v node >/dev/null 2>&1; then
  printf '%s\n' 'Node.js is required. Install Node.js 22.19+ or 24+, then try again.'
  if [[ -t 0 ]]; then read -r '?Press Return to close.'; fi
  exit 1
fi
node "$workbench_root/scripts/start-workbench.mjs" "$@"
workbench_exit=$?
if (( workbench_exit != 0 )) && [[ -t 0 ]]; then read -r '?Press Return to close.'; fi
exit "$workbench_exit"
