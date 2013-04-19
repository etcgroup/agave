<?php

include_once 'util/queries.php';
include_once 'util/data.php';
include_once 'util/request.php';

$request = new Request();
$params = $request->get(array('limit'), array('noise_threshold', 'search'));
$timeParams = $request->timeParameters();

$from = $timeParams->from;
$to = $timeParams->to;
$limit = $params->limit;
$noise_threshold = $params->noise_threshold;
$search = $params->search;
if ($noise_threshold === NULL)
{
    $noise_threshold = 0;
}

$perf = $request->timing();
$db = new Queries('db.ini');
$db->record_timing($perf);

$utc = new DateTimeZone('UTC');

$result = $db->get_originals($from, $to, $limit, $noise_threshold, $search);

$perf->start('processing');

$tweets = array();
while ($row = $result->fetch_assoc())
{
    $tweets[] = $row;
}
$result->free();

$perf->stop('processing');

$request->response($tweets);
