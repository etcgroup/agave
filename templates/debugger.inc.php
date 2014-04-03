<?php
ini_set('xdebug.var_display_max_depth', 6);

$sections = array(
    'performance' => array('Query Performance', 'var_dump($request->performance()->finalize());'),
    'config' => array('$config', 'var_dump($config);'),
    'router' => array('$router', 'var_dump($router);'),
    'corpus_info' => array('$corpus_info', 'var_dump($corpus_info);'),
    'get' => array('$_GET', 'var_dump($_GET);'),
    'post' => array('$_POST', 'var_dump($_POST);'),
    'server' => array('$_SERVER', 'var_dump($_SERVER);'),
    'cookie' => array('$_COOKIE', 'var_dump($_COOKIE);')
);

ob_start();
phpinfo(INFO_GENERAL | INFO_CONFIGURATION | INFO_MODULES | INFO_ENVIRONMENT);
$phpinfo = ob_get_clean();

?>
<div class="modal hide fade" id="debugger-info" style="z-index:4000000000;width:750px;margin-left:-375px;color:#333">
    <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
        <h3>Debugging Info</h3>
    </div>
    <div class="modal-body" style="max-height:600px">
        <div class="accordion" id="debugger-info-accordion">
            <?php foreach ($sections as $key => $group) {
                $title = $group[0];
                $eval = $group[1];
                ?>
                <div class="accordion-group">
                    <div class="accordion-heading">
                        <a class="accordion-toggle" data-toggle="collapse" data-parent="#debugger-info-accordion"
                           href="#debugger-info-<?php echo $key; ?>">
                            <h4><?php echo $title; ?></h4>
                        </a>
                    </div>
                    <div id="debugger-info-<?php echo $key; ?>" class="accordion-body collapse">
                        <div class="accordion-inner">
                            <?php eval($eval); ?>
                        </div>
                    </div>
                </div>
            <?php } ?>
            <div class="accordion-group">
                <div class="accordion-heading">
                    <a class="accordion-toggle" data-toggle="collapse" data-parent="#debugger-info-accordion"
                       href="#debugger-info-phpinfo">
                        <h4>phpinfo()</h4>
                    </a>
                </div>
                <div id="debugger-info-phpinfo" class="accordion-body collapse">
                    <div class="accordion-inner">
                        <iframe src="data:text/html;base64,<?php echo base64_encode($phpinfo); ?>"
                            height="400" width="670"
                            frameborder="none"></iframe>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="modal-footer">
        <a href="#" class="btn" data-dismiss="modal">Close</a>
    </div>
</div>
<div
    style="position:absolute;width:16px;height:16px;right:0;bottom:0;background:white;color:darkgreen;text-align:center;font-weight:bold;cursor:pointer"
    data-toggle="modal" data-target="#debugger-info">D
</div>
