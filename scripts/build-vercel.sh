#!/usr/bin/env bash
set -euo pipefail

# Vercel builds in a fresh Linux environment; pin the same major tools used
# to verify the Hugo site instead of depending on a preinstalled Hugo or Go.
site_tools_dir="$(mktemp -d)"
go_version="1.25.5"
hugo_version="0.166.0"
node_version="24.14.1"

curl --fail --silent --show-error --location --retry 3 "https://go.dev/dl/go${go_version}.linux-amd64.tar.gz" -o "${site_tools_dir}/go.tar.gz"
tar -xzf "${site_tools_dir}/go.tar.gz" -C "${site_tools_dir}"
curl --fail --silent --show-error --location --retry 3 "https://github.com/gohugoio/hugo/releases/download/v${hugo_version}/hugo_extended_${hugo_version}_linux-amd64.tar.gz" -o "${site_tools_dir}/hugo.tar.gz"
mkdir -p "${site_tools_dir}/hugo"
tar -xzf "${site_tools_dir}/hugo.tar.gz" -C "${site_tools_dir}/hugo"
curl --fail --silent --show-error --location --retry 3 "https://nodejs.org/dist/v${node_version}/node-v${node_version}-linux-x64.tar.gz" -o "${site_tools_dir}/node.tar.gz"
tar -xzf "${site_tools_dir}/node.tar.gz" -C "${site_tools_dir}"
export PATH="${site_tools_dir}/node-v${node_version}-linux-x64/bin:${site_tools_dir}/go/bin:${site_tools_dir}/hugo:${PATH}"

npm ci --prefix hugo-draft/stack-main --workspaces=false
npm run build:site
npm --prefix hugo-draft/stack-main --workspaces=false run verify
