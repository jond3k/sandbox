<?php
// A crappy script that tries to do the same as top-bugs but with curl multi.
// Didn't work so well. Don't try to parallelise a PHP script ;-)
$from      = 0;
$to        = isset($argv[2]) ? (int)$argv[2] : null;
$batchSize = 200;

$topSites  = getTopSites($from, $to);

if ($from !== null) {
	error_log("Processing sites " . print_r($from, true) . " to " . print_r((int)$to, true));
} else {
	error_log("Processing " . count($topSites) . " sites");
}

$trackerList   = getGhosteryData();
$foundTrackers = getTrackerFreqs($trackerList, $topSites, $batchSize);

foreach($foundTrackers as $name => $freq) {
	error_log("$name\t$freq");
}

// format: rank:int, domain:string
function getTopSites($from, $to) {
	// return array( rank => domain )
	$topUrls = array();
	$topUrlsFile = fopen('top-1m.csv', 'r');

	$i = -1;
	$lastRank = null;
	while($line = fgetcsv($topUrlsFile)) {

		// select lines
		$i++;
		if ($from !== null && $i <  $from) continue;
		if ($to !== null   && $i >= $to)   break;

		$rank   = $line[0];
		$domain = $line[1];

		// validate
		if (!is_numeric($rank) || !is_string($domain)) {
			die("Bad line: " . print_r($line, true));
		} else if (isset($topUrls[$rank])) {
			die("Rank already used: " . print_r($line, true));
		} else if ($lastRank && $lastRank > $rank) {
			die("Last used rank $lastRank which is greater than current rank of $rank; data file is expected to be sorted! " . print_r($line, true));
		}

		$topUrls[$rank] = $domain;
		$lastRank = $rank;
	}
	//error_log("Sanity check: Top five are " . implode(', ', array_slice($topUrls, 0, 5)));
	fclose($topUrlsFile);
	return $topUrls;
}

function getGhosteryData() {
	$results = array();

	// format: bugs[*].{name,pattern}
	$text = file_get_contents('ghostery.json');
	$data = json_decode($text, true);

	if (!isset($data['bugs'])) {
		die("Didn't find bugs array in json file");
	}
	$bugs = $data['bugs'];

	foreach($bugs as $bug) {
		$name    = $bug['name'];
		$pattern = $bug['pattern'];

		if (!is_string($name) || !is_string($pattern)) {
			die("Bad ghostery entry: " . print_r($bug, true));
		}
		$results[$name] = "/$pattern/";
	}

	// fixme this one is removed because it's a bad regex
	unset($results['ReTargeter Beacon']);

	return $results;
}

function getTrackerFreqs(Array $trackers, Array $sites, $batchSize) {

	$results = array();

	// count sites to determine the number of iterations
	$total = count($sites);

	// use the ceiling because we don't want to round down and therefore lose 
	// valuable sites
	$iterations = ceil($total / $batchSize);

	for($i=0; $i<$iterations; $i++) {
		$multi = curl_multi_init();
		$active = null;
		$batch = array_slice($sites, $i * $batchSize, $batchSize);
		$batchCurl = array();

		$started = microtime(true);
		error_log("batch $i");

		foreach ($batch as $site) {
			$curl = getPageContentCurl($site);
			$batchCurl[$site] = $curl;
			curl_multi_add_handle($multi, $curl);
		}

		do {
			curl_multi_exec($multi, $running);
		} while($running > 0);

		foreach($batchCurl as $site => $curl) {
			$content = curl_multi_getcontent($curl);
			if (!$content) {
				error_log("no content for $site. error?");
			}
			$matches = getTrackerMatches($trackers, $content);
			foreach ($matches as $match) {
				echo "$match\n";
			}
			curl_multi_remove_handle($multi, $curl);
		}

		error_log("batch $i took " . round(microtime(true) - $started));

		curl_multi_close($multi);
	}
	return $results;
}

function getTrackerMatches(Array $trackers, $content) {
	$results = array();
	//$start = microtime(true);
	foreach($trackers as $name => $pattern) {
		//echo "matching $name => $pattern\n";
		if (preg_match($pattern, $content)) {
			$results[] = $name;
		}
	}
	//error_log("Parsing took " . round(microtime(true) - $start) . "s");
	return array_unique($results);
}

function getPageContentCurl($url) {
	$curl     = curl_init($url);
	$curlOpts = array(
		CURLOPT_RETURNTRANSFER => true,
		// we don't want a bad site slowing down the batch but i do have an uber 
		// slow internet connection
		CURLOPT_TIMEOUT        => 30,
		// some sites (e.g. google) will redirect us to localized domains.
		// we might miss data by not processing the redirect placeholder but 
		// it's unlikely given a browser wouldn't normally bother rendering the 
		// content of a 3XX 
		// ideally we need to run this same test from multiple locales
		CURLOPT_FOLLOWLOCATION => true,
		CURLOPT_MAXREDIRS      => 5,
		// let's at least pretend to be an average user. we're not hitting 
		// enough pages for this to matter but there is always the chance that 
		// the sites we are hitting are performing content negotiation
		CURLOPT_USERAGENT      => 'Mozilla/5.0 (Windows; U; MSIE 9.0; WIndows NT 9.0; en-US)'
	);
	curl_setopt_array($curl, $curlOpts);
	return $curl;
}





