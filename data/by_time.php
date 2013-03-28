<?php

include_once 'util/queries.php';
include_once 'util/data.php';
include_once 'util/request.php';

$request = new Request();
$params = $request->get(array('noise_threshold'), array('query'));
$timeParams = $request->binnedTimeParams();

$from = $timeParams->from;
$to = $timeParams->to;
$interval = $timeParams->interval;
$noise_threshold = (int) $params->noise_threshold;

$perf = $request->timing();
$db = new Queries('db.ini');
$db->record_timing($perf);

$positive_count_field = 'positive';
$negative_count_field = 'negative';
$neutral_count_field = 'neutral';
$count_field = 'count';
$time_field = 'binned_time';
$result = $db->get_grouped_originals($from, $to, $interval, $noise_threshold, $params->query);

$perf->start('processing');

$groups = new GroupedSeries();

$next_bin = $from->getTimestamp();
$end = $to->getTimestamp();

//Initialize all the bins
while ($next_bin < $end)
{
    $groups->get_group(1)->add_bin($next_bin);
    $groups->get_group(0)->add_bin($next_bin);
    $groups->get_group(-1)->add_bin($next_bin);

    $next_bin += $interval;
}

$next_bin = $from->getTimestamp();
$bin_index = 0;
while ($row = $result->fetch_assoc())
{
    $binned_time = $row[$time_field];

    while ($next_bin !== $binned_time)
    {
        $bin_index += 1;
        $next_bin += $interval;
    }

    $positive_bin = $groups->get_group(1)->get_bin($bin_index);
    $positive_bin->count = (int) $row[$positive_count_field];

    $negative_bin = $groups->get_group(-1)->get_bin($bin_index);
    $negative_bin->count = (int) $row[$negative_count_field];

    $neutral_bin = $groups->get_group(0)->get_bin($bin_index);
    $neutral_bin->count = (int) $row[$neutral_count_field];

    $next_bin += $interval;
    $bin_index += 1;
}
$result->free();

$perf->stop('processing');

$request->response($groups->groups_array());
