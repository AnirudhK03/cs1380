#!/bin/bash
# This is a student test (edge case only)

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/../..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}

url="https://cs.brown.edu/courses/csci1380/sandbox/1/level_1b/index.html"

# edge case: empty token stream
input=$''
expected=$''

# normalize whitespace in output like the official test does
if ! $DIFF <(printf "%s" "$input" | c/invert.sh "$url" | sed 's/[[:space:]]//g') \
         <(printf "%s" "$expected") >&2;
then
    echo "$0 failure: empty input not handled correctly"
    exit 1
fi

echo "$0 success: empty input handled correctly"
exit 0
