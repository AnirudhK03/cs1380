#!/bin/bash
# This is a student test (edge case only)

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/../..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}

# edge case: input becomes empty after stopword removal
# Use the first 3 stopwords from the stopwords file
stop1="$(sed -n '1p' d/stopwords.txt)"
stop2="$(sed -n '2p' d/stopwords.txt)"
stop3="$(sed -n '3p' d/stopwords.txt)"

input="${stop1} ${stop2} ${stop3}\n"
expected=$''

if ! $DIFF <(printf "%b" "$input" | c/process.sh) <(printf "%s" "$expected") >&2;
then
    echo "$0 failure: stopword-only input not handled correctly"
    exit 1
fi

echo "$0 success: stopword-only input handled correctly"
exit 0
