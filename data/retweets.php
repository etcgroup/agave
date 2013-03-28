<?php

include_once 'util/queries.php';
include_once 'util/data.php';
include_once 'util/request.php';

$request = new Request();
$params = $request->get(
        array(), array('of_id', 'of_from', 'of_to', 'query')
);

$timeParams = $request->binnedTimeParams();

$from = $timeParams->from;
$to = $timeParams->to;
$interval = $timeParams->interval;

$perf = $request->timing();
$db = new Queries('db.ini');
$db->record_timing($perf);

$count_field = 'count';
$time_field = 'binned_time';
$positive_count_field = 'positive';
$negative_count_field = 'negative';
$neutral_count_field = 'neutral';

if ($params->of_id !== NULL)
{
    $result = $db->get_grouped_retweets_of_id($params->of_id, $from, $to,
            $interval);
    $hasSentiment = FALSE;
}
else if ($params->of_from !== NULL && $params->of_to !== NULL)
{
    $tweets_from = new DateTime("@$params->of_from");
    $tweets_to = new DateTime("@$params->of_to");
    $result = $db->get_grouped_retweets_of_range($tweets_from, $tweets_to,
            $from, $to, $interval);
    $hasSentiment = TRUE;
}
else
{
    $result = $db->get_grouped_retweets($from, $to, $interval, $params->query);
    $hasSentiment = FALSE;
}

$perf->start('processing');

if ($hasSentiment)
{
    $groups = new GroupedSeries();
}

$totals = array();

$next_bin = $from->getTimestamp();
$end = (int) $to->getTimestamp();
while ($next_bin < $end)
{
    if ($hasSentiment)
    {
        $groups->get_group(1)->add_bin($next_bin);
        $groups->get_group(0)->add_bin($next_bin);
        $groups->get_group(-1)->add_bin($next_bin);
    }

    $totals[] = new CountBin($next_bin);

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

    $current_bin = $totals[$bin_index];
    $current_bin->count = $row[$count_field];

    if ($hasSentiment)
    {
        $positive_bin = $groups->get_group(1)->get_bin($bin_index);
        $positive_bin->count = (int) $row[$positive_count_field];

        $negative_bin = $groups->get_group(-1)->get_bin($bin_index);
        $negative_bin->count = (int) $row[$negative_count_field];

        $neutral_bin = $groups->get_group(0)->get_bin($bin_index);
        $neutral_bin->count = (int) $row[$neutral_count_field];
    }

    $next_bin += $interval;
    $bin_index += 1;
}
$result->free();

$perf->stop('processing');

if ($hasSentiment) {
    $request->response(array(
        'totals' => $totals,
        'groups' => $groups
    ));
} else {
    $request->response($totals);
}
