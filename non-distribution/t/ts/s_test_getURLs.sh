#!/bin/bash
# This is a student test (edge case only)

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/../..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}

base="https://example.com/a/index.html"

# edge case: HTML contains no <a href> tags
html=$'<!DOCTYPE html><html><body>\n<p>No links here.</p>\n</body></html>\n'
expected=$''

if ! $DIFF <(printf "%s" "$html" | c/getURLs.js "$base") <(printf "%s" "$expected") >&2;
then
    echo "$0 failure: empty-link page not handled correctly"
    exit 1
fi

echo "$0 success: empty-link page handled correctly"
exit 0
