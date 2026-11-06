#!/usr/bin/env bash
set -euo pipefail

# Keep the personal site's deployment independent of the main site.
site_tools_dir="$(mktemp -d)"
go_version="1.25.5"
hugo_version="0.166.0"

curl --fail --silent --show-error --location --retry 3 "https://go.dev/dl/go${go_version}.linux-amd64.tar.gz" -o "${site_tools_dir}/go.tar.gz"
tar -xzf "${site_tools_dir}/go.tar.gz" -C "${site_tools_dir}"
curl --fail --silent --show-error --location --retry 3 "https://github.com/gohugoio/hugo/releases/download/v${hugo_version}/hugo_extended_${hugo_version}_linux-amd64.tar.gz" -o "${site_tools_dir}/hugo.tar.gz"
mkdir -p "${site_tools_dir}/hugo"
tar -xzf "${site_tools_dir}/hugo.tar.gz" -C "${site_tools_dir}/hugo"
export PATH="${site_tools_dir}/go/bin:${site_tools_dir}/hugo:${PATH}"

hugo --baseURL 'https://cv.largeoyos.me/' --destination public
