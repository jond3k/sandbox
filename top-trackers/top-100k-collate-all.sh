#!/bin/bash

sort top-100k.log | uniq -c | sort -nr 
