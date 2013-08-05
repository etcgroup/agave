<?php
/**
 * bursts.php provides burst annotations.
 */


include_once '../util/data.inc.php';
include_once '../util/request.inc.php';

$request = new Request();

//Initialize the db connection
$db = $request->db();
//Get the performance tracker
$perf = $request->timing();

$params = $request->get(array(), array('max_value'));
$max_value = $params->max_value;
if ($max_value === NULL) {
    $max_value = 1;
}

$bursts = array();

$result = $db->get_annotations(TRUE, $max_value);

$perf->start('processing');

foreach($result as $row) {
    $row['created'] *= 1000; //convert to ms
    $row['time'] *= 1000;

    //Fill in possibly null user data
    if ($row['name'] === NULL) {
        $row['name'] = $row['user'];
    }

    if ($row['screen_name'] === NULL) {
        $row['screen_name'] = $row['user'];
    }

    $series = $row['series'];
    if (!isset($bursts[$series])) {
        $bursts[$series] = array();
    }
    $bursts[$series][] = $row;
}

$perf->stop('processing');

$array_bursts = array();
foreach ($bursts as $name => $series) {
    $array_bursts[] = array(
        'name' => $name,
        'values' => $series
    );
}

$request->response($array_bursts);