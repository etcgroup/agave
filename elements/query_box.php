<?php

function query_box($name)
{
    ob_start();
    ?>
    <form class="query form-inline">
<!--        <label>--><?php //echo $name ?><!--</label>-->
        <button type="button" class="btn btn-success query-update"><i class="icon-search"></i></button>
        <input class="query-search" type="search" placeholder="Search tweet text"/>
        <input class="query-author" type="text" placeholder="@author"/>
        <label class="checkbox" title="Check to view retweets">
            <input class="query-rt" type="checkbox"> RT?
        </label>
        <label class="" title="Filter tweets with less than this many retweets">
            <input class="query-minrt" type="number" min="0" max="10" value="0"/> RTs
        </label>
        <select class="query-sentiment">
            <option selected="selected"></option>
            <option value="positive">pos</option>
            <option value="neutral">neut</option>
            <option value="negative">neg</option>
        </select>
    </form>
    <?php
    return ob_get_clean();
}
