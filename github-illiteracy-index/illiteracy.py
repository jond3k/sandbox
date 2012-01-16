#!/usr/bin/python
import urllib2
import operator
import re

LANGS_URL   = 'https://github.com/languages'
SEARCH_URL  = 'https://github.com/search?type=Code&language=%s&q=%s'

SEARCH_REGEX = r'<div class="title">Code \(([0-9]+)\)</div>'
# match the top 10 languages
LANGS_REGEX  = r'<a href="/languages/([^\b"]*)"\s*class="bar"\s*style="width: [0-9]*%">\s*[0-9]*%</a>'
# match all languages
#LANGS_REGEX  = r'<li>\s*<a href="/languages/([^\b"]*)"\s*>[^\b"]*</a>\s*</li>'

TERMS = {'length': 'lenght', 'height': 'heigth', 'hierarchy':'heirarchy'}

def request(url, retries=2):
    print "Requesting: %s" % url
    try:
        return urllib2.urlopen(url).read()
    except HTTPError as e:
        if retries == 0:
            raise e
        print e
        return request(url, retries-1)

def extractSearchCount(body):
    result = 0
    match  = re.search(SEARCH_REGEX, body).group(1)
    count  = float(match)
    return count

def getSearchCount(lang, term):
    url    = SEARCH_URL % (lang, term)
    body   = request(url)
    result = extractSearchCount(body)
    return result

def getLangs():
    results = []
    body    = request(LANGS_URL)
    matches = re.findall(LANGS_REGEX, body)
    for match in matches:
        results.append(match)
    return results

def getLangFreqs(lang, terms):
    results = {}
    for goodWord in terms:
        failWord = terms[goodWord]
        fails  = getSearchCount(lang, failWord)
        passes = getSearchCount(lang, goodWord)
        freq = 0
        if (passes > 0):
            freq   = fails/passes
        print "%s: %s = %s, %s = %s, Rate = %s" % (lang, goodWord, passes, failWord, fails, freq)
        results[goodWord] = freq
    return results

def getAllFreqs(langs, terms):
    print "Searching for occurrences of %s typos in %s languages.." % (len(terms), len(langs))
    results = {}
    for lang in langs:
        results[lang] = getLangFreqs(lang, terms)
    return results

def sortResults(results):
    return sorted(results.iteritems(), key=operator.itemgetter(1), reverse=True)

def averageFreqs(langs):
    results = {}
    for lang in langs:
        freqs = langs[lang]
        total = 0
        for freq in freqs:
            total = total + freqs[freq]
        avg   = total / len(freqs)
        results[lang] = avg
    return results

def printSorted(sorted):
    format = "%-3s%-12s%-12s"
    print format % ("#", "Language", "Illiteracy")
    i = 0
    for result in sorted:
        i += 1
        print format % (i,  urllib2.unquote(result[0]), round(result[1], 8))

#langs = ['JavaScript']
langs    = getLangs()
freqs    = getAllFreqs(langs, TERMS)
averaged = averageFreqs(freqs)
sorted   = sortResults(averaged)

print
printSorted(sorted)
print


