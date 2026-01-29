#!/bin/bash
# This is a student test

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/../..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}

# normal test
html='<!DOCTYPE html><html><body><h1>Hello</h1><p>Check <a href="x.html">this</a>.</p></body></html>'
expected=$'HELLO\n\nCheck this [x.html].\n'

if ! $DIFF <(printf "%s\n" "$html" | c/getText.js) <(printf "%s" "$expected") >&2;
then
    echo "$0 failure: extracted text is not identical"
    exit 1
fi

# edge case: empty input should not crash and should produce empty output (newline)
empty_html=''
empty_expected=$'\n'

if ! $DIFF <(printf "%s" "$empty_html" | c/getText.js) <(printf "%s" "$empty_expected") >&2;
then
    echo "$0 failure: empty HTML handling is incorrect"
    exit 1
fi

echo "$0 success: extracted text is identical (including empty input)"
exit 0
