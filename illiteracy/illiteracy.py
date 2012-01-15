#!/usr/bin/python
import urllib2
import operator
import re

LANGS_URL   = 'https://github.com/languages'
SEARCH_URL  = 'https://github.com/search?type=Code&language=%s&q=%s'
SEARCH_TERM = '.lenght'

FAIL_REGEX  = r'<div class="title">Code \(([0-9]+)\)</div>'
LANGS_REGEX = r'<a href="/languages/([\w]*)"\s*class="bar"\s*style="width: [0-9]*%">\s*([0-9]*)%</a>'

def request(url):
    print "Requesting: %s" % url
    return urllib2.urlopen(url).read()

def extractFailCount(body):
    result = 0
    match  = re.search(FAIL_REGEX, body).group(1)
    count  = int(match)
    return count

def getFailCount(lang, term):
    url    = SEARCH_URL % (lang, term)
    body   = request(url)
    result = extractFailCount(body)
    return result

def getLangs():
    results = {}
    body    = request(LANGS_URL)
    matches = re.findall(LANGS_REGEX, body)
    for match in matches:
        results[match[0]] = float(match[1])
    return results

def topLanguage(langs):
    return max(langs, key=lambda a: langs.get(a))

def normalizeLangs(langs):
    top        = topLanguage(langs)
    max        = langs[top]
    normalized = {}

    print "Top language is %s (%s%%)" % (top, max)
    
    for lang in langs:
        freq = langs[lang]
        if freq > 0:
            normalized[lang] = max / freq

    return normalized

def printIndex(normalized):
    format = '%-12s%-12s%s'
    print format % ("Language", "Percentage", "Normalized")
    for lang in normalized:
        print format % (lang, langs[lang], round(normalized[lang],2))

def getAllFailCounts(langs):
    print "Searching for occurrences of '%s' in %s languages.." % (SEARCH_TERM, len(langs))
    results = {}
    for lang in langs:
        fails         = getFailCount(lang, SEARCH_TERM)
        results[lang] = fails
    return results

def normalizeFailCounts(normalized, counts):
    results = {}
    for lang in normalized:
        normalization = normalized[lang]
        fails         = counts[lang]
        multiplied    = fails * normalization
        results[lang] = multiplied
    return results

def sortResults(results):
    return sorted(results.iteritems(), key=operator.itemgetter(1), reverse=True)

def printFailCounts(counts):
    format = "%-12s%-12s"
    print format % ("Language", "Fails")
    i = 0
    for lang in counts:
        i += 1
        print format % (lang, counts[lang])

def printSorted(sorted):
    format = "%-3s%-12s%-12s"
    print format % ("#", "Language", "Illiteracy Level")
    i = 0
    for result in sorted:
        i += 1
        print format % (i, result[0], round(result[1], 1))

#langs = {'JavaScript': 20.0, 'PHP': 7.0, 'Java': 7.0}
langs      = getLangs()
normalized = normalizeLangs(langs)

print
printIndex(normalized)
print

counts     = getAllFailCounts(langs)
unsorted   = normalizeFailCounts(normalized, counts)
sorted     = sortResults(unsorted)

print
printFailCounts(counts)
print
printSorted(sorted)
print


