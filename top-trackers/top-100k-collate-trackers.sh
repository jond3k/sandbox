#!/bin/bash

# Create a list of trackers and turn it in to a regex
trackerRegex=$(echo "("$(grep "\"type\":\"tracker\"" ghostery.json | sed "s/.*\"name\":\"\([^\"]*\)\".*/\1/i" | sort | uniq | sed ':a;N;$!ba;s/\n/|/g')")")
#echo $trackerRegex

# run the other collation but only match trackers (use egrep - supports OR
# operation)
bash top-100k-collate-all.sh | grep -E "$trackerRegex"


