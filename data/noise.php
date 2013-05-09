<?php
/**
 * noise.php is used to retrieve counts of "noisey" tweets
 * over time.
 *
 * For now, noisey tweets are tweets with less than some threshold number
 * of retweets.
 *
 * The noisy tweets are binned by time and the tweet count in
 * each bin is returned.
 */

include_once 'util/data.php';
include_once 'util/request.php';

$request = new Request();
$perf = $request->timing();
$db = $request->db();

/**
 * Requests to /noise.php should provide the binned time parameters:
 * from, to, and interval.
 *
 * Additionally, requests should provide a noise_threshold,
 * used to filter the result to tweets with no more than this many retweets.
 *
 * Optionally, a text search parameter can be provided.
 */
$params = $request->get(array('noise_threshold'), array('search'));
$timeParams = $request->binnedTimeParams();

$from = $timeParams->from;
$to = $timeParams->to;
$interval = $timeParams->interval;
$noise_threshold = (int) $params->noise_threshold;
$search = $params->search;

//Field name constants
$count_field = 'count';
$time_field = 'binned_time';
$result = $db->get_grouped_noise($from, $to, $interval, $noise_threshold, $search);

$perf->start('processing');

//We're only getting a single series of counts
//so the id doesn't matter.
$group = new CountGroup(0);

//Initialize all bins to 0
$next_bin = $from->getTimestamp();
$end = $to->getTimestamp();
while ($next_bin < $end)
{
    $group->add_bin($next_bin);

    $next_bin += $interval;
}

foreach ($result as $row)
{

    $binned_time = $row[$time_field];

    $current_bin = $group->get_bin_at($binned_time);

    $current_bin->count = $row[$count_field] / (double)$interval;

    $next_bin += $interval;
}


$perf->stop('processing');

$request->response($group->values);
