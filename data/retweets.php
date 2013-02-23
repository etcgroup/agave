<?php

include_once 'util/queries.php';
include_once 'util/data.php';
include_once 'util/request.php';

$request = new Request();
$params = $request->get(array('from', 'to', 'interval'));

$start = new DateTime("@$params->from");
$end = new DateTime("@$params->to");
$interval = (int)$params->interval;

$perf = $request->timing();
$db = new Queries('localhost', 'root', '', 'twitter_sagawards');
$db->record_timing($perf);

$count_field = 'count';
$time_field = 'binned_time';
$result = $db->get_grouped_retweets($start, $end, $interval);

$perf->start('processing');

$bins = array();

$next_bin = (int)$params->from;
while ($row = $result->fetch_assoc()) {

    $binned_time = $row[$time_field];

    while ($next_bin !== $binned_time) {
        $bin = new TimeBin($next_bin);
        $bins[] = $bin;

        $next_bin += $interval;
    }

    $current_bin = new TimeBin($binned_time);
    $current_bin->count = $row[$count_field];

    $bins[] = $current_bin;

    $next_bin += $params->interval;
}
$result->free();

$perf->stop('processing');

$request->response($bins);
