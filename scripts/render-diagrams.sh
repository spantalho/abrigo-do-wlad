#!/usr/bin/env bash

set -euo pipefail

plantuml_version="1.2026.7"
plantuml_sha256="33aa7ed0ca843e300690230d09268e1f526fdde7e86fecdfa39fb80412cafcde"
diagram_cache_dir="${TMPDIR:-/tmp}/abrigo-do-wlad-plantuml"
plantuml_jar="${diagram_cache_dir}/plantuml-${plantuml_version}.jar"


mkdir -p "${diagram_cache_dir}"

if ! printf '%s  %s\n' "${plantuml_sha256}" "${plantuml_jar}" \
  | sha256sum --check --status 2>/dev/null; then
  download_path="${plantuml_jar}.download"
  curl --fail --location --silent --show-error --retry 3 \
    "https://github.com/plantuml/plantuml/releases/download/v${plantuml_version}/plantuml-${plantuml_version}.jar" \
    --output "${download_path}"
  printf '%s  %s\n' "${plantuml_sha256}" "${download_path}" | sha256sum --check --status
  mv "${download_path}" "${plantuml_jar}"
fi

printf '%s  %s\n' "${plantuml_sha256}" "${plantuml_jar}" | sha256sum --check --status

if [[ "${1:-}" == "--check" ]]; then
  render_dir="$(mktemp -d "${TMPDIR:-/tmp}/abrigo-diagrams.XXXXXX")"
  trap 'rm -rf -- "${render_dir}"' EXIT
  java -jar "${plantuml_jar}" -charset UTF-8 -tsvg \
    --output-dir "${render_dir}" docs/*.puml

  for source_path in docs/*.puml; do
    diagram_name="$(basename "${source_path}" .puml).svg"
    if ! cmp --silent "docs/${diagram_name}" "${render_dir}/${diagram_name}"; then
      printf 'Diagrama desatualizado: docs/%s. Execute npm run docs:diagrams.\n' \
        "${diagram_name}" >&2
      exit 1
    fi
  done
else
  java -jar "${plantuml_jar}" -charset UTF-8 -tsvg docs/*.puml
fi
