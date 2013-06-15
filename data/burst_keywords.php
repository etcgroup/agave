<?php
/**
 * burst_keywords.php gets burst keywords in a time range.
 *
 */
include_once '../util/data.inc.php';
include_once '../util/request.inc.php';

$request = new Request();
$perf = $request->timing();
$db = $request->db();

/**
 * Required parameters: grouped time parameters (from, to, window_size) and limit.
 * Optional: noise_threshold and search.
 */
$params = $request->get(array('window_size'), array('limit'));
$timeParams = $request->timeParameters();

$from = $timeParams->from;
$to = $timeParams->to;
$window_size = $params->window_size;
$limit = $params->limit;

$result = $db->get_burst_keywords($window_size, $from, $to, $limit ?: 10);

$perf->start('processing');

$keywords = array();
foreach ($result as $row)
{
    //Convert the mid_point unix timestamp field to ms
    $row['mid_point'] = $row['mid_point'] * 1000;
    $keywords[] = $row;
}


$perf->stop('processing');

$request->response($keywords);
