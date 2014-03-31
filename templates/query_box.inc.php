<?php
if(basename(__FILE__) == basename($_SERVER['PHP_SELF'])){exit();}

function query_box($name)
{
    ob_start();
    ?>
    <form class="query form-inline row">
        <div class="left-group">
            <div class="search-wrapper input-append tooltip-me" title="Search tweets by keyword">
                <input class="query-search" type="search" placeholder="Search tweet text"/>
                <span class="add-on">
                    <i class="icon-search icon-white"></i>
                </span>
            </div>
            <div class="author-wrapper input-append tooltip-me" title="Search tweets by author" >
                <input class="query-author" type="text" placeholder="@author"/>
                <span class="add-on">
                    <i class="icon-search icon-white"></i>
                </span>
            </div>
            <label class="rt-wrapper checkbox tooltip-me" title="Check to view retweets">
                <input class="query-rt" type="checkbox"> Show RTs
            </label>
        </div>
<!--        <label class="" title="Filter tweets with less than this many retweets">-->
<!--            <input class="query-minrt" type="number" min="0" value="0"/> Times RTed-->
<!--        </label>-->

        <div class="right-group">
            <span class="sentiment-icon"></span>
            <select class="query-sentiment tooltip-me" title="Refine search by sentiment">
                <option value="" selected="selected">all</option>
                <option value="1">pos</option>
                <option value="0">neut</option>
                <option value="-1">neg</option>
            </select>
        </div>
    </form>
    <?php
    return ob_get_clean();
}
