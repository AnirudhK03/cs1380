#!/bin/bash
# This is a student test (edge case only)

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/../..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}

tmpdir="$(mktemp -d)"
global="$tmpdir/does-not-exist.txt"

# Edge case: merging when global index file does not exist
local=$'alpha | 2 | urlA\nalpha | 1 | urlB\n'
expected=$'alpha | urlA 2 urlB 1\n'

if ! $DIFF <(printf "%s" "$local" | c/merge.js "$global") <(printf "%s" "$expected") >&2;
then
    echo "$0 failure: merge did not handle missing global index file"
    rm -rf "$tmpdir"
    exit 1
fi

rm -rf "$tmpdir"
echo "$0 success: merge handled missing global index file"
exit 0
