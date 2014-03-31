<?php
if(basename(__FILE__) == basename($_SERVER['PHP_SELF'])){exit();}

/**
 * Given a unix time stamp, return the nice time ago string.
 *
 * Plagiarized from here: http://css-tricks.com/snippets/php/time-ago-function/
 *
 * @param $time
 * @return string
 */
function ago($time, $short = FALSE)
{
    $periods = array("second", "minute", "hour", "day", "week", "month", "year", "decade");

    if ($short) {
        $periods = array("s", "m", "h", "d", "w", "month", "year", "dec");
    }

    $lengths = array("60", "60", "24", "7", "4.35", "12", "10");

    $now = time();

    $difference = $now - $time;
    $tense = "ago";

    for ($j = 0; $difference >= $lengths[$j] && $j < count($lengths) - 1; $j++) {
        $difference /= $lengths[$j];
    }

    $difference = round($difference);

    //If plural and we're using long labels or short labels past months...
    if (!($short && $j < 5)) {
        if ($difference != 1) {
            $periods[$j] .= "s";
        }

        //use a space in between
        return "$difference $periods[$j]";
    } else {
        //no space, no plural
        return "$difference$periods[$j]";
    }


}