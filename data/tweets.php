<?php

include_once 'util/queries.php';
include_once 'util/data.php';
include_once 'util/request.php';

$request = new Request();
$params = $request->get(array('from', 'to'), array('noise_threshold'));


$start = new DateTime("@$params->from");
$end = new DateTime("@$params->to");
$noise_threshold = $params->noise_threshold;
if ($noise_threshold === NULL)
{
    $noise_threshold = 0;
}

$perf = $request->timing();
$db = new Queries('localhost', 'root', '', 'twitter_sagawards');
$db->record_timing($perf);

$utc = new DateTimeZone('UTC');

$result = $db->get_originals($start, $end, $noise_threshold);

$perf->start('processing');

$tweets = array();
while ($row = $result->fetch_assoc())
{
    $tweets[] = $row;
}
$result->free();

$perf->stop('processing');

$request->response($tweets);
