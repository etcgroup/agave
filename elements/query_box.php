<?php

function query_box($name)
{
    ob_start();
    ?>
    <form class="query form-inline row">
<!--        <label>--><?php //echo $name ?><!--</label>-->
        <i class="icon-search icon-white"></i>
        <input class="query-search tooltip-me" title="Search tweets by keyword" type="search" placeholder="Search tweet text"/>
        <input class="query-author tooltip-me" title="Search tweets by author" type="text" placeholder="@author"/>
        <label class="checkbox tooltip-me" title="Check to view retweets">
            <input class="query-rt" type="checkbox"> Show RTs
        </label>
<!--        <label class="" title="Filter tweets with less than this many retweets">-->
<!--            <input class="query-minrt" type="number" min="0" value="0"/> Times RTed-->
<!--        </label>-->
        <select class="query-sentiment tooltip-me" title="Refine search by sentiment">
            <option value="" selected="selected">all</option>
            <option value="1">pos</option>
            <option value="0">neut</option>
            <option value="-1">neg</option>
        </select>
        <i class="icon-heart icon-white"></i>
    </form>
    <?php
    return ob_get_clean();
}
