#!/bin/bash
# This is a student test (edge case only)

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/../..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}

# Edge case: input contains only whitespace and empty lines
input=$'   \n\n\t\n'
expected=$''

if ! $DIFF <(printf "%s" "$input" | c/stem.js) <(printf "%s" "$expected") >&2;
then
    echo "$0 failure: whitespace-only input not handled correctly"
    exit 1
fi

echo "$0 success: whitespace-only input handled correctly"
exit 0
