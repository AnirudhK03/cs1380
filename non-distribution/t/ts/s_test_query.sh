#!/bin/bash
# This is a student test (edge case only)

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/../..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}

mkdir -p d

# Minimal index file (content shouldn't matter for this edge case)
cat > d/global-index.txt << 'EOF'
alpha | url1 1
EOF

# edge case: query becomes empty after stopword removal
stop1="$(sed -n '1p' d/stopwords.txt)"
stop2="$(sed -n '2p' d/stopwords.txt)"

expected=$''

if ! $DIFF <(c/query.js "$stop1" "$stop2") <(printf "%s" "$expected") >&2;
then
    echo "$0 failure: stopword-only query not handled correctly"
    exit 1
fi

echo "$0 success: stopword-only query handled correctly"
exit 0
