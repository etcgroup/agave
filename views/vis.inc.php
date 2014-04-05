<?php
if (basename(__FILE__) == basename($_SERVER['PHP_SELF'])) exit();

if ($request->is_env('development')) {
    $perf = $request->performance();
    $db->record_timing($perf);
}

$corpus_info = $db->get_corpus_info();
$corpus_stats = $db->get_corpus_stats();

$user_data = $request->user_data();
$db->log_action('load', $user_data);

//Load in template functions
include_once 'templates/vis_content.inc.php';
include_once 'templates/nav_bar.inc.php';
include_once 'templates/base.inc.php';

$app_css_url = $request->stat('css/main.css', TRUE);
$app_js_url = $request->stat('js/main.js', TRUE);
$page = array(
    'title' => "Agave: ${corpus_info['name']}",
    'nav' => nav_bar($corpus_info['name'], $corpus_stats, $router),
    'content' => vis_content($request),
    'css_file' => $app_css_url,
    'js_file' => $app_js_url,
    'app_js' => vis_app_javascript($router, $user_data, $corpus_info['id'], $corpus_stats)
);

echo base_page($request, $page);
