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

$utc = new DateTimeZone('UTC');
//$start = new DateTime("@1359327600");
//$end = new DateTime("@1359331200");

$positive_count_field = 'positive';
$negative_count_field = 'negative';
$neutral_count_field = 'neutral';
$count_field = 'count';
$time_field = 'binned_time';
$result = $db->get_grouped_originals_in_interval($start, $end, $interval);

$perf->start('processing');

$bins = array();

$next_bin = (int)$params->from;
while ($row = $result->fetch_assoc()) {

    $binned_time = $row[$time_field];

    while ($next_bin !== $binned_time) {
        $bin = new TimeBin($next_bin);
        $bin->groups[] = new SentimentGroup(1);
        $bin->groups[] = new SentimentGroup(-1);
        $bin->groups[] = new SentimentGroup(0);
        $bins[] = $bin;

        $next_bin += $interval;
    }

    $current_bin = new TimeBin($binned_time);
    $current_bin->count = $row[$count_field];

    $positive_group = new SentimentGroup(1);
    $positive_group->count = (int)$row[$positive_count_field];
    $current_bin->groups[] = $positive_group;

    $negative_group = new SentimentGroup(-1);
    $negative_group->count = (int)$row[$negative_count_field];
    $current_bin->groups[] = $negative_group;

    $neutral_group = new SentimentGroup(1);
    $neutral_group->count = (int)$row[$neutral_count_field];
    $current_bin->groups[] = $neutral_group;

    $bins[] = $current_bin;

    $next_bin += $params->interval;
}
$result->free();

$perf->stop('processing');

$request->response($bins);
