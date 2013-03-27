<?php

include_once 'util/queries.php';
include_once 'util/data.php';
include_once 'util/request.php';

$request = new Request();
$params = $request->get(
        array('from', 'to', 'interval')
);

$from = new DateTime("@$params->from");
$to = new DateTime("@$params->to");
$interval = (int) $params->interval;

$perf = $request->timing();
$db = new Queries('db.ini');
$db->record_timing($perf);

$count_field = 'count';
$time_field = 'binned_time';
$positive_count_field = 'positive';
$negative_count_field = 'negative';
$neutral_count_field = 'neutral';

$histograms = array();
$end = (int) $params->to;
for ($current_start = (int) $params->from; $current_start < $end; $current_start += $interval)
{
    $current_stop = $current_start + $interval;

    $tweets_from = new DateTime("@$current_start");
    $tweets_to = new DateTime("@$current_stop");

    $result = $db->get_grouped_retweets_of_range($tweets_from, $tweets_to,
            $from, $to, $interval);

    $perf->start('processing');

    $groups = new GroupedSeries();

    $next_bin = (int) $params->from;
    while ($next_bin < $end)
    {
        $groups->get_group(1)->add_bin($next_bin);
        $groups->get_group(0)->add_bin($next_bin);
        $groups->get_group(-1)->add_bin($next_bin);

        $next_bin += $interval;
    }

    $next_bin = (int) $params->from;
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

    $histograms[] = $groups;
    $perf->stop('processing');
}
$request->response($histograms);
