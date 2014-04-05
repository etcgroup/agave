<?php
if (basename(__FILE__) == basename($_SERVER['PHP_SELF'])) exit();

if ($request->is_env('development')) {
    $perf = $request->performance();
    $db->record_timing($perf);
}

$corpus_info = $db->get_corpus_info();
$corpus_stats = $db->get_corpus_stats();

$corpora = $db->get_corpora();

$user_data = $request->user_data();
$db->log_action('load', $user_data);

//Load in template functions
include_once 'templates/about_content.inc.php';
include_once 'templates/base.inc.php';

$app_css_url = $request->stat('css/about.css', TRUE);
$app_js_url = $request->stat('js/about.js', TRUE);
$page = array(
    'title' => "Agave",
    'content' => about_content($request, $router, $corpora),
    'app_js' => about_javascript($router, $user_data),
    'js_file' => $app_js_url,
    'css_file' => $app_css_url
);

echo base_page($request, $page);
